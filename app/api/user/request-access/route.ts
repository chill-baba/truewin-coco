import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import { userRequestMarketingAccess } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const result = await userRequestMarketingAccess(auth.user.uid, body.reason);

  return NextResponse.json(result);
}
