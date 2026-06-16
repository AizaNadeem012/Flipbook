/**
 * One-time admin bootstrap. Uses only the publishable key + claim_first_admin RPC.
 * Requires migration 20260614180000_claim_first_admin.sql applied on Supabase.
 *
 * Env (from .env or .env.local):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY
 *   ADMIN_EMAIL (optional, default admin@folio.local)
 *   ADMIN_PASSWORD (optional, default Admin@123456)
 *   SUPABASE_SERVICE_ROLE_KEY (optional, for auto-confirming email without manual verification)
 *
 * Usage:
 *   1. Without SUPABASE_SERVICE_ROLE_KEY (requires email confirmation):
 *      - Run: npm run create-admin
 *      - Check email and click confirmation link
 *      - Run again: npm run create-admin
 *
 *   2. With SUPABASE_SERVICE_ROLE_KEY (auto-confirms email):
 *      - Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=sk_...
 *      - Run: npm run create-admin
 *      - Login immediately without waiting for confirmation
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  try {
    const raw = readFileSync(resolve(root, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"\n]*)"?/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* no .env */
  }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Optional: for auto-confirming emails
const email = process.env.ADMIN_EMAIL ?? "admin@folio.local";
const password = process.env.ADMIN_PASSWORD ?? "Admin@123456";

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key);
const supabaseAdmin = serviceKey ? createClient(url, serviceKey) : null;

async function main() {
  console.log(`Creating admin: ${email}`);

  let user;

  // If service role key is available, use it to auto-confirm the email
  if (supabaseAdmin) {
    console.log("Using service role key to auto-confirm email…");
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Admin" },
    });

    if (error && !/already exists|duplicate|unique/i.test(error.message)) {
      throw error;
    }

    if (data?.user) {
      user = data.user;
      console.log("Admin user created with auto-confirmed email.");
    } else {
      console.log("User already exists or cannot be created with service role.");
    }
  }

  // If no service role or user wasn't created, use regular signUp flow
  if (!user) {
    console.log("Using regular signup (you may need to confirm email)…");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: "Admin" } },
    });

    if (signUpError && !/already registered|already exists/i.test(signUpError.message)) {
      throw signUpError;
    }

    if (signUpError) {
      console.log("User already exists, signing in…");
    } else if (signUpData.user && !signUpData.session) {
      console.log("⚠️  Email confirmation required!");
      console.log("1. Check your email and click the confirmation link");
      console.log("2. Return here and run this script again");
      console.log("\nAlternatively:");
      console.log("- Add SUPABASE_SERVICE_ROLE_KEY to .env to auto-confirm emails");
      console.log("- Or disable email confirmation in Supabase project settings");
      process.exit(0);
    }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  const { data: anyAdmin, error: checkError } = await supabase.rpc("has_any_admin");
  if (checkError) throw checkError;
  if (anyAdmin) {
    console.log("An admin already exists. Sign in at /auth with your admin credentials.");
    process.exit(0);
  }

  const { error: claimError } = await supabase.rpc("claim_first_admin");
  if (claimError) throw claimError;

  console.log("\n✅ Admin ready.");
  console.log(`  Login URL: /auth`);
  console.log(`  Email:     ${email}`);
  console.log(`  Password:  ${password}`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
