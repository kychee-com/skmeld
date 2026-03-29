import { db, email } from '@run402/functions';

export default async (_req: Request) => {
  // Get aggregate counts
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
    return new Response(JSON.stringify({ message: "No open requests, skipping digest", sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get all open requests with details
  const requestsResult = await db.sql(`
    SELECT r.request_number, r.title, r.assignee_user_id,
           p.label AS priority_label, p.color AS priority_color,
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

  // Get staff/admin recipients
  const staffProfiles = await db.from("profiles").select("user_id, email, full_name, role_key")
    .in("role_key", ["staff", "owner_admin"]);

  const recipients = staffProfiles.filter((p: { email: string }) => p.email);
  if (recipients.length === 0) {
    return new Response(JSON.stringify({ message: "No staff with email addresses", sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Read app name
  const [settings] = await db.from("app_settings").select("app_name").eq("id", 1);
  const appName = settings?.app_name || "SkMeld";

  const today = new Date().toISOString().split("T")[0];

  function formatAge(hours: number): string {
    if (hours < 1) return "<1h";
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  }

  function buildRequestTable(requests: typeof allRequests): string {
    if (requests.length === 0) return "<p style='color:#6b7280'>No requests assigned to you.</p>";
    const rows = requests.map((r: typeof allRequests[0]) =>
      `<tr><td>#${r.request_number}</td><td>${r.title}</td><td>${r.priority_label}</td><td>${r.status_label}</td><td>${formatAge(Number(r.age_hours))}</td><td>${r.assignee_name || "Unassigned"}</td></tr>`
    ).join("\n");
    return `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
        <tr style="background:#f3f4f6"><th>#</th><th>Title</th><th>Priority</th><th>Status</th><th>Age</th><th>Assignee</th></tr>
        ${rows}
      </table>`;
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
      ${buildRequestTable(myRequests)}
      <h3>All Open Requests (${allRequests.length})</h3>
      ${buildRequestTable(allRequests)}
      <p style="color:#6b7280;font-size:12px">Daily digest from ${appName}.</p>
    `;

    try {
      await email.send({
        to: recipient.email,
        subject: `[${appName}] Daily Summary — ${today}`,
        html,
        from_name: appName,
      });
      emailsSent++;
    } catch { /* continue to next recipient */ }
  }

  return new Response(JSON.stringify({
    message: "Daily digest sent",
    recipients: emailsSent,
    open_count: Number(stats.open_count),
    overdue_count: Number(stats.overdue_count),
  }), { headers: { "Content-Type": "application/json" } });
};
