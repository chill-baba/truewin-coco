import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getLiveActiveSessions, terminateUserSession } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 403 });
  }

  const sessions = await getLiveActiveSessions();
  return NextResponse.json({ ok: true, sessions });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ ok: false, error: 'UID is required' }, { status: 400 });
  }

  const result = await terminateUserSession(uid);
  return NextResponse.json(result);
}
