import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, authenticateAdmin } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, password, deviceId, deviceName, isAdmin } = body;

    if (!uid || !password) {
      return NextResponse.json(
        { ok: false, error: 'UID and password are required.' },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';
    const clientDeviceId = (deviceId || 'dev_unknown').trim();
    const clientDeviceName = (deviceName || userAgent.split(')')[0] || 'Browser Client').trim();

    let result;
    if (isAdmin) {
      result = await authenticateAdmin({
        uid,
        password,
        deviceId: clientDeviceId,
        deviceName: clientDeviceName,
        ip,
        userAgent,
      });
    } else {
      result = await authenticateUser({
        uid,
        password,
        deviceId: clientDeviceId,
        deviceName: clientDeviceName,
        ip,
        userAgent,
      });
    }

    if (!result.ok || !result.token) {
      const status = result.error === 'UNAUTHORIZED_DEVICE' ? 403 : 401;
      return NextResponse.json(result, { status });
    }

    // Set secure HTTP-only session cookie
    const response = NextResponse.json({
      ok: true,
      token: result.token,
      user: result.user,
      role: result.user?.role,
    });

    response.cookies.set('truwin_session_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('[AUTH_LOGIN_ERROR]', err);
    return NextResponse.json(
      { ok: false, error: 'SERVER_ERROR', message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
