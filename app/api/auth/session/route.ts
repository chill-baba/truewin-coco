import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await getAuthSession(req);
  if (!auth) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: auth.user,
    session: {
      deviceId: auth.session.device_id,
      deviceName: auth.session.device_name,
      lastActivity: auth.session.last_activity,
    },
  });
}
