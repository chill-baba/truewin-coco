import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';
import { hashPassword, verifyPassword, generateSessionToken, generateId } from './security';

export interface TruwinUser {
  id: string;
  uid: string;
  email: string;
  phone: string;
  password_hash: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  marketing_access: 'Not Requested' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Revoked';
  marketing_access_updated_at: string | null;
  bound_device_id: string | null;
  bound_device_name: string | null;
  active_device_id: string | null;
  active_device_name: string | null;
  active_session_token: string | null;
  is_online: boolean;
  last_heartbeat: string | null;
  last_login_at: string | null;
  last_ip: string | null;
  created_at: string;
  updated_at: string;
}

export interface TruwinSession {
  id: string;
  token: string;
  uid: string;
  role: 'admin' | 'user';
  device_id: string;
  device_name: string;
  ip_address: string;
  user_agent: string;
  is_valid: boolean;
  created_at: string;
  last_activity: string;
}

export interface TruwinNotification {
  id: string;
  type:
    | 'LOGIN'
    | 'LOGOUT'
    | 'UNAUTHORIZED_DEVICE'
    | 'ACCESS_REQUEST'
    | 'ACCESS_APPROVED'
    | 'ACCESS_REJECTED'
    | 'ACCESS_REVOKED'
    | 'DEVICE_CHANGED'
    | 'SESSION_TERMINATED'
    | 'USER_CREATED';
  title: string;
  message: string;
  uid: string;
  device_id: string | null;
  device_name: string | null;
  ip_address: string | null;
  is_read: boolean;
  created_at: string;
}

