import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import prisma, { ensureDbReady } from "../../../lib/prisma";
import { generateSessionToken, setAuthCookie, signJwt } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await ensureDbReady();

    const { uid, password } = req.body || {};
    if (!uid || !password) {
      return res.status(400).json({ error: "UID and password are required" });
    }

    const cleanUid = String(uid).trim();
    const user = await prisma.user.findUnique({ where: { uid: cleanUid } });
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
      const existing = await prisma.session.count({ where: { uid: user.uid } });
      if (existing > 0) {
        await prisma.session.deleteMany({ where: { uid: user.uid } });
        replacedPrevious = true;
      }
    }

    const sessionToken = generateSessionToken();
    await prisma.session.create({
      data: {
        uid: user.uid,
        token: sessionToken,
      },
    });

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
