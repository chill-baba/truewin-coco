import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getSupabaseServer } from "./supabaseServer";

const JWT_SECRET = process.env.JWT_SECRET || "auratube-ultra-secure-local-secret-key-2026";
export const COOKIE_NAME = "truda_token";

export interface TokenPayload {
  uid: string;
  role: string;
  sessionToken: string;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function signJwt(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function setAuthCookie(res: NextApiResponse, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  const secureFlag = isProd ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=${7 * 24 * 60 * 60}`
  );
}

export function clearAuthCookie(res: NextApiResponse) {
  const isProd = process.env.NODE_ENV === "production";
  const secureFlag = isProd ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=0`
  );
}

export function parseCookie(req: NextApiRequest, name: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((c) => c.trim());
  for (const part of parts) {
    if (part.startsWith(name + "=")) {
      return decodeURIComponent(part.slice(name.length + 1));
    }
  }
  return null;
}

export async function authenticateRequest(req: NextApiRequest): Promise<TokenPayload | null> {
  const token = parseCookie(req, COOKIE_NAME);
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Admin sessions are statelessly valid via signed JWT (survives across Vercel lambdas)
    if (decoded.role === "admin") {
      return { uid: decoded.uid, role: "admin", sessionToken: decoded.sessionToken };
    }

    const supabase = getSupabaseServer();
    const { data: activeSession } = await supabase
      .from("Session")
      .select("id")
      .eq("token", decoded.sessionToken)
      .maybeSingle();

    if (activeSession) {
      return { uid: decoded.uid, role: decoded.role, sessionToken: decoded.sessionToken };
    }

    return null;
  } catch {
    return null;
  }
}