export interface TruwinAccessRequest {
  id: string;
  uid: string;
  email: string;
  phone: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Revoked';
  request_reason: string;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TruwinMarketingCredential {
  id: string;
  category: string;
  label: string;
  access_key: string;
  secret_key: string;
  endpoint: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TruwinAuditLog {
  id: string;
  uid: string;
  action: string;
  details: string;
  ip_address: string | null;
  created_at: string;
}

interface TruwinStore {
  users: TruwinUser[];
  sessions: TruwinSession[];
  notifications: TruwinNotification[];
  access_requests: TruwinAccessRequest[];
  marketing_credentials: TruwinMarketingCredential[];
  audit_logs: TruwinAuditLog[];
}

const STORAGE_DIR = process.env.VERCEL ? '/tmp/storage' : path.join(process.cwd(), 'storage');
const STORAGE_FILE = path.join(STORAGE_DIR, 'truwin_store.json');

// Dynamically resolve Admin credentials from environment variables
export function getAdminCredentials() {
  const uid = (
    process.env.ADMIN_ID ||
    process.env.ADMIN_UID ||
    process.env.ADMIN_USERNAME ||
    'hellobabu'
  ).trim();
  const password = (process.env.ADMIN_PASSWORD || 'boombam').trim();
  return { uid, password };
}

function ensureStorageDir() {
  const dir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Initial seed data with admin and standard demo records
function getDefaultStore(): TruwinStore {
  const { uid: adminUid, password: adminPassword } = getAdminCredentials();
  const now = new Date().toISOString();

  const adminUser: TruwinUser = {
    id: 'usr_admin_001',
    uid: adminUid,
    email: 'admin@truwin.internal',
    phone: '+1 800-TRUWIN',
    password_hash: hashPassword(adminPassword),
    role: 'admin',
    status: 'active',
    marketing_access: 'Approved',
    marketing_access_updated_at: now,
    bound_device_id: null,
    bound_device_name: 'Primary Admin Console',
    active_device_id: null,
    active_device_name: null,
    active_session_token: null,
    is_online: false,
    last_heartbeat: null,
    last_login_at: null,
    last_ip: null,
    created_at: now,
    updated_at: now,
  };

  const sampleUsers: TruwinUser[] = [
    {
      id: 'usr_coco_101',
      uid: 'coco_alpha',
      email: 'alpha@truwin.internal',
      phone: '+91 98765 43210',
      password_hash: hashPassword('user123'),
      role: 'user',
      status: 'active',
      marketing_access: 'Approved',
      marketing_access_updated_at: now,
      bound_device_id: 'dev_sample_alpha',
      bound_device_name: 'MacBook Pro (Chrome)',
      active_device_id: null,
      active_device_name: null,
      active_session_token: null,
      is_online: false,
      last_heartbeat: null,
      last_login_at: null,
      last_ip: null,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: now,
    },
    {
      id: 'usr_coco_102',
      uid: 'coco_beta',
      email: 'beta@truwin.internal',
      phone: '+91 98111 22334',
      password_hash: hashPassword('user123'),
      role: 'user',
      status: 'active',
      marketing_access: 'Pending Approval',
      marketing_access_updated_at: now,
      bound_device_id: null,
      bound_device_name: null,
      active_device_id: null,
      active_device_name: null,
      active_session_token: null,
      is_online: false,
      last_heartbeat: null,
      last_login_at: null,
      last_ip: null,
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      updated_at: now,
    },
    {
      id: 'usr_coco_103',
      uid: 'coco_gamma',
      email: 'gamma@truwin.internal',
      phone: '+91 98999 88776',
      password_hash: hashPassword('user123'),
      role: 'user',
      status: 'inactive',
      marketing_access: 'Rejected',
      marketing_access_updated_at: now,
      bound_device_id: null,
      bound_device_name: null,
      active_device_id: null,
      active_device_name: null,
      active_session_token: null,
      is_online: false,
      last_heartbeat: null,
      last_login_at: null,
      last_ip: null,
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      updated_at: now,
    },
  ];

  const sampleCredentials: TruwinMarketingCredential[] = [
    {
      id: 'mkt_001',
      category: 'Meta Ads Manager',
      label: 'Truwin Global High-Volume Campaign API',
      access_key: 'META_ACT_99428591024_PROD',
      secret_key: 'EAALk99aBcD83419xxSecretAccessKey',
      endpoint: 'https://graph.facebook.com/v19.0/act_99428591024',
      notes: 'Active VIP lead acquisition campaign with $15k daily budget allocation',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mkt_002',
      category: 'Google Ads API',
      label: 'Performance Max VIP Conversion Pipeline',
      access_key: 'GGL_MKT_882-991-0021_CLIENT',
      secret_key: 'AIzaSyDW_283849xxSecureGoogleOAuthToken',
      endpoint: 'https://googleads.googleapis.com/v16/customers/8829910021',
      notes: 'Search and Remarketing funnel for ultra-targeted verified demographics',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mkt_003',
      category: 'Telegram Bot CRM',
      label: 'Automated Lead Delivery VIP Bot',
      access_key: 'BOT_ID_7492810992',
      secret_key: '7492810992:AAHs8932_kLkDq2xxTelegramSecretToken',
      endpoint: 'https://api.telegram.org/bot7492810992',
      notes: 'Dispatches instant lead notifications directly to secured sales coordinators',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mkt_004',
      category: 'Secure WhatsApp Business API',
      label: 'Enterprise Notification Gateway',
      access_key: 'WABA_ACCT_392019948',
      secret_key: 'WABA_SECRET_8943201948xxAuth',
      endpoint: 'https://graph.facebook.com/v19.0/392019948/messages',
      notes: 'Direct 1-to-1 customer verification and 2FA communication bridge',
      created_at: now,
      updated_at: now,
    },
  ];

  const sampleNotifications: TruwinNotification[] = [
    {
      id: 'notif_001',
      type: 'ACCESS_REQUEST',
      title: 'Marketing Access Requested',
      message: "User 'coco_beta' requested access to Marketing Credentials.",
      uid: 'coco_beta',
      device_id: null,
      device_name: 'Chrome on Windows',
      ip_address: '103.21.244.2',
      is_read: false,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'notif_002',
      type: 'LOGIN',
      title: 'User Login',
      message: "User 'coco_alpha' logged in successfully from assigned device.",
      uid: 'coco_alpha',
      device_id: 'dev_sample_alpha',
      device_name: 'MacBook Pro (Chrome)',
      ip_address: '49.36.120.44',
      is_read: true,
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ];

  const sampleRequests: TruwinAccessRequest[] = [
    {
      id: 'req_001',
      uid: 'coco_beta',
      email: 'beta@truwin.internal',
      phone: '+91 98111 22334',
      status: 'Pending Approval',
      request_reason: 'Campaign scaling for Q4 VIP conversion push',
      reviewed_by: null,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ];

  return {
    users: [adminUser, ...sampleUsers],
    sessions: [],
    notifications: sampleNotifications,
    access_requests: sampleRequests,
    marketing_credentials: sampleCredentials,
    audit_logs: [
      {
        id: 'log_init',
        uid: adminUid,
        action: 'SYSTEM_BOOT',
        details: 'TRUWIN COCO Access Management System initialized with environment credentials.',
        ip_address: '127.0.0.1',
        created_at: now,
      },
    ],
  };
}

// In-memory cache for fast lookups across serverless invocations
let memoryStore: TruwinStore | null = null;

export function readStore(): TruwinStore {
  ensureStorageDir();
  const { uid: envAdminUid, password: envAdminPassword } = getAdminCredentials();

  let store: TruwinStore;
  try {
    if (!fs.existsSync(STORAGE_FILE)) {
      store = getDefaultStore();
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(store, null, 2), 'utf-8');
      memoryStore = store;
      return store;
    }
    const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
    store = JSON.parse(raw);
    if (!store.users || !Array.isArray(store.users)) {
      store = getDefaultStore();
    }
  } catch (err) {
    console.error('[STORAGE_READ_ERROR]', err);
    store = memoryStore || getDefaultStore();
  }

  // Ensure all store slices exist
  if (!store.sessions) store.sessions = [];
  if (!store.notifications) store.notifications = [];
  if (!store.access_requests) store.access_requests = [];
  if (!store.marketing_credentials) store.marketing_credentials = [];
  if (!store.audit_logs) store.audit_logs = [];

  // ALWAYS keep admin credentials synchronized with latest environment variables
  let admin = store.users.find((u) => u.role === 'admin');
  if (!admin) {
    admin = {
      id: 'usr_admin_001',
      uid: envAdminUid,
      email: 'admin@truwin.internal',
      phone: '+1 800-TRUWIN',
      password_hash: hashPassword(envAdminPassword),
      role: 'admin',
      status: 'active',
      marketing_access: 'Approved',
      marketing_access_updated_at: new Date().toISOString(),
      bound_device_id: null,
      bound_device_name: 'Primary Admin Console',
      active_device_id: null,
      active_device_name: null,
      active_session_token: null,
      is_online: false,
      last_heartbeat: null,
      last_login_at: null,
      last_ip: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.users.unshift(admin);
  } else {
    // If admin UID or password changed in env, update immediately
    if (admin.uid !== envAdminUid || !verifyPassword(envAdminPassword, admin.password_hash)) {
      admin.uid = envAdminUid;
      admin.password_hash = hashPassword(envAdminPassword);
      admin.updated_at = new Date().toISOString();
    }
  }

  // Evaluate heartbeat freshness: if last_heartbeat > 60 seconds ago, user is offline
  const nowMs = Date.now();
  for (const u of store.users) {
    if (u.is_online && u.last_heartbeat) {
      const diff = nowMs - new Date(u.last_heartbeat).getTime();
      if (diff > 60000) {
        u.is_online = false;
      }
    }
  }

  memoryStore = store;
  return store;
}

export function writeStore(store: TruwinStore) {
  ensureStorageDir();
  memoryStore = store;
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[STORAGE_WRITE_ERROR]', err);
  }
}

// -----------------------------------------------------------------------------
// NOTIFICATIONS HELPER
// -----------------------------------------------------------------------------
export function addNotification(params: {
  type: TruwinNotification['type'];
  title: string;
  message: string;
  uid: string;
  device_id?: string | null;
  device_name?: string | null;
  ip_address?: string | null;
}) {
  const store = readStore();
  const notif: TruwinNotification = {
    id: generateId('notif'),
    type: params.type,
    title: params.title,
    message: params.message,
    uid: params.uid,
    device_id: params.device_id || null,
    device_name: params.device_name || null,
    ip_address: params.ip_address || null,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  store.notifications.unshift(notif);
  if (store.notifications.length > 500) {
    store.notifications = store.notifications.slice(0, 500);
  }
  writeStore(store);
  return notif;
}

// -----------------------------------------------------------------------------
// AUDIT LOG HELPER
// -----------------------------------------------------------------------------
export function addAuditLog(params: {
  uid: string;
  action: string;
  details: string;
  ip_address?: string | null;
}) {
  const store = readStore();
  const log: TruwinAuditLog = {
    id: generateId('log'),
    uid: params.uid,
    action: params.action,
    details: params.details,
    ip_address: params.ip_address || null,
    created_at: new Date().toISOString(),
  };
  store.audit_logs.unshift(log);
  if (store.audit_logs.length > 500) {
    store.audit_logs = store.audit_logs.slice(0, 500);
  }
  writeStore(store);
  return log;
}

// -----------------------------------------------------------------------------
// AUTHENTICATION & SINGLE-DEVICE ENFORCEMENT
// -----------------------------------------------------------------------------

/**
 * Normal User Authentication
 * Strict rule: One UID = One active device session.
 */
export async function authenticateUser(params: {
  uid: string;
  password: string;
  deviceId: string;
  deviceName: string;
  ip: string;
  userAgent: string;
}) {
  const store = readStore();
  const cleanUid = params.uid.trim();

  // Find user (case-insensitive for convenience)
  const user = store.users.find((u) => u.uid.toLowerCase() === cleanUid.toLowerCase());
  if (!user || user.role === 'admin') {
    return { ok: false, error: 'INVALID_CREDENTIALS', message: 'Invalid UID or password.' };
  }

  // Check account status
  if (user.status === 'inactive' || user.status === 'suspended') {
    return {
      ok: false,
      error: 'ACCOUNT_DEACTIVATED',
      message: `Your account is ${user.status}. Please contact administrator for access.`,
    };
  }

  // Verify password
  if (!verifyPassword(params.password, user.password_hash)) {
    return { ok: false, error: 'INVALID_CREDENTIALS', message: 'Invalid UID or password.' };
  }

  // Single-device authorization check
  const reqDeviceId = params.deviceId.trim();
  const reqDeviceName = params.deviceName.trim() || 'Unknown Device';

  if (!user.bound_device_id) {
    // First login or reset device: automatically bind to this device
    user.bound_device_id = reqDeviceId;
    user.bound_device_name = reqDeviceName;
    addNotification({
      type: 'DEVICE_CHANGED',
      title: 'Device Bound to User',
      message: `UID '${user.uid}' registered and bound new device: '${reqDeviceName}' (${reqDeviceId}).`,
      uid: user.uid,
      device_id: reqDeviceId,
      device_name: reqDeviceName,
      ip_address: params.ip,
    });
  } else if (user.bound_device_id !== reqDeviceId) {
    // Attempted login from unauthorized device!
    addNotification({
      type: 'UNAUTHORIZED_DEVICE',
      title: 'Unauthorized Device Blocked',
      message: `Login blocked for '${user.uid}' from unauthorized device '${reqDeviceName}' (${reqDeviceId}). Assigned to '${user.bound_device_name || user.bound_device_id}'.`,
      uid: user.uid,
      device_id: reqDeviceId,
      device_name: reqDeviceName,
      ip_address: params.ip,
    });
    return {
      ok: false,
      error: 'UNAUTHORIZED_DEVICE',
      message: `Unauthorized device. This account is locked to '${user.bound_device_name || 'another device'}'. Contact administrator to reassign.`,
    };
  }

  // Invalidate any previous active sessions for this user (Strict 1 session per UID)
  store.sessions.forEach((s) => {
    if (s.uid.toLowerCase() === cleanUid.toLowerCase()) {
      s.is_valid = false;
    }
  });

  // Create new active session
  const token = generateSessionToken();
  const now = new Date().toISOString();

  const newSession: TruwinSession = {
    id: generateId('sess'),
    token,
    uid: user.uid,
    role: 'user',
    device_id: reqDeviceId,
    device_name: reqDeviceName,
    ip_address: params.ip,
    user_agent: params.userAgent,
    is_valid: true,
    created_at: now,
    last_activity: now,
  };
  store.sessions.unshift(newSession);

  // Update user state
  user.active_session_token = token;
  user.active_device_id = reqDeviceId;
  user.active_device_name = reqDeviceName;
  user.is_online = true;
  user.last_heartbeat = now;
  user.last_login_at = now;
  user.last_ip = params.ip;
  user.updated_at = now;

  addNotification({
    type: 'LOGIN',
    title: 'User Login',
    message: `User '${user.uid}' logged in from '${reqDeviceName}'.`,
    uid: user.uid,
    device_id: reqDeviceId,
    device_name: reqDeviceName,
    ip_address: params.ip,
  });

  addAuditLog({
    uid: user.uid,
    action: 'USER_LOGIN',
    details: `Authenticated on device ${reqDeviceName} (${reqDeviceId}) from IP ${params.ip}`,
    ip_address: params.ip,
  });

  writeStore(store);

  const { password_hash: _, ...safeUser } = user;
  return { ok: true, token, user: safeUser };
}

/**
 * Admin Authentication
 */
export async function authenticateAdmin(params: {
  uid: string;
  password: string;
  deviceId: string;
  deviceName: string;
  ip: string;
  userAgent: string;
}) {
  const store = readStore();
  const { uid: envAdminUid, password: envAdminPassword } = getAdminCredentials();

  const cleanUid = params.uid.trim();
  const cleanPassword = params.password.trim();

  if (cleanUid !== envAdminUid || cleanPassword !== envAdminPassword) {
    return { ok: false, error: 'INVALID_CREDENTIALS', message: 'Invalid Admin ID or Password.' };
  }

  const admin = store.users.find((u) => u.role === 'admin');
  if (!admin) {
    return { ok: false, error: 'ADMIN_NOT_FOUND', message: 'Admin account not configured.' };
  }

  // Create admin session
  const token = generateSessionToken();
  const now = new Date().toISOString();

  const session: TruwinSession = {
    id: generateId('sess_adm'),
    token,
    uid: admin.uid,
    role: 'admin',
    device_id: params.deviceId,
    device_name: params.deviceName || 'Admin Station',
    ip_address: params.ip,
    user_agent: params.userAgent,
    is_valid: true,
    created_at: now,
    last_activity: now,
  };
  store.sessions.unshift(session);

  admin.active_session_token = token;
  admin.active_device_id = params.deviceId;
  admin.active_device_name = params.deviceName || 'Admin Station';
  admin.is_online = true;
  admin.last_heartbeat = now;
  admin.last_login_at = now;
  admin.last_ip = params.ip;
  admin.updated_at = now;

  addNotification({
    type: 'LOGIN',
    title: 'Admin Console Access',
    message: `Administrator '${admin.uid}' logged into Control Panel.`,
    uid: admin.uid,
    device_id: params.deviceId,
    device_name: params.deviceName,
    ip_address: params.ip,
  });

  writeStore(store);

  const { password_hash: _, ...safeAdmin } = admin;
  return { ok: true, token, user: safeAdmin };
}

/**
 * Validate active session token
 */
export async function validateSession(token: string) {
  if (!token) return null;
  const store = readStore();
  const session = store.sessions.find((s) => s.token === token && s.is_valid);
  if (!session) return null;

  const user = store.users.find((u) => u.uid === session.uid);
  if (!user) return null;

  // Single-device guarantee: user's active_session_token must match this token
  if (user.active_session_token !== token) {
    session.is_valid = false;
    writeStore(store);
    return null;
  }

  // Check account status
  if (user.status === 'inactive' || user.status === 'suspended') {
    session.is_valid = false;
    user.active_session_token = null;
    user.is_online = false;
    writeStore(store);
    return null;
  }

  const { password_hash: _, ...safeUser } = user;
  return { session, user: safeUser };
}

/**
 * Handle periodic heartbeat from active client
 */
export async function recordHeartbeat(token: string, deviceId: string) {
  if (!token) return { ok: false, error: 'NO_TOKEN' };
  const store = readStore();
  const session = store.sessions.find((s) => s.token === token && s.is_valid);
  if (!session) return { ok: false, error: 'SESSION_EXPIRED' };

  const user = store.users.find((u) => u.uid === session.uid);
  if (!user || user.active_session_token !== token) {
    return { ok: false, error: 'SESSION_REVOKED' };
  }

  const now = new Date().toISOString();
  session.last_activity = now;
  user.last_heartbeat = now;
  user.is_online = true;

  writeStore(store);
  return { ok: true, is_online: true };
}

/**
 * User / Admin Logout
 */
export async function logoutSession(token: string) {
  const store = readStore();
  const session = store.sessions.find((s) => s.token === token);
  if (session) {
    session.is_valid = false;
    const user = store.users.find((u) => u.uid === session.uid);
    if (user && user.active_session_token === token) {
      user.active_session_token = null;
      user.is_online = false;
      addNotification({
        type: 'LOGOUT',
        title: 'User Logout',
        message: `UID '${user.uid}' logged out.`,
        uid: user.uid,
        device_id: session.device_id,
        device_name: session.device_name,
        ip_address: session.ip_address,
      });
    }
  }
  writeStore(store);
  return { ok: true };
}

/**
 * Immediate Session Termination by Admin
 */
export async function terminateUserSession(uid: string) {
  const store = readStore();
  const cleanUid = uid.trim();
  const user = store.users.find((u) => u.uid.toLowerCase() === cleanUid.toLowerCase());
  if (!user) return { ok: false, error: 'User not found' };

  user.active_session_token = null;
  user.is_online = false;

  store.sessions.forEach((s) => {
    if (s.uid.toLowerCase() === cleanUid.toLowerCase()) {
      s.is_valid = false;
    }
  });

  addNotification({
    type: 'SESSION_TERMINATED',
    title: 'Session Terminated by Admin',
    message: `Administrator forcefully terminated active session for UID '${user.uid}'.`,
    uid: user.uid,
    device_id: user.active_device_id,
    device_name: user.active_device_name,
  });

  addAuditLog({
    uid: 'admin',
    action: 'FORCE_TERMINATE_SESSION',
    details: `Session for UID '${user.uid}' was terminated by admin`,
  });

  writeStore(store);
  return { ok: true };
}

// -----------------------------------------------------------------------------
// USER MANAGEMENT (ADMIN ACTIONS)
// -----------------------------------------------------------------------------

export async function adminGetUsers(params?: { search?: string; page?: number; limit?: number }) {
  const store = readStore();
  let list = store.users
    .filter((u) => u.role !== 'admin')
    .map(({ password_hash: _, ...safe }) => safe);

  // Search filter: UID, Email, Phone
  const search = params?.search?.trim().toLowerCase();
  if (search) {
    list = list.filter((u) => {
      const matchUid = u.uid.toLowerCase().includes(search);
      const matchEmail = (u.email || '').toLowerCase().includes(search);
      const matchPhone = (u.phone || '').toLowerCase().includes(search);
      return matchUid || matchEmail || matchPhone;
    });
  }

  // Strict descending chronological order: latest created first
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const total = list.length;
  const page = Math.max(1, params?.page || 1);
  const limit = Math.max(1, params?.limit || 50);
  const start = (page - 1) * limit;
  const paginated = list.slice(start, start + limit);

  return { users: paginated, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function adminCreateUser(params: {
  uid: string;
  email?: string;
  phone?: string;
  password?: string;
  marketing_access?: TruwinUser['marketing_access'];
  bound_device_id?: string;
  bound_device_name?: string;
}) {
  const store = readStore();
  const cleanUid = params.uid.trim();

  if (!cleanUid) {
    return { ok: false, error: 'UID is required.' };
  }

  if (store.users.some((u) => u.uid.toLowerCase() === cleanUid.toLowerCase())) {
    return { ok: false, error: 'A user with this UID already exists.' };
  }

  const now = new Date().toISOString();
  const password = params.password || 'truwin123';

  const newUser: TruwinUser = {
    id: generateId('usr'),
    uid: cleanUid,
    email: params.email?.trim() || '',
    phone: params.phone?.trim() || '',
    password_hash: hashPassword(password),
    role: 'user',
    status: 'active',
    marketing_access: params.marketing_access || 'Not Requested',
    marketing_access_updated_at: params.marketing_access ? now : null,
    bound_device_id: params.bound_device_id?.trim() || null,
    bound_device_name: params.bound_device_name?.trim() || null,
    active_device_id: null,
    active_device_name: null,
    active_session_token: null,
    is_online: false,
    last_heartbeat: null,
    last_login_at: null,
    last_ip: null,
    created_at: now,
    updated_at: now,
  };

  store.users.unshift(newUser);

  addNotification({
    type: 'USER_CREATED',
    title: 'New User Created',
    message: `User '${cleanUid}' (${newUser.email || 'No email'}) created by administrator.`,
    uid: cleanUid,
  });

  addAuditLog({
    uid: 'admin',
    action: 'CREATE_USER',
    details: `Created user '${cleanUid}' with marketing access: ${newUser.marketing_access}`,
  });

  writeStore(store);

  const { password_hash: _, ...safe } = newUser;
  return { ok: true, user: safe };
}

export async function adminUpdateUser(
  idOrUid: string,
  updates: {
    email?: string;
    phone?: string;
    status?: 'active' | 'inactive' | 'suspended';
    marketing_access?: TruwinUser['marketing_access'];
    bound_device_id?: string | null;
    bound_device_name?: string | null;
  }
) {
  const store = readStore();
  const user = store.users.find(
    (u) => u.id === idOrUid || u.uid.toLowerCase() === idOrUid.toLowerCase()
  );
  if (!user || user.role === 'admin') {
    return { ok: false, error: 'User not found.' };
  }

  const now = new Date().toISOString();
  if (updates.email !== undefined) user.email = updates.email.trim();
  if (updates.phone !== undefined) user.phone = updates.phone.trim();
  if (updates.status !== undefined) {
    user.status = updates.status;
    if (user.status !== 'active') {
      user.active_session_token = null;
      user.is_online = false;
    }
  }
  if (updates.marketing_access !== undefined) {
    user.marketing_access = updates.marketing_access;
    user.marketing_access_updated_at = now;
  }
  if (updates.bound_device_id !== undefined) {
    user.bound_device_id = updates.bound_device_id ? updates.bound_device_id.trim() : null;
  }
  if (updates.bound_device_name !== undefined) {
    user.bound_device_name = updates.bound_device_name ? updates.bound_device_name.trim() : null;
  }
  user.updated_at = now;

  writeStore(store);
  const { password_hash: _, ...safe } = user;
  return { ok: true, user: safe };
}

export async function adminResetPassword(idOrUid: string, newPassword: string) {
  const store = readStore();
  const user = store.users.find(
    (u) => u.id === idOrUid || u.uid.toLowerCase() === idOrUid.toLowerCase()
  );
  if (!user) return { ok: false, error: 'User not found.' };

  user.password_hash = hashPassword(newPassword);
  user.updated_at = new Date().toISOString();

  addAuditLog({
    uid: 'admin',
    action: 'RESET_PASSWORD',
    details: `Password reset for UID '${user.uid}'`,
  });

  writeStore(store);
  return { ok: true };
}

export async function adminReassignDevice(
  idOrUid: string,
  newDeviceId?: string | null,
  newDeviceName?: string | null
) {
  const store = readStore();
  const user = store.users.find(
    (u) => u.id === idOrUid || u.uid.toLowerCase() === idOrUid.toLowerCase()
  );
  if (!user) return { ok: false, error: 'User not found.' };

  const oldDevice = user.bound_device_name || user.bound_device_id || 'None';
  user.bound_device_id = newDeviceId ? newDeviceId.trim() : null;
  user.bound_device_name = newDeviceName ? newDeviceName.trim() : null;

  // Immediately terminate old session if device was reassigned or reset
  user.active_session_token = null;
  user.is_online = false;

  addNotification({
    type: 'DEVICE_CHANGED',
    title: 'Device Reassigned',
    message: `Admin reassigned device for UID '${user.uid}' from '${oldDevice}' to '${user.bound_device_name || 'Unlocked/Next login'}'.`,
    uid: user.uid,
  });

  addAuditLog({
    uid: 'admin',
    action: 'REASSIGN_DEVICE',
    details: `Reassigned device for '${user.uid}' to ${user.bound_device_id || 'Unlocked'}`,
  });

  writeStore(store);
  return { ok: true, user };
}

export async function adminDeleteUser(idOrUid: string) {
  const store = readStore();
  const idx = store.users.findIndex(
    (u) => (u.id === idOrUid || u.uid.toLowerCase() === idOrUid.toLowerCase()) && u.role !== 'admin'
  );
  if (idx === -1) return { ok: false, error: 'User not found or is protected admin.' };

  const removed = store.users.splice(idx, 1)[0];
  // Invalidate any active sessions
  store.sessions.forEach((s) => {
    if (s.uid === removed.uid) s.is_valid = false;
  });

  addAuditLog({
    uid: 'admin',
    action: 'DELETE_USER',
    details: `Deleted user UID '${removed.uid}' (${removed.email})`,
  });

  writeStore(store);
  return { ok: true };
}

// -----------------------------------------------------------------------------
// MARKETING ACCESS & ACCESS REQUESTS
// -----------------------------------------------------------------------------

export async function userRequestMarketingAccess(uid: string, reason?: string) {
  const store = readStore();
  const user = store.users.find((u) => u.uid.toLowerCase() === uid.toLowerCase());
  if (!user) return { ok: false, error: 'User not found' };

  user.marketing_access = 'Pending Approval';
  user.marketing_access_updated_at = new Date().toISOString();

  // Check if existing request exists
  let req = store.access_requests.find((r) => r.uid.toLowerCase() === uid.toLowerCase());
  if (req) {
    req.status = 'Pending Approval';
    req.request_reason = reason || 'User requested access';
    req.updated_at = new Date().toISOString();
  } else {
    req = {
      id: generateId('req'),
      uid: user.uid,
      email: user.email,
      phone: user.phone,
      status: 'Pending Approval',
      request_reason: reason || 'User requested marketing access from dashboard',
      reviewed_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.access_requests.unshift(req);
  }

  addNotification({
    type: 'ACCESS_REQUEST',
    title: 'Marketing Access Requested',
    message: `UID '${user.uid}' requested access to Marketing Credentials area.`,
    uid: user.uid,
  });

  writeStore(store);
  return { ok: true, status: user.marketing_access };
}

export async function adminReviewAccessRequest(
  requestIdOrUid: string,
  decision: 'Approved' | 'Rejected' | 'Revoked'
) {
  const store = readStore();
  const req = store.access_requests.find(
    (r) => r.id === requestIdOrUid || r.uid.toLowerCase() === requestIdOrUid.toLowerCase()
  );
  const targetUid = req ? req.uid : requestIdOrUid;
  const user = store.users.find((u) => u.uid.toLowerCase() === targetUid.toLowerCase());

  if (user) {
    user.marketing_access = decision;
    user.marketing_access_updated_at = new Date().toISOString();
  }

  if (req) {
    req.status = decision;
    req.reviewed_by = 'admin';
    req.updated_at = new Date().toISOString();
  }

  const notifType: TruwinNotification['type'] =
    decision === 'Approved'
      ? 'ACCESS_APPROVED'
      : decision === 'Rejected'
        ? 'ACCESS_REJECTED'
        : 'ACCESS_REVOKED';

  addNotification({
    type: notifType,
    title: `Marketing Access ${decision}`,
    message: `Admin set marketing access for '${targetUid}' to ${decision}.`,
    uid: targetUid,
  });

  writeStore(store);
  return { ok: true, decision };
}

export async function getMarketingCredentialsForUser(uid: string, search?: string) {
  const store = readStore();
  const user = store.users.find((u) => u.uid.toLowerCase() === uid.toLowerCase());
  if (!user || user.marketing_access !== 'Approved') {
    return { ok: false, error: 'FORBIDDEN', message: 'You do not have approved marketing access.' };
  }

  let list = [...store.marketing_credentials];

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (item) =>
        item.category.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.access_key.toLowerCase().includes(q) ||
        item.endpoint.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q)
    );
  }

  // Sort descending by created_at
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return { ok: true, data: list };
}

// -----------------------------------------------------------------------------
// DASHBOARD STATS & SESSIONS MONITOR
// -----------------------------------------------------------------------------

export async function getAdminDashboardStats() {
  const store = readStore();
  const users = store.users.filter((u) => u.role !== 'admin');

  const totalRegisteredUsers = users.length;
  const activeUsers = users.filter((u) => u.is_online).length;
  const inactiveUsers = users.filter((u) => !u.is_online).length;
  const pendingRequests = users.filter((u) => u.marketing_access === 'Pending Approval').length;
  const approvedUsers = users.filter((u) => u.marketing_access === 'Approved').length;
  const rejectedUsers = users.filter((u) => u.marketing_access === 'Rejected').length;
  const activeDevices = users.filter((u) => u.is_online && u.active_device_id).length;

  return {
    totalRegisteredUsers,
    activeUsers,
    inactiveUsers,
    pendingRequests,
    approvedUsers,
    rejectedUsers,
    activeDevices,
  };
}

export async function getLiveActiveSessions() {
  const store = readStore();
  // Filter users who are currently marked online or have valid active session
  const activeUsers = store.users
    .filter((u) => u.role !== 'admin' && (u.is_online || u.active_session_token))
    .map((u) => ({
      uid: u.uid,
      email: u.email,
      phone: u.phone,
      deviceId: u.active_device_id,
      deviceName: u.active_device_name,
      boundDeviceId: u.bound_device_id,
      boundDeviceName: u.bound_device_name,
      loginTime: u.last_login_at,
      lastHeartbeat: u.last_heartbeat,
      ip: u.last_ip,
      isOnline: u.is_online,
      sessionStatus: u.is_online ? 'Active' : 'Idle',
    }));

  // Sort latest login first
  activeUsers.sort((a, b) => {
    const tA = a.lastHeartbeat ? new Date(a.lastHeartbeat).getTime() : 0;
    const tB = b.lastHeartbeat ? new Date(b.lastHeartbeat).getTime() : 0;
    return tB - tA;
  });

  return activeUsers;
}

// -----------------------------------------------------------------------------
// NOTIFICATIONS MANAGEMENT
// -----------------------------------------------------------------------------

export async function getNotifications(limit: number = 100) {
  const store = readStore();
  const list = [...store.notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return list.slice(0, limit);
}

export async function markNotificationRead(id: string) {
  const store = readStore();
  const notif = store.notifications.find((n) => n.id === id);
  if (notif) {
    notif.is_read = true;
    writeStore(store);
  }
  return { ok: true };
}

export async function markAllNotificationsRead() {
  const store = readStore();
  store.notifications.forEach((n) => {
    n.is_read = true;
  });
  writeStore(store);
  return { ok: true };
}

export async function clearAllNotifications() {
  const store = readStore();
  store.notifications = [];
  writeStore(store);
  return { ok: true };
}
