import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import {
  adminUpdateUser,
  adminDeleteUser,
  adminResetPassword,
  adminReassignDevice,
} from '@/lib/storage';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await req.json();

  const result = await adminUpdateUser(id, body);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await req.json();

  // Action can be: 'reset_password', 'reassign_device', or general field update
  if (body.action === 'reset_password') {
    if (!body.password) {
      return NextResponse.json({ ok: false, error: 'Password is required' }, { status: 400 });
    }
    const result = await adminResetPassword(id, body.password);
    return NextResponse.json(result);
  }

  if (body.action === 'reassign_device') {
    const result = await adminReassignDevice(id, body.deviceId, body.deviceName);
    return NextResponse.json(result);
  }

  const result = await adminUpdateUser(id, body);
  return NextResponse.json(result);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 403 });
  }

  const { id } = await context.params;
  const result = await adminDeleteUser(id);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
