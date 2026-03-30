import { db } from '@run402/functions';

export default async (req: Request) => {
  const body = await req.json();
  const user = body?.user;

  if (!user?.id) {
    return new Response(JSON.stringify({ error: "Missing user.id in payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Derive full_name from email local part: "jane.doe@example.com" → "Jane Doe"
  const fullName = user.email
    ? user.email.split("@")[0].split(/[._-]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "New User";

  await db.sql(
    `INSERT INTO profiles (user_id, email, full_name, role_key)
     VALUES ($1, $2, $3, 'resident')
     ON CONFLICT (user_id) DO NOTHING`,
    [user.id, user.email || null, fullName],
  );

  return new Response(JSON.stringify({ created: true, user_id: user.id }), {
    headers: { "Content-Type": "application/json" },
  });
};
