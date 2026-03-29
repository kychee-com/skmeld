import { db, getUser } from '@run402/functions';

export default async (req: Request) => {
  const user = getUser(req);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized — sign up or log in first" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const body = await req.json();
  const { token } = body;

  if (!token) {
    return new Response(JSON.stringify({ error: "token is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Look up invite using service_role (bypasses RLS)
  const inviteResult = await db.sql('SELECT * FROM invites WHERE token = $1', [token]);
  const invite = inviteResult.rows?.[0];

  if (!invite) {
    return new Response(JSON.stringify({ error: "Invalid invite token" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (invite.accepted_at) {
    return new Response(JSON.stringify({ error: "Invite has already been used" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: "Invite has expired" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Create or update profile
  const existingProfile = await db.from("profiles").select("user_id").eq("user_id", user.id);
  if (existingProfile.length > 0) {
    await db.from("profiles").update({
      role_key: invite.role_key,
      full_name: invite.full_name || existingProfile[0].full_name,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);
  } else {
    await db.from("profiles").insert({
      user_id: user.id,
      email: invite.email,
      full_name: invite.full_name,
      role_key: invite.role_key,
    });
  }

  // Create space occupancies if specified
  const spaceIds = invite.metadata?.space_ids;
  if (Array.isArray(spaceIds) && spaceIds.length > 0) {
    for (const spaceId of spaceIds) {
      await db.from("space_occupancies").insert({
        profile_user_id: user.id,
        space_id: spaceId,
        is_primary: spaceIds.indexOf(spaceId) === 0,
      });
    }
  }

  // Mark invite accepted
  await db.from("invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

  // Return profile
  const [profile] = await db.from("profiles").select("*").eq("user_id", user.id);

  return new Response(JSON.stringify({
    profile,
    invite_id: invite.id,
    role_key: invite.role_key,
  }), { headers: { "Content-Type": "application/json" } });
};
