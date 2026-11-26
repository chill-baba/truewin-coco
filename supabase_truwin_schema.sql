-- ==============================================================================
-- TRUWIN COCO - Database Schema (PostgreSQL for Supabase)
-- Production Admin Panel & User Access Management System
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.truwin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',               -- 'admin' | 'user'
    status TEXT NOT NULL DEFAULT 'active',           -- 'active' | 'inactive' | 'suspended'
    marketing_access TEXT NOT NULL DEFAULT 'Not Requested', -- 'Not Requested' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Revoked'
    marketing_access_updated_at TIMESTAMPTZ,
    bound_device_id TEXT,                            -- The authorized device ID locked to this user
    bound_device_name TEXT,                          -- Human-friendly device name (e.g., 'MacBook Pro / Chrome')
    active_device_id TEXT,                           -- Device ID of current live session
    active_device_name TEXT,                         -- Device name of current live session
    active_session_token TEXT,                       -- The single active valid session token (1 UID = 1 active session)
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_heartbeat TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_ip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Sessions Table (Strict Single-Device Binding)
CREATE TABLE IF NOT EXISTS public.truwin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    uid TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    device_id TEXT NOT NULL,
    device_name TEXT,
    ip_address TEXT,
    user_agent TEXT,
    is_valid BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_activity TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. In-App Notifications Table
CREATE TABLE IF NOT EXISTS public.truwin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,                              -- 'LOGIN', 'LOGOUT', 'UNAUTHORIZED_DEVICE', 'ACCESS_REQUEST', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    uid TEXT NOT NULL,
    device_id TEXT,
    device_name TEXT,
    ip_address TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Access Requests Table (Marketing Credentials)
CREATE TABLE IF NOT EXISTS public.truwin_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'Pending Approval', -- 'Pending Approval' | 'Approved' | 'Rejected' | 'Revoked'
    request_reason TEXT,
    reviewed_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Marketing Credentials Data Table (Only accessed by approved users)
CREATE TABLE IF NOT EXISTS public.truwin_marketing_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    label TEXT NOT NULL,
    access_key TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    endpoint TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.truwin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance & Sorting Indexes (Descending Chronological Order)
CREATE INDEX IF NOT EXISTS idx_truwin_users_uid ON public.truwin_users (uid);
CREATE INDEX IF NOT EXISTS idx_truwin_users_created_at ON public.truwin_users (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_truwin_sessions_token ON public.truwin_sessions (token);
CREATE INDEX IF NOT EXISTS idx_truwin_sessions_uid ON public.truwin_sessions (uid);
CREATE INDEX IF NOT EXISTS idx_truwin_notifications_created_at ON public.truwin_notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_truwin_notifications_read ON public.truwin_notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_truwin_access_requests_created_at ON public.truwin_access_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_truwin_audit_logs_created_at ON public.truwin_audit_logs (created_at DESC);

-- Disable RLS for smooth backend operational synchronization
ALTER TABLE public.truwin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.truwin_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.truwin_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.truwin_access_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.truwin_marketing_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.truwin_audit_logs DISABLE ROW LEVEL SECURITY;
