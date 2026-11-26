import type { NextApiRequest, NextApiResponse } from "next";
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
    const { data: sessions, error } = await supabase
      .from("Session")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ sessions: sessions || [] });
  }

  if (req.method === "DELETE") {
    const { id, uid, all } = req.body || {};
    if (all) {
      await supabase.from("Session").delete().neq("uid", auth.uid);
      return res.status(200).json({ success: true, message: "All user sessions terminated" });
    }
    if (id) {
      await supabase.from("Session").delete().eq("id", String(id));
      return res.status(200).json({ success: true });
    }
    if (uid) {
      await supabase.from("Session").delete().eq("uid", String(uid));
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({ error: "Specify all, id, or uid" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
