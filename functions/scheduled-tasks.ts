import { db, email } from '@run402/functions';

/**
 * Combined scheduled function — runs every 4 hours.
 * 1. SLA overdue check (every run)
 * 2. Daily digest (only on the first run of the day, roughly 4-8 AM UTC)
 */
export default async (_req: Request) => {
  const [settings] = await db.from("app_settings").select("app_name").eq("id", 1);
  const appName = settings?.app_name || "SkMeld";

  const slaResult = await checkSlaOverdue(appName);
  const digestResult = await maybeSendDailyDigest(appName);

  return new Response(JSON.stringify({ sla: slaResult, digest: digestResult }), {
    headers: { "Content-Type": "application/json" },
  });
};

// ── SLA Overdue Check ──────────────────────────────────────────

async function checkSlaOverdue(appName: string) {
  const overdueResult = await db.sql(`
    SELECT r.id, r.request_number, r.title, r.assignee_user_id,
           r.first_response_due_at, r.first_responded_at,
           r.resolution_due_at, r.resolved_at,
           p.label AS priority_label, s.label AS status_label
    FROM maintenance_requests r
    JOIN status_types s ON s.key = r.status_key
    JOIN priority_levels p ON p.key = r.priority_key
    WHERE r.is_overdue_notified = false
      AND s.is_open = true
      AND (
        (r.first_response_due_at IS NOT NULL AND r.first_responded_at IS NULL AND now() > r.first_response_due_at)
        OR
        (r.resolution_due_at IS NOT NULL AND r.resolved_at IS NULL AND now() > r.resolution_due_at)
      )
  `);

  const overdueRequests = overdueResult.rows;
  if (overdueRequests.length === 0) {
    return { overdue_count: 0, emails_sent: 0 };
  }

  const byAssignee = new Map<string | null, typeof overdueRequests>();
  for (const req of overdueRequests) {
    const key = req.assignee_user_id || null;
    if (!byAssignee.has(key)) byAssignee.set(key, []);
    byAssignee.get(key)!.push(req);
  }

  for (const req of overdueRequests) {
    const eventType = req.first_response_due_at && !req.first_responded_at && new Date() > new Date(req.first_response_due_at)
      ? "sla_overdue_response"
      : "sla_overdue_resolution";

    await db.from("request_events").insert({
      request_id: req.id,
      event_type: eventType,
      visibility: "internal",
      summary: eventType === "sla_overdue_response"
        ? "First response SLA deadline exceeded"
        : "Resolution SLA deadline exceeded",
    });

    await db.from("maintenance_requests").update({ is_overdue_notified: true }).eq("id", req.id);
  }

  let emailsSent = 0;

  for (const [assigneeId, requests] of byAssignee) {
    let recipients: string[] = [];

    if (assigneeId) {
      const [assignee] = await db.from("profiles").select("email").eq("user_id", assigneeId);
      if (assignee?.email) recipients = [assignee.email];
    }

    if (recipients.length === 0) {
      const admins = await db.from("profiles").select("email").eq("role_key", "owner_admin");
      recipients = admins.filter((a: { email: string }) => a.email).map((a: { email: string }) => a.email);
    }

    const requestRows = requests.map((r: typeof overdueRequests[0]) => {
      const overdueType = r.first_response_due_at && !r.first_responded_at && new Date() > new Date(r.first_response_due_at)
        ? "First Response" : "Resolution";
      return `<tr><td>#${r.request_number}</td><td>${r.title}</td><td>${r.priority_label}</td><td>${r.status_label}</td><td>${overdueType}</td></tr>`;
    }).join("\n");

    const html = `
      <h2>Overdue Maintenance Requests</h2>
      <p>${requests.length} request${requests.length > 1 ? "s have" : " has"} exceeded ${requests.length > 1 ? "their" : "its"} SLA deadline.</p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
        <tr style="background:#f3f4f6"><th>#</th><th>Title</th><th>Priority</th><th>Status</th><th>Overdue Type</th></tr>
        ${requestRows}
      </table>
      <p style="color:#6b7280;font-size:12px">This is an automated notification from ${appName}.</p>
    `;

    for (const to of recipients) {
      try {
        await email.send({ to, subject: `[${appName}] ${requests.length} overdue request${requests.length > 1 ? "s" : ""} need attention`, html, from_name: appName });
        emailsSent++;
      } catch { /* continue */ }
    }
  }

  return { overdue_count: overdueRequests.length, emails_sent: emailsSent };
}

