import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { authenticateRequest, clearAuthCookie } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await authenticateRequest(req);
  if (auth) {
    await prisma.session.deleteMany({ where: { token: auth.sessionToken } });
  }

  clearAuthCookie(res);
  return res.status(200).json({ success: true });
}
