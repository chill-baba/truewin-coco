import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { readStore, adminReviewAccessRequest } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 403 });
  }

  const store = readStore();
  const requests = [...store.access_requests].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return NextResponse.json({ ok: true, requests });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 403 });
  }

  const body = await req.json();
  const { idOrUid, decision } = body;

  if (!idOrUid || !['Approved', 'Rejected', 'Revoked'].includes(decision)) {
    return NextResponse.json({ ok: false, error: 'Invalid parameters' }, { status: 400 });
  }

  const result = await adminReviewAccessRequest(idOrUid, decision);
  return NextResponse.json(result);
}
