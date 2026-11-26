import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseServer } from "../../../lib/supabaseServer";
import { authenticateRequest, clearAuthCookie } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await authenticateRequest(req);
  if (auth) {
    const supabase = getSupabaseServer();
    await supabase.from("Session").delete().eq("token", auth.sessionToken);
  }

  clearAuthCookie(res);
  return res.status(200).json({ success: true });
}
