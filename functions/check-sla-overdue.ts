import { db, email } from '@run402/functions';

export default async (_req: Request) => {
  // Find overdue requests not yet notified
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
    return new Response(JSON.stringify({ message: "No overdue requests found", notified: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Group by assignee (null = unassigned)
  const byAssignee = new Map<string | null, typeof overdueRequests>();
  for (const req of overdueRequests) {
    const key = req.assignee_user_id || null;
    if (!byAssignee.has(key)) byAssignee.set(key, []);
    byAssignee.get(key)!.push(req);
  }

  // Log events for each overdue request
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

  // Read app name for email from_name
  const [settings] = await db.from("app_settings").select("app_name").eq("id", 1);
  const appName = settings?.app_name || "SkMeld";

  // Send batched emails per assignee
  let emailsSent = 0;

  for (const [assigneeId, requests] of byAssignee) {
    let recipients: string[] = [];

    if (assigneeId) {
      // Send to the assigned staff member
      const [assignee] = await db.from("profiles").select("email").eq("user_id", assigneeId);
      if (assignee?.email) recipients = [assignee.email];
    }

    if (recipients.length === 0) {
      // Unassigned or assignee has no email — send to all owner_admins
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
        await email.send({
          to,
          subject: `[${appName}] ${requests.length} overdue request${requests.length > 1 ? "s" : ""} need attention`,
          html,
          from_name: appName,
        });
        emailsSent++;
      } catch { /* log but don't fail the whole run */ }
    }
  }

  return new Response(JSON.stringify({
    message: "SLA overdue check complete",
    overdue_count: overdueRequests.length,
    emails_sent: emailsSent,
  }), { headers: { "Content-Type": "application/json" } });
};
