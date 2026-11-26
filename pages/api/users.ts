import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getSupabaseServer, ensureDbReady } from "../../lib/supabaseServer";
import { authenticateRequest } from "../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  try {
    await ensureDbReady();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database initialization failed";
    return res.status(500).json({ error: msg });
  }

  const auth = await authenticateRequest(req);
  if (!auth || auth.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  const supabase = getSupabaseServer();

  if (req.method === "GET") {
    const { data: users, error } = await supabase
      .from("User")
      .select("id, uid, role, createdAt")
      .order("createdAt", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ users: users || [] });
  }

  if (req.method === "POST") {
    const { uid, password, role = "user" } = req.body || {};
    if (!uid || !password) {
      return res.status(400).json({ error: "UID and password are required" });
    }

    const cleanUid = String(uid).trim();
    const hashed = await bcrypt.hash(String(password), 10);

    const { data: user, error } = await supabase
      .from("User")
      .insert({
        id: crypto.randomUUID(),
        uid: cleanUid,
        password: hashed,
        role: role === "admin" ? "admin" : "user",
      })
      .select("id, uid, role, createdAt")
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "UID already exists" });
      }
      return res.status(500).json({ error: error.message || "Failed to create user" });
    }
    return res.status(201).json({ user });
  }

  if (req.method === "DELETE") {
    const { uid } = req.body || {};
    if (!uid) {
      return res.status(400).json({ error: "UID is required" });
    }
    if (uid === auth.uid) {
      return res.status(400).json({ error: "Cannot delete your own admin account" });
    }

    await supabase.from("Session").delete().eq("uid", String(uid));
    await supabase.from("User").delete().eq("uid", String(uid));
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
