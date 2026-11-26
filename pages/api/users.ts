import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import prisma, { ensureDbReady } from "../../lib/prisma";
import { authenticateRequest } from "../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await ensureDbReady();
  const auth = await authenticateRequest(req);
  if (!auth || auth.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  if (req.method === "GET") {
    const users = await prisma.user.findMany({
      select: { id: true, uid: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ users });
  }

  if (req.method === "POST") {
    const { uid, password, role = "user" } = req.body || {};
    if (!uid || !password) {
      return res.status(400).json({ error: "UID and password are required" });
    }

    const cleanUid = String(uid).trim();
    const hashed = await bcrypt.hash(String(password), 10);

    try {
      const user = await prisma.user.create({
        data: {
          uid: cleanUid,
          password: hashed,
          role: role === "admin" ? "admin" : "user",
        },
        select: { id: true, uid: true, role: true, createdAt: true },
      });
      return res.status(201).json({ user });
    } catch (e: unknown) {
      if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
        return res.status(409).json({ error: "UID already exists" });
      }
      return res.status(500).json({ error: "Failed to create user" });
    }
  }

  if (req.method === "DELETE") {
    const { uid } = req.body || {};
    if (!uid) {
      return res.status(400).json({ error: "UID is required" });
    }
    if (uid === auth.uid) {
      return res.status(400).json({ error: "Cannot delete your own admin account" });
    }

    await prisma.session.deleteMany({ where: { uid: String(uid) } });
    await prisma.user.deleteMany({ where: { uid: String(uid) } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
