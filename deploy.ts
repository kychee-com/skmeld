/**
 * SkMeld deploy script — one-click deploy to Run402.
 *
 * Usage:
 *   npx tsx deploy.ts                 # deploy
 *   npx tsx deploy.ts --publish       # deploy + publish to marketplace
 *
 * Requires BUYER_PRIVATE_KEY in .env (two levels up from apps/skmeld/).
 */

import { config } from "dotenv";
config({ path: "../../.env" });   // monorepo layout (apps/skmeld/)
config({ path: ".env" });         // standalone repo

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";
import { createSIWxPayload, encodeSIWxHeader } from "@x402/extensions/sign-in-with-x";
import type { CompleteSIWxInfo } from "@x402/extensions/sign-in-with-x";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

const BASE_URL = process.env.RUN402_API_BASE || "https://api.run402.com";
const BUYER_KEY = process.env.BUYER_PRIVATE_KEY as `0x${string}`;
const SUBDOMAIN = process.env.SKMELD_SUBDOMAIN || "skmeld-dev";
const PUBLISH = process.argv.includes("--publish");

if (!BUYER_KEY) {
  console.error("Missing BUYER_PRIVATE_KEY in .env");
  process.exit(1);
}

// x402 + SIWx setup
const account = privateKeyToAccount(BUYER_KEY);
const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
const signer = toClientEvmSigner(account, publicClient);
const client = new x402Client();
client.register("eip155:84532", new ExactEvmScheme(signer));
const fetchPaid = wrapFetchWithPayment(fetch, client);

async function siwxHeaders(path: string): Promise<Record<string, string>> {
  const baseUrl = new URL(BASE_URL);
  const uri = `${baseUrl.protocol}//${baseUrl.host}${path}`;
  const now = new Date();
  const info: CompleteSIWxInfo = {
    domain: baseUrl.hostname,
    uri,
    statement: "Sign in to Run402",
    version: "1",
    nonce: Math.random().toString(36).slice(2),
    issuedAt: now.toISOString(),
    expirationTime: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
    chainId: "eip155:84532",
    type: "eip191",
  };
  const payload = await createSIWxPayload(info, account);
  return { "SIGN-IN-WITH-X": encodeSIWxHeader(payload) };
}

function readSQL(...files: string[]): string {
  return files.map(f => readFileSync(join(__dirname, "sql", f), "utf-8")).join("\n");
}

function readFunction(name: string): string {
  return readFileSync(join(__dirname, "functions", name), "utf-8");
}

