import { NextRequest, NextResponse } from 'next/server';
import { logoutSession } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const token =
    req.cookies.get('truwin_session_token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '') ||
    '';

  if (token) {
    await logoutSession(token);
  }

  const response = NextResponse.json({ ok: true, message: 'Logged out successfully.' });
  response.cookies.delete('truwin_session_token');
  return response;
}
