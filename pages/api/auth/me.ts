import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, clearAuthCookie, parseCookie, COOKIE_NAME } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const hadCookie = Boolean(parseCookie(req, COOKIE_NAME));
  const auth = await authenticateRequest(req);

  if (!auth) {
    if (hadCookie) {
      clearAuthCookie(res);
      return res.status(401).json({
        authenticated: false,
        sessionInvalidated: true,
        error: "Your session was ended because you logged in elsewhere or an admin cleared it.",
      });
    }
    return res.status(200).json({ authenticated: false, sessionInvalidated: false });
  }

  return res.status(200).json({
    authenticated: true,
    user: { uid: auth.uid, role: auth.role },
  });
}
