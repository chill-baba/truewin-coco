import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { readStore, writeStore, TruwinMarketingCredential } from '@/lib/storage';
import { generateId } from '@/lib/security';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 403 });
  }

  const store = readStore();
  const list = [...store.marketing_credentials].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return NextResponse.json({ ok: true, data: list });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 403 });
  }

  const body = await req.json();
  const { category, label, access_key, secret_key, endpoint, notes } = body;

  if (!category || !label || !access_key || !secret_key) {
    return NextResponse.json(
      { ok: false, error: 'Category, label, access key, and secret key are required' },
      { status: 400 }
    );
  }

  const store = readStore();
  const now = new Date().toISOString();

  const cred: TruwinMarketingCredential = {
    id: generateId('mkt'),
    category: category.trim(),
    label: label.trim(),
    access_key: access_key.trim(),
    secret_key: secret_key.trim(),
    endpoint: endpoint?.trim() || '',
    notes: notes?.trim() || '',
    created_at: now,
    updated_at: now,
  };

  store.marketing_credentials.unshift(cred);
  writeStore(store);

  return NextResponse.json({ ok: true, credential: cred }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ ok: false, error: 'ID is required' }, { status: 400 });
  }

  const store = readStore();
  const idx = store.marketing_credentials.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  store.marketing_credentials.splice(idx, 1);
  writeStore(store);

  return NextResponse.json({ ok: true });
}
