import { db, getUser } from '@run402/functions';

export default async (req: Request) => {
  const user = getUser(req);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const [profile] = await db.from("profiles").select("role_key").eq("user_id", user.id);
  if (!profile || !["owner_admin", "staff"].includes(profile.role_key)) {
    return new Response(JSON.stringify({ error: "Staff or admin access required" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const body = await req.json();
  const { request_id } = body;
  if (!request_id) {
    return new Response(JSON.stringify({ error: "request_id is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const [existing] = await db.from("maintenance_requests").select("*").eq("id", request_id);
  if (!existing) {
    return new Response(JSON.stringify({ error: "Request not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  const allowedFields = ["category_key", "priority_key", "assignee_user_id", "vendor_id", "scheduled_start_at", "scheduled_end_at", "resolution_due_at", "location_detail", "entry_preference_key", "access_instructions", "requester_name", "requester_email", "requester_phone"];
  const updates: Record<string, unknown> = {};
  const events: Array<{ event_type: string; summary: string; visibility: string }> = [];

  for (const field of allowedFields) {
    if (body[field] !== undefined && body[field] !== existing[field]) {
      updates[field] = body[field];
      if (field === "assignee_user_id") {
        events.push({ event_type: "assigned", summary: `Assignee updated`, visibility: "internal" });
      } else if (field === "vendor_id") {
        events.push({ event_type: "vendor_assigned", summary: `Vendor updated`, visibility: "internal" });
      } else if (field === "priority_key") {
        events.push({ event_type: "priority_changed", summary: `Priority changed to ${body[field]}`, visibility: "public" });
      } else if (field === "scheduled_start_at" || field === "scheduled_end_at") {
        events.push({ event_type: "schedule_changed", summary: `Schedule updated`, visibility: "public" });
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify(existing), { headers: { "Content-Type": "application/json" } });
  }

  updates.updated_at = new Date().toISOString();

  // If priority changed, update SLA due dates
  if (updates.priority_key) {
    const [newPriority] = await db.from("priority_levels").select("target_first_response_hours,target_resolution_hours").eq("key", updates.priority_key);
    if (newPriority && !existing.first_responded_at) {
      updates.first_response_due_at = new Date(new Date(existing.created_at).getTime() + newPriority.target_first_response_hours * 3600000).toISOString();
    }
    if (newPriority) {
      updates.resolution_due_at = new Date(new Date(existing.created_at).getTime() + newPriority.target_resolution_hours * 3600000).toISOString();
    }
  }

  const [updated] = await db.from("maintenance_requests").update(updates).eq("id", request_id);

  for (const evt of events) {
    await db.from("request_events").insert({
      request_id,
      actor_user_id: user.id,
      event_type: evt.event_type,
      visibility: evt.visibility,
      summary: evt.summary,
    });
  }

  return new Response(JSON.stringify(updated), { headers: { "Content-Type": "application/json" } });
};
