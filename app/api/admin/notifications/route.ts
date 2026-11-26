import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
} from '@/lib/storage';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const notifications = await getNotifications(limit);

  return NextResponse.json({ ok: true, notifications });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 403 });
  }

  const body = await req.json();
  if (body.all) {
    await markAllNotificationsRead();
  } else if (body.id) {
    await markNotificationRead(body.id);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 403 });
  }

  await clearAllNotifications();
  return NextResponse.json({ ok: true });
}
