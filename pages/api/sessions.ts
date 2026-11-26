import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";
import { authenticateRequest } from "../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await authenticateRequest(req);
  if (!auth || auth.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  if (req.method === "GET") {
    const sessions = await prisma.session.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ sessions });
  }

  if (req.method === "DELETE") {
    const { id, uid, all } = req.body || {};
    if (all) {
      // Delete all non-admin sessions, or all sessions if requested
      await prisma.session.deleteMany({
        where: { uid: { not: auth.uid } },
      });
      return res.status(200).json({ success: true, message: "All user sessions terminated" });
    }
    if (id) {
      await prisma.session.deleteMany({ where: { id: String(id) } });
      return res.status(200).json({ success: true });
    }
    if (uid) {
      await prisma.session.deleteMany({ where: { uid: String(uid) } });
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({ error: "Specify all, id, or uid" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
