import { db, getUser } from '@run402/functions';

export default async (req: Request) => {
  const user = getUser(req);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const body = await req.json();
  const { title, description, property_id, space_id, category_key, priority_key, location_detail, entry_preference_key, pets_present, preferred_visit_window, access_instructions, attachments: attachmentMeta } = body;

  if (!title || !property_id) {
    return new Response(JSON.stringify({ error: "title and property_id are required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Look up caller's profile
  const [profile] = await db.from("profiles").select("user_id,full_name,email,phone,role_key").eq("user_id", user.id);
  if (!profile) {
    return new Response(JSON.stringify({ error: "Profile not found — redeem your invite first" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  // Residents can only submit for spaces they occupy
  if (profile.role_key === "resident" && space_id) {
    const occupancies = await db.from("space_occupancies").select("id").eq("profile_user_id", user.id).eq("space_id", space_id);
    if (occupancies.length === 0) {
      return new Response(JSON.stringify({ error: "You are not assigned to this space" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }
  }

  // Check if requester can select priority
  const [settings] = await db.from("app_settings").select("allow_requester_priority_selection");
  const effectivePriority = (profile.role_key === "resident" && !settings?.allow_requester_priority_selection)
    ? "normal"
    : (priority_key || "normal");

  // Get SLA hours from priority
  const [priority] = await db.from("priority_levels").select("target_first_response_hours,target_resolution_hours").eq("key", effectivePriority);
  const now = new Date();
  const firstResponseDue = priority?.target_first_response_hours
    ? new Date(now.getTime() + priority.target_first_response_hours * 3600000).toISOString()
    : null;
  const resolutionDue = priority?.target_resolution_hours
    ? new Date(now.getTime() + priority.target_resolution_hours * 3600000).toISOString()
    : null;

  // Insert request
  const [request] = await db.from("maintenance_requests").insert({
    title,
    description: description || null,
    property_id,
    space_id: space_id || null,
    category_key: category_key || null,
    priority_key: effectivePriority,
    status_key: "submitted",
    source_key: "portal",
    requester_profile_user_id: user.id,
    requester_name: body.requester_name || profile.full_name,
    requester_email: body.requester_email || profile.email,
    requester_phone: body.requester_phone || profile.phone,
    created_by_user_id: user.id,
    location_detail: location_detail || null,
    entry_preference_key: entry_preference_key || null,
    pets_present: pets_present ?? null,
    preferred_visit_window: preferred_visit_window || null,
    access_instructions: access_instructions || null,
    first_response_due_at: firstResponseDue,
    resolution_due_at: resolutionDue,
  });

  // Log event
  await db.from("request_events").insert({
    request_id: request.id,
    actor_user_id: user.id,
    event_type: "submitted",
    visibility: "public",
    summary: "Request submitted",
  });

  // Register attachments if provided
  if (Array.isArray(attachmentMeta)) {
    for (const att of attachmentMeta) {
      await db.from("attachments").insert({
        request_id: request.id,
        uploaded_by_user_id: user.id,
        visibility: "public",
        bucket: att.bucket || "request-photos",
        object_path: att.object_path,
        file_name: att.file_name || null,
        mime_type: att.mime_type || null,
        size_bytes: att.size_bytes || null,
        width: att.width || null,
        height: att.height || null,
      });
    }
  }

  return new Response(JSON.stringify(request), { status: 201, headers: { "Content-Type": "application/json" } });
};
