import { db, getUser } from '@run402/functions';

export default async (req: Request) => {
  const user = getUser(req);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const [profile] = await db.from("profiles").select("role_key,full_name").eq("user_id", user.id);
  if (!profile) {
    return new Response(JSON.stringify({ error: "Profile not found" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const body = await req.json();
  const { request_id, visibility, body: commentBody, attachments: attachmentMeta } = body;

  if (!request_id || !commentBody) {
    return new Response(JSON.stringify({ error: "request_id and body are required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const effectiveVisibility = visibility || "public";

  // Residents can only add public comments
  if (profile.role_key === "resident" && effectiveVisibility === "internal") {
    return new Response(JSON.stringify({ error: "Residents can only add public comments" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  // Verify request exists and resident owns it
  const [request] = await db.from("maintenance_requests").select("id,requester_profile_user_id").eq("id", request_id);
  if (!request) {
    return new Response(JSON.stringify({ error: "Request not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }
  if (profile.role_key === "resident" && request.requester_profile_user_id !== user.id) {
    return new Response(JSON.stringify({ error: "You can only comment on your own requests" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  // Create comment
  const [comment] = await db.from("request_comments").insert({
    request_id,
    author_user_id: user.id,
    visibility: effectiveVisibility,
    body: commentBody,
  });

  // Register attachments
  if (Array.isArray(attachmentMeta)) {
    for (const att of attachmentMeta) {
      await db.from("attachments").insert({
        request_id,
        comment_id: comment.id,
        uploaded_by_user_id: user.id,
        visibility: effectiveVisibility,
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

  // Log event
  await db.from("request_events").insert({
    request_id,
    actor_user_id: user.id,
    event_type: "comment_added",
    visibility: effectiveVisibility,
    summary: `${effectiveVisibility === "internal" ? "Internal note" : "Comment"} by ${profile.full_name || "user"}`,
  });

  // Update request timestamp
  await db.from("maintenance_requests").update({ updated_at: new Date().toISOString() }).eq("id", request_id);

  return new Response(JSON.stringify(comment), { status: 201, headers: { "Content-Type": "application/json" } });
};
