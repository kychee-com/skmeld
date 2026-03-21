import { db } from '@run402/functions';

export default async (req: Request) => {
  const body = await req.json();
  const { admin_email, admin_password, app_name, seed_demo_data } = body;

  const API_BASE = process.env.RUN402_API_BASE || "https://api.run402.com";
  const SERVICE_KEY = process.env.RUN402_SERVICE_KEY || "";
  const ANON_KEY = process.env.RUN402_ANON_KEY || "";

  // Determine the apikey to use for auth endpoints
  // Try to read the anon_key from the request headers (forwarded by gateway)
  const apikey = req.headers.get?.("apikey") || ANON_KEY || SERVICE_KEY;

  const result: Record<string, unknown> = {};

  // 1. Update app settings if app_name provided
  if (app_name) {
    await db.from("app_settings").update({
      app_name,
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    result.app_name = app_name;
  }

  // 2. Create admin user if email provided
  if (admin_email) {
    const password = admin_password || "skmeld-" + Math.random().toString(36).slice(2, 10);

    // Sign up via auth API
    const signupRes = await fetch(`${API_BASE}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey,
      },
      body: JSON.stringify({ email: admin_email, password }),
    });

    if (signupRes.ok) {
      const signupBody = await signupRes.json();
      const userId = signupBody.id;

      // Create profile as owner_admin
      await db.from("profiles").insert({
        user_id: userId,
        email: admin_email,
        full_name: body.admin_name || "Admin",
        role_key: "owner_admin",
      });

      result.admin_user_id = userId;
      result.admin_email = admin_email;
      result.admin_password = password;
      result.message = "Admin account created. Log in with these credentials.";
    } else {
      const errBody = await signupRes.text();
      result.admin_error = `Failed to create admin: ${signupRes.status} ${errBody}`;
    }
  }

  // 3. Seed demo data if requested
  if (seed_demo_data) {
    try {
      // Read and execute demo seed SQL
      // The demo seed is included as a function env var or we inline key data
      await db.sql(`
        -- Demo properties
        INSERT INTO properties (id, name, code, street_1, city, state, postal_code) VALUES
          ('prop_oakridge', 'Oakridge Apartments', 'OAK', '1200 Oak Ridge Dr', 'Austin', 'TX', '78704'),
          ('prop_maplewood', 'Maplewood Townhomes', 'MPL', '345 Maplewood Lane', 'Austin', 'TX', '78745')
        ON CONFLICT DO NOTHING;

        INSERT INTO spaces (id, property_id, name, code, space_type_key, floor) VALUES
          ('spc_oak_101', 'prop_oakridge', 'Unit 101', '101', 'unit', '1'),
          ('spc_oak_102', 'prop_oakridge', 'Unit 102', '102', 'unit', '1'),
          ('spc_oak_201', 'prop_oakridge', 'Unit 201', '201', 'unit', '2'),
          ('spc_mpl_a', 'prop_maplewood', 'Unit A', 'A', 'unit', '1'),
          ('spc_mpl_b', 'prop_maplewood', 'Unit B', 'B', 'unit', '1')
        ON CONFLICT DO NOTHING;

        INSERT INTO vendors (id, name, primary_contact_name, phone, trade_category_key) VALUES
          ('vnd_ace', 'Ace Plumbing', 'Mike Torres', '512-555-0101', 'plumbing'),
          ('vnd_spark', 'Spark Electric', 'Dana Lee', '512-555-0202', 'electrical')
        ON CONFLICT DO NOTHING;

        INSERT INTO maintenance_requests (id, request_number, title, description, property_id, space_id, category_key, priority_key, status_key, requester_name, requester_email, location_detail) VALUES
          ('req_demo_01', 1001, 'Kitchen faucet dripping', 'Kitchen faucet drips constantly. Getting worse.', 'prop_oakridge', 'spc_oak_101', 'plumbing', 'normal', 'submitted', 'Sarah Chen', 'sarah@example.com', 'Kitchen sink'),
          ('req_demo_02', 1002, 'AC not cooling', 'Apartment barely cools below 78°F.', 'prop_oakridge', 'spc_oak_201', 'hvac', 'high', 'in_progress', 'Lisa Park', 'lisa@example.com', 'Living room'),
          ('req_demo_03', 1003, 'Dishwasher not draining', 'Standing water after every cycle.', 'prop_maplewood', 'spc_mpl_a', 'appliance', 'normal', 'triaged', 'Tom Wilson', 'tom@example.com', 'Kitchen')
        ON CONFLICT DO NOTHING;
      `);
      result.demo_data = true;
    } catch (err) {
      result.demo_data_error = String(err);
    }
  }

  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
};
