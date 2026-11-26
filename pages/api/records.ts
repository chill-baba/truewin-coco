import type { NextApiRequest, NextApiResponse } from "next";
import prisma, { ensureDbReady } from "../../lib/prisma";
import { authenticateRequest } from "../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await ensureDbReady();
  const auth = await authenticateRequest(req);
  if (!auth) {
    return res.status(401).json({ error: "Unauthorized or session replaced", sessionInvalidated: true });
  }

  if (req.method === "GET") {
    const q = String(req.query.q || "").trim().toLowerCase();
    const field = String(req.query.field || "all");
    const ratingParam = req.query.rating ? Number(req.query.rating) : null;

    const allRecords = await prisma.dataRecord.findMany({
      orderBy: { id: "desc" },
    });

    const filtered = allRecords.filter((rec) => {
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
    const record = await prisma.dataRecord.create({
      data: {
        email: email ? String(email).trim() : null,
        phone: phone ? String(phone).trim() : null,
        password: password ? String(password) : null,
        notes: notes ? String(notes).trim() : null,
        rating: Number(rating) || 0,
      },
    });
    return res.status(201).json({ record });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
