import { NextRequest, NextResponse } from 'next/server';
import { recordHeartbeat } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const token =
    req.cookies.get('truwin_session_token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '') ||
    '';

  const body = await req.json().catch(() => ({}));
  const deviceId = body.deviceId || '';

  if (!token) {
    return NextResponse.json({ ok: false, error: 'NO_TOKEN' }, { status: 401 });
  }

  const result = await recordHeartbeat(token, deviceId);
  if (!result.ok) {
    return NextResponse.json(result, { status: 401 });
  }

  return NextResponse.json(result);
}