// ── Daily Digest (runs once per day) ───────────────────────────

async function maybeSendDailyDigest(appName: string) {
  // Only send digest between 4:00-7:59 AM UTC (the first 4h-window run of the day)
  const hour = new Date().getUTCHours();
  if (hour < 4 || hour >= 8) {
    return { skipped: true, reason: "outside digest window" };
  }

  const statsResult = await db.sql(`
    SELECT
      COUNT(*) FILTER (WHERE s.is_open) AS open_count,
      COUNT(*) FILTER (WHERE s.is_open AND (
        (r.first_response_due_at IS NOT NULL AND r.first_responded_at IS NULL AND now() > r.first_response_due_at)
        OR (r.resolution_due_at IS NOT NULL AND r.resolved_at IS NULL AND now() > r.resolution_due_at)
      )) AS overdue_count,
      COUNT(*) FILTER (WHERE s.is_open AND r.first_responded_at IS NULL) AS awaiting_response_count
    FROM maintenance_requests r
    JOIN status_types s ON s.key = r.status_key
  `);

  const stats = statsResult.rows[0];
  if (!stats || Number(stats.open_count) === 0) {
    return { skipped: true, reason: "no open requests" };
  }

  const requestsResult = await db.sql(`
    SELECT r.request_number, r.title, r.assignee_user_id,
           p.label AS priority_label,
           s.label AS status_label,
           EXTRACT(EPOCH FROM (now() - r.created_at)) / 3600 AS age_hours,
           pr.full_name AS assignee_name
    FROM maintenance_requests r
    JOIN status_types s ON s.key = r.status_key
    JOIN priority_levels p ON p.key = r.priority_key
    LEFT JOIN profiles pr ON pr.user_id = r.assignee_user_id
    WHERE s.is_open = true
    ORDER BY p.sort_order ASC, r.created_at ASC
  `);

  const allRequests = requestsResult.rows;

  const staffProfiles = await db.from("profiles").select("user_id, email, full_name, role_key")
    .in("role_key", ["staff", "owner_admin"]);
  const recipients = staffProfiles.filter((p: { email: string }) => p.email);
  if (recipients.length === 0) return { skipped: true, reason: "no staff with email" };

  const today = new Date().toISOString().split("T")[0];

  function formatAge(hours: number): string {
    if (hours < 1) return "<1h";
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  }

  function buildTable(requests: typeof allRequests): string {
    if (requests.length === 0) return "<p style='color:#6b7280'>No requests assigned to you.</p>";
    const rows = requests.map((r: typeof allRequests[0]) =>
      `<tr><td>#${r.request_number}</td><td>${r.title}</td><td>${r.priority_label}</td><td>${r.status_label}</td><td>${formatAge(Number(r.age_hours))}</td><td>${r.assignee_name || "Unassigned"}</td></tr>`
    ).join("\n");
    return `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
      <tr style="background:#f3f4f6"><th>#</th><th>Title</th><th>Priority</th><th>Status</th><th>Age</th><th>Assignee</th></tr>
      ${rows}</table>`;
  }

  let emailsSent = 0;

  for (const recipient of recipients) {
    const myRequests = allRequests.filter((r: typeof allRequests[0]) => r.assignee_user_id === recipient.user_id);
    const html = `
      <h2>${appName} — Daily Summary</h2>
      <table cellpadding="8" cellspacing="0" style="border-collapse:collapse">
        <tr><td style="font-size:24px;font-weight:bold">${stats.open_count}</td><td>Open requests</td></tr>
        <tr><td style="font-size:24px;font-weight:bold;color:#dc2626">${stats.overdue_count}</td><td>Overdue</td></tr>
        <tr><td style="font-size:24px;font-weight:bold;color:#f59e0b">${stats.awaiting_response_count}</td><td>Awaiting first response</td></tr>
      </table>
      <h3>Your Assigned Requests (${myRequests.length})</h3>
      ${buildTable(myRequests)}
      <h3>All Open Requests (${allRequests.length})</h3>
      ${buildTable(allRequests)}
      <p style="color:#6b7280;font-size:12px">Daily digest from ${appName}.</p>
    `;

    try {
      await email.send({ to: recipient.email, subject: `[${appName}] Daily Summary — ${today}`, html, from_name: appName });
      emailsSent++;
    } catch { /* continue */ }
  }

  return { sent: emailsSent, open_count: Number(stats.open_count) };
}
