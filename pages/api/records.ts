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

  const supabase = getSupabaseServer();

  if (req.method === "GET") {
    const q = String(req.query.q || "").trim().toLowerCase();
    const field = String(req.query.field || "all");
    const ratingParam = req.query.rating ? Number(req.query.rating) : null;

    const { data: allRecords, error } = await supabase
      .from("DataRecord")
      .select("*")
      .order("createdAt", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const filtered = (allRecords || []).filter((rec) => {
      if (ratingParam !== null && !Number.isNaN(ratingParam) && rec.rating !== ratingParam) {
        return false;
      }
      if (!q) return true;

      if (field === "email") return (rec.email || "").toLowerCase().includes(q);
      if (field === "phone") return (rec.phone || "").toLowerCase().includes(q);
      if (field === "password") return (rec.password || "").toLowerCase().includes(q);
      if (field === "notes") return (rec.notes || "").toLowerCase().includes(q);

      return (
        (rec.email || "").toLowerCase().includes(q) ||
        (rec.phone || "").toLowerCase().includes(q) ||
        (rec.password || "").toLowerCase().includes(q) ||
        (rec.notes || "").toLowerCase().includes(q) ||
        String(rec.id).includes(q)
      );
    });

    return res.status(200).json({ records: filtered });
  }

  if (req.method === "POST") {
    if (auth.role !== "admin") {
      return res.status(403).json({ error: "Only admin can add records" });
    }
    const { email, phone, password, notes, rating = 0 } = req.body || {};
    const { data: record, error } = await supabase
      .from("DataRecord")
      .insert({
        email: email ? String(email).trim() : null,
        phone: phone ? String(phone).trim() : null,
        password: password ? String(password) : null,
        notes: notes ? String(notes).trim() : null,
        rating: Number(rating) || 0,
      })
      .select("*")
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json({ record });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