function readSiteFiles(dir: string): Array<{ file: string; data: string }> {
  const files: Array<{ file: string; data: string }> = [];
  function walk(base: string, prefix = "") {
    for (const entry of readdirSync(join(base, prefix), { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(base, rel);
      } else {
        files.push({ file: rel, data: readFileSync(join(base, rel), "utf-8") });
      }
    }
  }
  walk(dir);
  return files;
}

async function main() {
  console.log("\n=== SkMeld Deploy ===\n");
  console.log(`Target: ${BASE_URL}`);
  console.log(`Wallet: ${account.address}`);
  console.log(`Publish: ${PUBLISH}\n`);

  // 1. Subscribe to tier (if needed)
  console.log("1) Subscribing to tier...");
  const tierRes = await fetchPaid(`${BASE_URL}/tiers/v1/prototype`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  console.log(`   Tier: ${tierRes.status}`);

  // 2. Provision or reuse project
  console.log("\n2) Provisioning project...");
  const headers = await siwxHeaders("/projects/v1");

  // Check for existing project first
  const listRes = await fetch(`${BASE_URL}/projects/v1`, {
    method: "GET",
    headers: { ...headers },
  });
  const existingProjects = await listRes.json().catch(() => []);
  const existing = Array.isArray(existingProjects)
    ? existingProjects.find((p: { name: string }) => p.name === "skmeld")
    : null;

  let project: { project_id: string; anon_key: string; service_key: string };
  if (existing) {
    project = existing;
    console.log(`   Reusing project: ${project.project_id}`);
  } else {
    const projRes = await fetch(`${BASE_URL}/projects/v1`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ name: "skmeld" }),
    });
    project = await projRes.json();
    console.log(`   Created project: ${project.project_id}`);
  }
  console.log(`   Anon key: ${project.anon_key?.slice(0, 20)}...`);

  // 3. Build frontend
  console.log("\n3) Building frontend...");
  const siteDir = join(__dirname, "site");
  if (!existsSync(siteDir)) {
    execSync("npm run build", { cwd: __dirname, stdio: "inherit" });
  }

  // 3b. Inject brand config into index.html
  console.log("   Injecting brand config...");
  const brandPath = join(__dirname, "src", "custom", "brand.json");
  if (existsSync(brandPath)) {
    const brand = JSON.parse(readFileSync(brandPath, "utf-8"));
    const indexPath = join(siteDir, "index.html");
    let html = readFileSync(indexPath, "utf-8");

    // Inject title
    html = html.replace(
      /<!-- BRAND:TITLE -->\s*<title>[^<]*<\/title>/,
      `<title>${brand.name}</title>`,
    );

    // Inject Google Fonts
    if (brand.fonts?.source === "google") {
      const families: string[] = [];
      if (brand.fonts.display?.family) {
        families.push(
          `family=${brand.fonts.display.family.replace(/ /g, "+")}:wght@${(brand.fonts.display.weights || [600, 700]).join(";")}`,
        );
      }
      if (brand.fonts.body?.family && brand.fonts.body.family !== brand.fonts.display?.family) {
        families.push(
          `family=${brand.fonts.body.family.replace(/ /g, "+")}:wght@${(brand.fonts.body.weights || [400, 500, 700]).join(";")}`,
        );
      }
      if (families.length > 0) {
        const fontsLink = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?${families.join("&")}&display=swap" rel="stylesheet">`;
        html = html.replace("<!-- BRAND:FONTS -->", fontsLink);
      }
    }
    html = html.replace("<!-- BRAND:FONTS -->", "");

    // Inject brand script
    const brandScript = `<script>window.__SKMELD_BRAND__=${JSON.stringify(brand)};</script>`;
    html = html.replace("<!-- BRAND:SCRIPT -->", brandScript);

    writeFileSync(indexPath, html);
    console.log(`   Brand: ${brand.name}`);
  }

  // 3c. Inject runtime config (anon key, API base) into index.html
  {
    const indexPath = join(siteDir, "index.html");
    let html = readFileSync(indexPath, "utf-8");
    const configScript = `<script>window.__SKMELD_CONFIG__=${JSON.stringify({
      apiBase: BASE_URL,
      anonKey: project.anon_key,
    })};</script>`;
    // Insert before the closing </head> tag
    html = html.replace("</head>", `${configScript}\n</head>`);
    writeFileSync(indexPath, html);
    console.log(`   Config injected (anon key: ${project.anon_key?.slice(0, 20)}...)`);
  }

  // 4. Read all SQL
  const migrations = readSQL("schema.sql", "seed-base.sql");
  const rlsSQL = readSQL("rls.sql");
  const viewsSQL = readSQL("views.sql");

  // 5. Read functions
  // Scheduled functions are excluded from the bundle and deployed
  // individually in step 8 with their cron schedules attached.
  // This keeps the bundle within the 8-function prototype tier limit.
  const functionFiles = [
    "bootstrap.ts", "submit-request.ts", "update-request.ts",
    "transition-request.ts", "add-comment.ts",
    "create-invites.ts", "redeem-invite.ts",
    "on-signup.ts",
  ];
  const functions = functionFiles.map(f => ({
    name: f.replace(".ts", ""),
    code: readFunction(f),
  }));

  // 6. Read site files
  const siteFiles = readSiteFiles(siteDir);
  console.log(`   Site files: ${siteFiles.length}`);

  // 7. Bundle deploy
  console.log("\n4) Deploying bundle...");
  const deployHeaders = await siwxHeaders("/deploy/v1");
  const deployRes = await fetch(`${BASE_URL}/deploy/v1`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...deployHeaders },
    body: JSON.stringify({
      project_id: project.project_id,
      migrations: migrations + "\n" + rlsSQL + "\n" + viewsSQL,
      functions,
      files: siteFiles,
      subdomain: SUBDOMAIN,
      bootstrap: {
        admin_email: "admin@skmeld.example",
        app_name: "SkMeld Demo",
        seed_demo_data: true,
      },
    }),
  });
  const deployBody = await deployRes.json();
  console.log(`   Deploy status: ${deployRes.status}`);
  if (deployRes.status >= 400) {
    console.log(`   Deploy error: ${JSON.stringify(deployBody)}`);
  }
  if (deployBody.bootstrap_result) {
    console.log(`   Bootstrap: ${JSON.stringify(deployBody.bootstrap_result)}`);
  }
  if (deployBody.bootstrap_error) {
    console.log(`   Bootstrap error: ${deployBody.bootstrap_error}`);
  }

  // 8. Deploy scheduled function (SLA check + daily digest combined)
  // Prototype tier has 8 function limit (bundle uses all 8) and 1 scheduled function slot.
  // This step deploys the scheduled function separately — it will fail on prototype
  // if the limit is hit, but succeeds on hobby+ tiers.
  console.log("\n5) Deploying scheduled function...");
  const schedRes = await fetch(
    `${BASE_URL}/projects/v1/admin/${project.project_id}/functions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${project.service_key}`,
      },
      body: JSON.stringify({
        name: "scheduled-tasks",
        code: readFunction("scheduled-tasks.ts"),
        schedule: "0 */4 * * *",
      }),
    },
  );
  const schedBody = await schedRes.json().catch(() => ({}));
  if (schedRes.status === 201) {
    console.log(`   scheduled-tasks (0 */4 * * *): deployed`);
  } else if (schedRes.status === 403) {
    console.log(`   scheduled-tasks: skipped (${schedBody.error || "tier limit"}) — trigger manually or upgrade tier`);
  } else {
    console.log(`   scheduled-tasks: ${schedRes.status} ${schedBody.error || ""}`);
  }

  // 9. Publish (optional)
  if (PUBLISH) {
    console.log("\n5) Publishing to marketplace...");
    const pubRes = await fetch(`${BASE_URL}/projects/v1/admin/${project.project_id}/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${project.service_key}`,
      },
      body: JSON.stringify({
        visibility: "public",
        fork_allowed: true,
        description: "Property maintenance request tracker for landlords, HOAs, and office managers. Open source, MIT.",
        tags: ["maintenance", "property", "skmeld", "board", "tracker"],
        bootstrap_variables: [
          { name: "admin_email", type: "string", required: true, description: "Email for the first admin user" },
          { name: "app_name", type: "string", required: false, description: "Business name" },
          { name: "seed_demo_data", type: "boolean", required: false, default: false, description: "Populate with sample data" },
        ],
      }),
    });
    const pubBody = await pubRes.json();
    console.log(`   Published: ${pubBody.id} (${pubRes.status})`);
  }

  // Summary
  console.log("\n=== Deploy Complete ===");
  console.log(`URL:         https://${SUBDOMAIN}.run402.com`);
  console.log(`Project ID:  ${project.project_id}`);
  console.log(`Anon Key:    ${project.anon_key}`);
  console.log(`Service Key: ${project.service_key?.slice(0, 20)}...`);
  console.log("");
}

main().catch((err) => {
  console.error("\nDeploy failed:", err);
  process.exit(1);
});
