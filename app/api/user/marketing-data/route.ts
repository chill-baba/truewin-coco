import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import { getMarketingCredentialsForUser } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED', message: 'Authentication required.' },
      { status: 401 }
    );
  }

  // Device binding check: session device must match assigned device (if assigned)
  if (auth.user.bound_device_id && auth.session.device_id !== auth.user.bound_device_id) {
    return NextResponse.json(
      {
        ok: false,
        error: 'UNAUTHORIZED_DEVICE',
        message: 'Device authorization mismatch. Contact administrator.',
      },
      { status: 403 }
    );
  }

  // Marketing access check
  if (auth.user.marketing_access !== 'Approved') {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: `Marketing credentials access is ${auth.user.marketing_access}. Approval by administrator is required.`,
      },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  const result = await getMarketingCredentialsForUser(auth.user.uid, search);
  return NextResponse.json(result);
}
