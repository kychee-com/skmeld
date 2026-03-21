import { db, getUser } from '@run402/functions';

export default async (req: Request) => {
  const user = getUser(req);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const [profile] = await db.from("profiles").select("role_key").eq("user_id", user.id);
  if (!profile) {
    return new Response(JSON.stringify({ error: "Profile not found" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const body = await req.json();
  const { request_id, to_status_key, public_note, internal_note, resolution_summary, cancellation_reason } = body;

  if (!request_id || !to_status_key) {
    return new Response(JSON.stringify({ error: "request_id and to_status_key are required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const [request] = await db.from("maintenance_requests").select("*").eq("id", request_id);
  if (!request) {
    return new Response(JSON.stringify({ error: "Request not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  // Residents can only act on their own requests
  if (profile.role_key === "resident" && request.requester_profile_user_id !== user.id) {
    return new Response(JSON.stringify({ error: "You can only update your own requests" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  // Check allowed transition
  const transitions = await db.from("status_transitions")
    .select("id")
    .eq("from_status_key", request.status_key)
    .eq("to_status_key", to_status_key)
    .eq("actor_role_key", profile.role_key);

  if (transitions.length === 0) {
    return new Response(JSON.stringify({ error: `Transition from '${request.status_key}' to '${to_status_key}' is not allowed for ${profile.role_key}` }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Enforce required fields per target status
  if (to_status_key === "waiting_on_resident" && !public_note) {
    return new Response(JSON.stringify({ error: "A public note is required when setting status to waiting on resident" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (to_status_key === "resolved" && !resolution_summary && !public_note) {
    return new Response(JSON.stringify({ error: "A resolution summary or public note is required when resolving" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (to_status_key === "canceled" && !cancellation_reason) {
    return new Response(JSON.stringify({ error: "A cancellation reason is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Build update
  const updates: Record<string, unknown> = {
    status_key: to_status_key,
    updated_at: new Date().toISOString(),
  };

  // Set timestamps
  const now = new Date().toISOString();
  if (!request.first_responded_at && profile.role_key !== "resident") {
    updates.first_responded_at = now;
  }
  if (to_status_key === "resolved") {
    updates.resolved_at = now;
    if (resolution_summary) updates.resolution_summary = resolution_summary;
  }
  if (to_status_key === "closed") {
    updates.closed_at = now;
  }
  if (to_status_key === "canceled") {
    updates.canceled_at = now;
    if (cancellation_reason) updates.cancellation_reason = cancellation_reason;
  }
  // Reopen: clear resolved_at
  if (request.status_key === "resolved" && to_status_key === "triaged") {
    updates.resolved_at = null;
  }

  const [updated] = await db.from("maintenance_requests").update(updates).eq("id", request_id);

  // Get status labels for event summary
  const [fromStatus] = await db.from("request_statuses").select("label").eq("key", request.status_key);
  const [toStatus] = await db.from("request_statuses").select("label").eq("key", to_status_key);
  const isReopen = request.status_key === "resolved" && to_status_key === "triaged";

  await db.from("request_events").insert({
    request_id,
    actor_user_id: user.id,
    event_type: isReopen ? "reopened" : "status_changed",
    visibility: "public",
    summary: isReopen
      ? `Reopened by ${profile.role_key === "resident" ? "resident" : "staff"}`
      : `Status changed from ${fromStatus?.label || request.status_key} to ${toStatus?.label || to_status_key}`,
    payload: { from: request.status_key, to: to_status_key },
  });

  // Add public note as comment if provided
  if (public_note) {
    await db.from("request_comments").insert({
      request_id,
      author_user_id: user.id,
      visibility: "public",
      body: public_note,
    });
  }

  // Add internal note if provided (staff/admin only)
  if (internal_note && ["owner_admin", "staff"].includes(profile.role_key)) {
    await db.from("request_comments").insert({
      request_id,
      author_user_id: user.id,
      visibility: "internal",
      body: internal_note,
    });
  }

  return new Response(JSON.stringify(updated), { headers: { "Content-Type": "application/json" } });
};
