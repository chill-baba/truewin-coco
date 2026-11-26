import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getAdminDashboardStats } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 403 });
  }

  const stats = await getAdminDashboardStats();
  return NextResponse.json({ ok: true, stats });
}
