import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

declare global {
  // eslint-disable-next-line no-var
  var __supabaseServer: SupabaseClient | undefined;
  // eslint-disable-next-line no-var
  var __supabaseInitPromise: Promise<void> | undefined;
}

export function getSupabaseServer(): SupabaseClient {
  if (global.__supabaseServer) {
    return global.__supabaseServer;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env"
    );
  }

  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });

  global.__supabaseServer = client;
  return client;
}

export async function ensureDbReady(): Promise<void> {
  if (!global.__supabaseInitPromise) {
    global.__supabaseInitPromise = (async () => {
      const supabase = getSupabaseServer();

      // Verify tables exist first
      const { error: checkErr } = await supabase.from("User").select("id").limit(1);
      if (checkErr) {
        global.__supabaseInitPromise = undefined;
        if (checkErr.code === "PGRST205" || checkErr.message?.includes("schema cache")) {
          throw new Error(
            'Supabase tables ("User", "Session", "DataRecord") do not exist yet. Run supabase/schema.sql in Supabase Dashboard -> SQL Editor.'
          );
        }
        throw new Error(`Supabase connection error: ${checkErr.message}`);
      }

      // Ensure default admin exists
      const adminId = process.env.ADMIN_ID || "hellobabu";
      const adminPassword = process.env.ADMIN_PASSWORD || "boombam";

      const { data: existingAdmin } = await supabase
        .from("User")
        .select("id")
        .eq("uid", adminId)
        .maybeSingle();

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await supabase.from("User").insert({
          id: crypto.randomUUID(),
          uid: adminId,
          password: hashedPassword,
          role: "admin",
        });
      }

      // Seed default demo user Anish / user123
      const { data: demoUser } = await supabase
        .from("User")
        .select("id")
        .eq("uid", "Anish")
        .maybeSingle();

      if (!demoUser) {
        const hashedDemo = await bcrypt.hash("user123", 10);
        await supabase.from("User").insert({
          id: crypto.randomUUID(),
          uid: "Anish",
          password: hashedDemo,
          role: "user",
        });
      }

      // Seed demo records if empty
      const { count } = await supabase
        .from("DataRecord")
        .select("id", { count: "exact", head: true });

      if (count === 0) {
        await supabase.from("DataRecord").insert([
          { email: "testmaul@gmail.com", phone: null, password: "testmail", rating: 0, notes: "Test account" },
          { email: "adhamovfayzullo11082004@gmail.com", phone: null, password: "Fayzullo666", rating: 4, notes: "Primary" },
          { email: "gustavopereira2001@yahoo.com", phone: null, password: "03076349066$Gu", rating: 3, notes: "Yahoo backup" },
          { email: null, phone: "5551982579260", password: "03076349066$Gu", rating: 2, notes: "Phone only" },
          { email: "yoshlar79@gmail.com", phone: null, password: "ficbo8-gocFyh-wihsox", rating: 5, notes: "Verified" },
          { email: "gzhdjzjsusisjj@gmail.com", phone: null, password: "sjjsjdhdbd", rating: 1, notes: "" },
          { email: "sjhsdbjsbsjsbshs@gmail.com", phone: null, password: "syushshehe", rating: 0, notes: "" },
          { email: null, phone: "+998907766844", password: "Fayzullo666", rating: 4, notes: "Mobile UZ" },
        ]);
      }
    })();
  }

  await global.__supabaseInitPromise;
}
