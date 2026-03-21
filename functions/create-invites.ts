import { db, getUser } from '@run402/functions';

export default async (req: Request) => {
  const user = getUser(req);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const [profile] = await db.from("profiles").select("role_key").eq("user_id", user.id);
  if (!profile || profile.role_key !== "owner_admin") {
    return new Response(JSON.stringify({ error: "Only owner/admin can create invites" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const body = await req.json();
  const { invites } = body;

  if (!Array.isArray(invites) || invites.length === 0) {
    return new Response(JSON.stringify({ error: "invites array is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const results = [];
  const baseUrl = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";

  for (const inv of invites) {
    if (!inv.role_key || !["staff", "resident"].includes(inv.role_key)) {
      results.push({ email: inv.email, error: "Invalid role_key — must be staff or resident" });
      continue;
    }

    const [invite] = await db.from("invites").insert({
      email: inv.email || null,
      full_name: inv.full_name || null,
      role_key: inv.role_key,
      invited_by_user_id: user.id,
      metadata: inv.space_ids ? { space_ids: inv.space_ids } : {},
    });

    const claimUrl = `${baseUrl}/claim?token=${invite.token}`;

    results.push({
      id: invite.id,
      email: inv.email,
      full_name: inv.full_name,
      role_key: inv.role_key,
      token: invite.token,
      claim_url: claimUrl,
      expires_at: invite.expires_at,
    });
  }

  return new Response(JSON.stringify({ invites: results }), { status: 201, headers: { "Content-Type": "application/json" } });
};
