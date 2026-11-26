import { NextRequest } from 'next/server';
import { validateSession } from './storage';

export async function getAuthSession(req: NextRequest) {
  // 1. Try cookie
  let token = req.cookies.get('truwin_session_token')?.value;

  // 2. Try Authorization: Bearer <token>
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  // 3. Try custom header
  if (!token) {
    token = req.headers.get('x-truwin-token') || '';
  }

  if (!token) {
    return null;
  }

  return await validateSession(token);
}

export async function requireAdmin(req: NextRequest) {
  const auth = await getAuthSession(req);
  if (!auth || auth.user.role !== 'admin') {
    return null;
  }
  return auth;
}

export async function requireUser(req: NextRequest) {
  const auth = await getAuthSession(req);
  if (!auth) {
    return null;
  }
  return auth;
}
