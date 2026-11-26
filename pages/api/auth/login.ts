import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getSupabaseServer, ensureDbReady } from "../../../lib/supabaseServer";
import { generateSessionToken, setAuthCookie, signJwt } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await ensureDbReady();
    const supabase = getSupabaseServer();

    const { uid, password } = req.body || {};
    if (!uid || !password) {
      return res.status(400).json({ error: "UID and password are required" });
    }

    const cleanUid = String(uid).trim();
    const { data: user, error: userErr } = await supabase
      .from("User")
      .select("*")
      .eq("uid", cleanUid)
      .maybeSingle();

    if (userErr) {
      return res.status(500).json({ error: userErr.message });
    }
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(String(password), user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    let replacedPrevious = false;

    // Enforce single active session for non-admin users.
    if (user.role !== "admin") {
      const { count } = await supabase
        .from("Session")
        .select("id", { count: "exact", head: true })
        .eq("uid", user.uid);

      if ((count ?? 0) > 0) {
        await supabase.from("Session").delete().eq("uid", user.uid);
        replacedPrevious = true;
      }
    }

    const sessionToken = generateSessionToken();
    const { error: sessErr } = await supabase.from("Session").insert({
      id: crypto.randomUUID(),
      uid: user.uid,
      token: sessionToken,
    });

    if (sessErr) {
      return res.status(500).json({ error: sessErr.message });
    }

    const jwtToken = signJwt({
      uid: user.uid,
      role: user.role,
      sessionToken,
    });

    setAuthCookie(res, jwtToken);

    return res.status(200).json({
      user: { uid: user.uid, role: user.role },
      replacedPrevious,
    });
  } catch (err: unknown) {
    console.error("Login API error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ error: msg });
  }
}
