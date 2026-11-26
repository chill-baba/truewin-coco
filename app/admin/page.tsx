'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getClientDeviceInfo } from '@/lib/device';
import {
  Shield,
  Users,
  Radio,
  Key,
  Bell,
  Settings,
  LogOut,
  Search,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  Lock,
  UserCheck,
  UserX,
  Clock,
  ShieldAlert,
  ChevronRight,
  Filter,
  Activity,
  Sparkles,
} from 'lucide-react';

interface Stats {
  totalRegisteredUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingRequests: number;
  approvedUsers: number;
  rejectedUsers: number;
  activeDevices: number;
}

interface UserItem {
  id: string;
  uid: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  marketing_access: 'Not Requested' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Revoked';
  bound_device_id: string | null;
  bound_device_name: string | null;
  active_device_id: string | null;
  active_device_name: string | null;
  is_online: boolean;
  last_heartbeat: string | null;
  last_login_at: string | null;
  created_at: string;
}

interface ActiveSessionItem {
  uid: string;
  email: string;
  phone: string;
  deviceId: string | null;
  deviceName: string | null;
  boundDeviceId: string | null;
  boundDeviceName: string | null;
  loginTime: string | null;
  lastHeartbeat: string | null;
  ip: string | null;
  isOnline: boolean;
  sessionStatus: string;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  uid: string;
  device_id: string | null;
  device_name: string | null;
  ip_address: string | null;
  is_read: boolean;
  created_at: string;
}

interface AccessRequestItem {
  id: string;
  uid: string;
  email: string;
  phone: string;
  status: string;
  request_reason: string;
  created_at: string;
}

interface MarketingCred {
  id: string;
  category: string;
  label: string;
  access_key: string;
  secret_key: string;
  endpoint: string;
  notes: string;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();

  // Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [adminUidInput, setAdminUidInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'sessions' | 'requests' | 'marketing' | 'notifications' | 'settings'
  >('overview');

  // Core Data
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSessionItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequestItem[]>([]);
  const [marketingCreds, setMarketingCreds] = useState<MarketingCred[]>([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilterStatus, setUserFilterStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Modals & Actions
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPassModal, setShowResetPassModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddCredModal, setShowAddCredModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form states
  const [newUserForm, setNewUserForm] = useState({
    uid: '',
    email: '',
    phone: '',
    password: '',
    marketing_access: 'Not Requested' as UserItem['marketing_access'],
    bound_device_name: '',
  });

  const [editUserForm, setEditUserForm] = useState({
    email: '',
    phone: '',
    status: 'active' as UserItem['status'],
    marketing_access: 'Not Requested' as UserItem['marketing_access'],
  });

  const [resetPassInput, setResetPassInput] = useState('');
  const [reassignDeviceInput, setReassignDeviceInput] = useState('');
  const [newCredForm, setNewCredForm] = useState({
    category: 'Meta Ads Manager',
    label: '',
    access_key: '',
    secret_key: '',
    endpoint: '',
    notes: '',
  });

  // Copy Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch all Admin Data
  const loadAdminData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [statsRes, usersRes, sessRes, notifRes, reqRes, credRes] = await Promise.all([
        fetch('/api/admin/stats').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/sessions').then((r) => r.json()),
        fetch('/api/admin/notifications').then((r) => r.json()),
        fetch('/api/admin/access-requests').then((r) => r.json()),
        fetch('/api/admin/marketing-data').then((r) => r.json()),
      ]);

      if (statsRes.ok) setStats(statsRes.stats);
      if (usersRes.ok) setUsers(usersRes.users || []);
      if (sessRes.ok) setActiveSessions(sessRes.sessions || []);
      if (notifRes.ok) setNotifications(notifRes.notifications || []);
      if (reqRes.ok) setAccessRequests(reqRes.requests || []);
      if (credRes.ok) setMarketingCreds(credRes.data || []);
    } catch (e) {
      console.error('Failed to load admin data', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Check Current Session
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (res.ok && data.authenticated && data.user?.role === 'admin') {
        setIsAdminAuthenticated(true);
        loadAdminData();
      } else {
        setIsAdminAuthenticated(false);
      }
    } catch {
      setIsAdminAuthenticated(false);
    }
  }, [loadAdminData]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Periodic Auto-Refresh for Live Monitoring
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    const interval = setInterval(() => {
      fetch('/api/admin/sessions')
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) setActiveSessions(d.sessions || []);
        })
        .catch(() => {});
      fetch('/api/admin/stats')
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) setStats(d.stats);
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [isAdminAuthenticated]);

  // Admin Login Handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const dev = getClientDeviceInfo();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: adminUidInput.trim(),
          password: adminPasswordInput.trim(),
          deviceId: dev.deviceId,
          deviceName: `Admin Station (${dev.deviceName})`,
          isAdmin: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setLoginError(data.message || 'Invalid administrator credentials.');
        setLoginLoading(false);
        return;
      }

      setIsAdminAuthenticated(true);
      loadAdminData();
    } catch {
      setLoginError('Network connection failed. Try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAdminAuthenticated(false);
    router.push('/admin');
  };

  // User Actions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error || 'Failed to create user');
        return;
      }
      setShowAddModal(false);
      setNewUserForm({
        uid: '',
        email: '',
        phone: '',
        password: '',
        marketing_access: 'Not Requested',
        bound_device_name: '',
      });
      loadAdminData();
    } catch {
      alert('Error creating user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUserForm),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error || 'Failed to update user');
        return;
      }
      setShowEditModal(false);
      loadAdminData();
    } catch {
      alert('Error updating user');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetPassInput) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', password: resetPassInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error || 'Failed to reset password');
        return;
      }
      setShowResetPassModal(false);
      setResetPassInput('');
      alert(`Password updated successfully for UID: ${selectedUser.uid}`);
    } catch {
      alert('Error resetting password');
    }
  };

  const handleReassignDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reassign_device',
          deviceId: reassignDeviceInput || null,
          deviceName: reassignDeviceInput ? 'Assigned Hardware' : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error || 'Failed to reassign device');
        return;
      }
      setShowReassignModal(false);
      setReassignDeviceInput('');
      loadAdminData();
    } catch {
      alert('Error reassigning device');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error || 'Failed to delete user');
        return;
      }
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadAdminData();
    } catch {
      alert('Error deleting user');
    }
  };

  const handleTerminateSession = async (uid: string) => {
    if (!confirm(`Are you sure you want to forcefully terminate the active session for UID '${uid}'?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/sessions?uid=${encodeURIComponent(uid)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        loadAdminData();
      }
    } catch {
      alert('Error terminating session');
    }
  };

  const handleReviewAccess = async (idOrUid: string, decision: 'Approved' | 'Rejected' | 'Revoked') => {
    try {
      const res = await fetch('/api/admin/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idOrUid, decision }),
      });
      const data = await res.json();
      if (data.ok) {
        loadAdminData();
      }
    } catch {
      alert('Error reviewing request');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleClearNotifications = async () => {
    await fetch('/api/admin/notifications', { method: 'DELETE' });
    setNotifications([]);
  };

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/marketing-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCredForm),
      });
      const data = await res.json();
      if (data.ok) {
        setShowAddCredModal(false);
        setNewCredForm({
          category: 'Meta Ads Manager',
          label: '',
          access_key: '',
          secret_key: '',
          endpoint: '',
          notes: '',
        });
        loadAdminData();
      }
    } catch {
      alert('Error creating credential');
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (!confirm('Are you sure you want to remove this marketing credential?')) return;
    try {
      await fetch(`/api/admin/marketing-data?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      loadAdminData();
    } catch {
      alert('Error deleting credential');
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    let list = [...users];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          u.uid.toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.phone || '').toLowerCase().includes(q)
      );
    }
    if (userFilterStatus !== 'all') {
      if (userFilterStatus === 'online') list = list.filter((u) => u.is_online);
      else if (userFilterStatus === 'offline') list = list.filter((u) => !u.is_online);
      else if (userFilterStatus === 'approved') list = list.filter((u) => u.marketing_access === 'Approved');
      else if (userFilterStatus === 'pending') list = list.filter((u) => u.marketing_access === 'Pending Approval');
    }
    return list;
  }, [users, searchQuery, userFilterStatus]);

  const unreadNotifCount = notifications.filter((n) => !n.is_read).length;

  // ---------------------------------------------------------------------------
  // RENDER: Loading or Admin Login
  // ---------------------------------------------------------------------------
  if (isAdminAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAdminAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#07090e] bg-ambient-grid text-[#f1f5f9] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-500/10 rounded-full blur-[110px] pointer-events-none" />

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/10 border border-indigo-500/30 text-indigo-400 mb-2 glow-indigo shadow-2xl animate-float">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              TRUWIN <span className="gradient-text-indigo font-light">COCO</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Primary Administrator Control Console
            </p>
          </div>

          <div className="glass-panel-elevated rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-800/80 pb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                Root Administrator Access
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your administrative credentials configured via environment.
              </p>
            </div>

            {loginError && (
              <div className="p-4 rounded-xl badge-rose text-xs flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <div className="leading-relaxed">{loginError}</div>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Admin ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Shield className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={adminUidInput}
                    onChange={(e) => setAdminUidInput(e.target.value)}
                    placeholder="e.g. hellobabu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500 text-xs transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Master Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500 text-xs transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:opacity-95 text-white font-medium text-xs shadow-lg glow-indigo transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Access Control Panel</span>
                )}
              </button>
            </form>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 px-2">
            <Link href="/" className="hover:text-slate-300 transition-colors">
              ← System Gateway
            </Link>
            <Link href="/login" className="hover:text-indigo-400 text-slate-400 transition-colors">
              Normal User Login →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Main Admin Console (Authenticated)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#07090e] bg-ambient-grid text-[#f1f5f9] flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 glass-panel border-r border-slate-800/80 flex flex-col fixed inset-y-0 z-30">
        {/* Brand */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold glow-indigo">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-wide text-sm">TRUWIN</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded badge-indigo font-bold">
                ADMIN
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Access Management</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'users', label: 'Users', icon: Users, badge: users.length },
            {
              id: 'sessions',
              label: 'Active Sessions',
              icon: Radio,
              badge: stats?.activeUsers || activeSessions.length,
              badgeColor: 'badge-emerald',
            },
            {
              id: 'requests',
              label: 'Access Requests',
              icon: UserCheck,
              badge: stats?.pendingRequests,
              badgeColor: 'badge-amber',
            },
            { id: 'marketing', label: 'Marketing Access', icon: Key },
            {
              id: 'notifications',
              label: 'Notifications',
              icon: Bell,
              badge: unreadNotifCount,
              badgeColor: 'badge-indigo',
            },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="truncate">Administrator</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 text-xs transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative z-10">
        {/* Header Bar */}
        <header className="h-16 border-b border-slate-800/80 glass-panel px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-white capitalize">
              {activeTab === 'overview'
                ? 'System Overview'
                : activeTab === 'users'
                ? 'User Management'
                : activeTab === 'sessions'
                ? 'Live Active Sessions'
                : activeTab === 'requests'
                ? 'Access Approval Requests'
                : activeTab === 'marketing'
                ? 'Marketing Credentials Control'
                : activeTab === 'notifications'
                ? 'Audit & Notification Center'
                : 'System Settings'}
            </h1>
            <span className="text-xs text-slate-600">|</span>
            <span className="text-xs text-slate-400">TRUWIN COCO Access Engine</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAdminData}
              disabled={refreshing}
              title="Refresh Data"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            {activeTab === 'users' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:opacity-95 text-white text-xs font-medium shadow-md glow-indigo cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create User</span>
              </button>
            )}

            {activeTab === 'marketing' && (
              <button
                onClick={() => setShowAddCredModal(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:opacity-95 text-white text-xs font-medium shadow-md glow-indigo cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Credential</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-8 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  {
                    label: 'Total Registered',
                    val: stats?.totalRegisteredUsers ?? users.length,
                    icon: Users,
                    color: 'text-white',
                  },
                  {
                    label: 'Active Users',
                    val: stats?.activeUsers ?? 0,
                    icon: Radio,
                    color: 'text-emerald-400',
                  },
                  {
                    label: 'Inactive Users',
                    val: stats?.inactiveUsers ?? 0,
                    icon: UserX,
                    color: 'text-slate-400',
                  },
                  {
                    label: 'Pending Requests',
                    val: stats?.pendingRequests ?? 0,
                    icon: Clock,
                    color: 'text-amber-400',
                  },
                  {
                    label: 'Approved Users',
                    val: stats?.approvedUsers ?? 0,
                    icon: UserCheck,
                    color: 'text-emerald-400',
                  },
                  {
                    label: 'Rejected Users',
                    val: stats?.rejectedUsers ?? 0,
                    icon: XCircle,
                    color: 'text-rose-400',
                  },
                  {
                    label: 'Active Devices',
                    val: stats?.activeDevices ?? 0,
                    icon: Smartphone,
                    color: 'text-indigo-400',
                  },
                ].map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={i}
                      className="glass-panel p-4 rounded-2xl space-y-2 shadow-lg"
                    >
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                          {card.label}
                        </span>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className={`text-2xl font-extrabold ${card.color}`}>{card.val}</div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions & Live Overview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Sessions Mini-Table */}
                <div className="lg:col-span-2 glass-panel-elevated rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <h3 className="text-sm font-bold text-white">Live Active Device Sessions</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('sessions')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <span>View All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {activeSessions.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No active device sessions currently online.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/60">
                      {activeSessions.slice(0, 5).map((s, idx) => (
                        <div key={idx} className="py-3 flex items-center justify-between text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{s.uid}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full badge-emerald font-semibold">
                                {s.sessionStatus}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <Smartphone className="w-3 h-3 text-slate-500" />
                              <span>{s.deviceName || s.deviceId}</span>
                              {s.ip && <span>• IP: {s.ip}</span>}
                            </div>
                          </div>

                          <button
                            onClick={() => handleTerminateSession(s.uid)}
                            className="px-2.5 py-1 rounded-lg badge-rose text-[11px] font-semibold transition-all cursor-pointer"
                          >
                            Terminate
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Notifications Feed */}
                <div className="glass-panel-elevated rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-white">Recent Security Alerts</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('notifications')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <span>All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          n.type === 'UNAUTHORIZED_DEVICE'
                            ? 'badge-rose'
                            : n.type === 'ACCESS_REQUEST'
                            ? 'badge-amber'
                            : 'bg-[#090d16]/80 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(n.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-80 leading-snug">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800/80">
                <div className="w-full sm:w-96 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by UID, Email, or Phone..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 text-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-500 hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={userFilterStatus}
                    onChange={(e) => setUserFilterStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-slate-300 focus:border-indigo-500"
                  >
                    <option value="all">All Users ({users.length})</option>
                    <option value="online">Online Currently</option>
                    <option value="offline">Offline</option>
                    <option value="approved">Marketing Approved</option>
                    <option value="pending">Marketing Pending</option>
                  </select>
                </div>
              </div>

              {/* Users Cards / List (Sorted Descending Chronological Order) */}
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center glass-panel-elevated rounded-2xl space-y-3">
                  <Users className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-400">
                    {searchQuery ? `No users matching "${searchQuery}"` : 'No users registered yet.'}
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium cursor-pointer"
                  >
                    Create First User
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="glass-card rounded-2xl p-5 space-y-4 flex flex-col justify-between"
                    >
                      {/* Top Header: UID + Copy button + Status Badge */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white tracking-wide">
                                {u.uid}
                              </span>
                              <button
                                onClick={() => copyToClipboard(u.uid, `uid-${u.id}`)}
                                title="Copy UID"
                                className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-xs cursor-pointer"
                              >
                                {copiedKey === `uid-${u.id}` ? (
                                  <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
                                    <Check className="w-3 h-3" />
                                  </span>
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              Created:{' '}
                              {new Date(u.created_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {u.is_online ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full badge-emerald flex items-center gap-1 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Online
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 font-medium">
                                Offline
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Contact details with copy buttons */}
                        <div className="space-y-1.5 text-xs text-slate-300 bg-[#090d16]/80 p-3 rounded-xl border border-slate-800/60">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-[11px]">Email:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] truncate max-w-[170px]">
                                {u.email || 'None'}
                              </span>
                              {u.email && (
                                <button
                                  onClick={() => copyToClipboard(u.email, `em-${u.id}`)}
                                  className="text-slate-400 hover:text-indigo-400 cursor-pointer"
                                  title="Copy Email"
                                >
                                  {copiedKey === `em-${u.id}` ? (
                                    <span className="text-emerald-400 text-[10px] font-semibold">Copied!</span>
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-[11px]">Phone:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] truncate max-w-[170px]">
                                {u.phone || 'None'}
                              </span>
                              {u.phone && (
                                <button
                                  onClick={() => copyToClipboard(u.phone, `ph-${u.id}`)}
                                  className="text-slate-400 hover:text-indigo-400 cursor-pointer"
                                  title="Copy Phone"
                                >
                                  {copiedKey === `ph-${u.id}` ? (
                                    <span className="text-emerald-400 text-[10px] font-semibold">Copied!</span>
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2.5 rounded-lg bg-[#090d16]/80 border border-slate-800/60">
                            <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                              Marketing Access
                            </span>
                            <span
                              className={`font-semibold ${
                                u.marketing_access === 'Approved'
                                  ? 'text-emerald-400'
                                  : u.marketing_access === 'Pending Approval'
                                  ? 'text-amber-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {u.marketing_access}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-[#090d16]/80 border border-slate-800/60">
                            <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                              Bound Device
                            </span>
                            <span className="text-slate-300 font-medium truncate block">
                              {u.bound_device_name || (u.bound_device_id ? 'Custom ID' : 'Unlocked')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                        <div className="flex items-center gap-1">
                          {/* Approve/Revoke Marketing Access */}
                          {u.marketing_access !== 'Approved' ? (
                            <button
                              onClick={() => handleReviewAccess(u.uid, 'Approved')}
                              className="px-2 py-1 rounded-lg badge-emerald text-[11px] font-semibold transition-all cursor-pointer"
                              title="Approve Marketing Credentials Access"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReviewAccess(u.uid, 'Revoked')}
                              className="px-2 py-1 rounded-lg badge-rose text-[11px] font-semibold transition-all cursor-pointer"
                              title="Revoke Marketing Credentials Access"
                            >
                              Revoke
                            </button>
                          )}

                          {/* Reassign Device */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setReassignDeviceInput(u.bound_device_id || '');
                              setShowReassignModal(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-all cursor-pointer"
                            title="Reassign or Unlock Device"
                          >
                            Device
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setResetPassInput('');
                              setShowResetPassModal(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-all cursor-pointer"
                            title="Reset User Password"
                          >
                            Pass
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Edit User */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setEditUserForm({
                                email: u.email,
                                phone: u.phone,
                                status: u.status,
                                marketing_access: u.marketing_access,
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                            title="Edit User Information"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Terminate Session */}
                          {u.is_online && (
                            <button
                              onClick={() => handleTerminateSession(u.uid)}
                              className="p-1.5 rounded-lg badge-amber transition-all cursor-pointer"
                              title="Force Terminate Session"
                            >
                              <Radio className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          )}

                          {/* Delete User */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 rounded-lg badge-rose transition-all cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACTIVE SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="glass-panel-elevated rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                      Live Heartbeat & Active Device Sessions
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Real-time single-device connections verified by cryptographic heartbeat.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full badge-emerald font-semibold">
                    {activeSessions.length} Devices Online
                  </span>
                </div>

                {activeSessions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No users are currently logged in.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#090d16] text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">UID</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4">Hardware / OS</th>
                          <th className="py-3 px-4">IP Address</th>
                          <th className="py-3 px-4">Last Activity</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {activeSessions.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-3 px-4 font-bold text-white">{s.uid}</td>
                            <td className="py-3 px-4 text-slate-300">
                              <div>{s.email || '—'}</div>
                              <div className="text-[10px] text-slate-500">{s.phone}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                              {s.deviceName || s.deviceId}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-400">{s.ip || '—'}</td>
                            <td className="py-3 px-4 text-slate-400">
                              {s.lastHeartbeat
                                ? new Date(s.lastHeartbeat).toLocaleTimeString()
                                : 'Just now'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] px-2 py-0.5 rounded-full badge-emerald font-semibold">
                                Active (Bound)
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleTerminateSession(s.uid)}
                                className="px-3 py-1 rounded-lg badge-rose font-semibold transition-all cursor-pointer"
                              >
                                Terminate Session
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ACCESS REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div className="glass-panel-elevated rounded-2xl p-6 space-y-4">
                <div className="border-b border-slate-800/80 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-400" />
                    Marketing Credentials Access Requests
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Review and authorize user requests to unlock protected marketing assets.
                  </p>
                </div>

                {accessRequests.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No marketing credentials access requests found.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60">
                    {accessRequests.map((req) => (
                      <div
                        key={req.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{req.uid}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                req.status === 'Approved'
                                  ? 'badge-emerald'
                                  : req.status === 'Pending Approval'
                                  ? 'badge-amber'
                                  : 'badge-rose'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">
                            Reason: <span className="text-slate-400">{req.request_reason}</span>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Requested: {new Date(req.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReviewAccess(req.id, 'Approved')}
                            className="px-3 py-1.5 rounded-xl badge-emerald text-xs font-semibold cursor-pointer"
                          >
                            Approve Access
                          </button>
                          <button
                            onClick={() => handleReviewAccess(req.id, 'Rejected')}
                            className="px-3 py-1.5 rounded-xl badge-rose text-xs font-semibold cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: MARKETING CREDENTIALS MANAGEMENT */}
          {activeTab === 'marketing' && (
            <div className="space-y-6">
              <div className="glass-panel-elevated rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Key className="w-5 h-5 text-indigo-400" />
                      Marketing Datasets & API Inventory
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Credentials stored here are exclusively accessible to users with &apos;Approved&apos; status.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddCredModal(true)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer shadow-md glow-indigo"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Key</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {marketingCreds.map((cred) => (
                    <div
                      key={cred.id}
                      className="glass-card rounded-xl p-5 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold badge-indigo px-2 py-0.5 rounded">
                            {cred.category}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1.5">{cred.label}</h4>
                        </div>
                        <button
                          onClick={() => handleDeleteCredential(cred.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                          title="Delete Credential"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {cred.notes && <p className="text-xs text-slate-400">{cred.notes}</p>}

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Access Key</span>
                          <div className="p-2 rounded bg-[#090d16] font-mono text-slate-200 text-[11px] truncate select-all">
                            {cred.access_key}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Secret Key</span>
                          <div className="p-2 rounded bg-[#090d16] font-mono text-slate-200 text-[11px] truncate select-all">
                            {cred.secret_key}
                          </div>
                        </div>

                        {cred.endpoint && (
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Endpoint</span>
                            <div className="p-2 rounded bg-[#090d16] font-mono text-slate-400 text-[11px] truncate">
                              {cred.endpoint}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="glass-panel-elevated rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="text-base font-bold text-white">Security Alerts & Audit Log</h3>
                      <p className="text-xs text-slate-400">
                        Descending chronological order of all security & access triggers.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                    >
                      Mark All Read
                    </button>
                    <button
                      onClick={handleClearNotifications}
                      className="px-3 py-1.5 rounded-xl badge-rose text-xs font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`py-3.5 px-3 flex items-start justify-between gap-4 rounded-xl transition-all ${
                        !n.is_read ? 'bg-indigo-500/5' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              n.type === 'UNAUTHORIZED_DEVICE'
                                ? 'badge-rose'
                                : n.type === 'LOGIN'
                                ? 'badge-emerald'
                                : 'badge-indigo'
                            }`}
                          >
                            {n.type}
                          </span>
                          <span className="font-semibold text-white text-xs">{n.title}</span>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                          )}
                        </div>
                        <p className="text-xs text-slate-300">{n.message}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl">
              <div className="glass-panel-elevated rounded-2xl p-6 space-y-6">
                <div className="border-b border-slate-800/80 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-400" />
                    System Infrastructure & Security Configuration
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Environment and runtime controls for TRUWIN COCO.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#090d16]/80 border border-slate-800/60 space-y-2">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">
                      Administrator Environment Mapping
                    </span>
                    <p className="text-slate-300">
                      Credentials are dynamically validated against environment variables (
                      <code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">
                        ADMIN_ID
                      </code>{' '}
                      and{' '}
                      <code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">
                        ADMIN_PASSWORD
                      </code>
                      ).
                    </p>
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Secured with server-side PBKDF2 hashing & HTTP-only sessions.</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#090d16]/80 border border-slate-800/60 space-y-2">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">
                      Single-Device Enforcement Rule
                    </span>
                    <p className="text-slate-300">
                      Policy:{' '}
                      <strong className="text-white">One UID = Exactly One Active Session</strong>.
                    </p>
                    <p className="text-slate-400">
                      If an unauthorized device attempts login, the session is blocked immediately
                      with HTTP 403 and logged to the Security Alert feed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: CREATE USER */}
      {/* --------------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel-elevated rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Create New User</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Unique UID *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.uid}
                  onChange={(e) => setNewUserForm({ ...newUserForm, uid: e.target.value })}
                  placeholder="e.g. coco_delta"
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="user@truwin.internal"
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Default: truwin123"
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Marketing Credentials Access</label>
                <select
                  value={newUserForm.marketing_access}
                  onChange={(e) =>
                    setNewUserForm({
                      ...newUserForm,
                      marketing_access: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white"
                >
                  <option value="Not Requested">Not Requested</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: EDIT USER */}
      {/* --------------------------------------------------------------------- */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel-elevated rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Edit User: {selectedUser.uid}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Account Status</label>
                <select
                  value={editUserForm.status}
                  onChange={(e) =>
                    setEditUserForm({ ...editUserForm, status: e.target.value as any })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Marketing Access</label>
                <select
                  value={editUserForm.marketing_access}
                  onChange={(e) =>
                    setEditUserForm({
                      ...editUserForm,
                      marketing_access: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white"
                >
                  <option value="Not Requested">Not Requested</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Revoked">Revoked</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: RESET PASSWORD */}
      {/* --------------------------------------------------------------------- */}
      {showResetPassModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel-elevated rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Reset Password</h3>
              <p className="text-xs text-slate-400 mt-1">Set a new password for {selectedUser.uid}</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={resetPassInput}
                  onChange={(e) => setResetPassInput(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetPassModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: REASSIGN DEVICE */}
      {/* --------------------------------------------------------------------- */}
      {showReassignModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel-elevated rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Device Binding & Reassignment</h3>
              <p className="text-xs text-slate-400 mt-1">
                Manage hardware lock for UID: <strong>{selectedUser.uid}</strong>
              </p>
            </div>

            <form onSubmit={handleReassignDevice} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="block text-slate-400">Bound Device Token / ID</label>
                <input
                  type="text"
                  value={reassignDeviceInput}
                  onChange={(e) => setReassignDeviceInput(e.target.value)}
                  placeholder="Leave empty to UNLOCK (binds to next login device)"
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500">
                  Tip: Clear this field to allow the user to log in from a new computer or phone.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Apply Device Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* --------------------------------------------------------------------- */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel-elevated border-rose-500/30 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-white text-sm">Confirm User Deletion</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete user <strong>{selectedUser.uid}</strong>? This action is
              irreversible and will immediately invalidate all active sessions.
            </p>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: ADD MARKETING CREDENTIAL */}
      {/* --------------------------------------------------------------------- */}
      {showAddCredModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel-elevated rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Add Marketing Credential</h3>
              <button
                onClick={() => setShowAddCredModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCredential} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Category *</label>
                <input
                  type="text"
                  required
                  value={newCredForm.category}
                  onChange={(e) => setNewCredForm({ ...newCredForm, category: e.target.value })}
                  placeholder="e.g. Meta Ads, Google Ads, CRM API"
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Label / Account Name *</label>
                <input
                  type="text"
                  required
                  value={newCredForm.label}
                  onChange={(e) => setNewCredForm({ ...newCredForm, label: e.target.value })}
                  placeholder="e.g. High Volume Conversion Campaign"
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Access Key / Client ID *</label>
                <input
                  type="text"
                  required
                  value={newCredForm.access_key}
                  onChange={(e) => setNewCredForm({ ...newCredForm, access_key: e.target.value })}
                  placeholder="Client ID or Public Token"
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Secret Key / Token *</label>
                <input
                  type="password"
                  required
                  value={newCredForm.secret_key}
                  onChange={(e) => setNewCredForm({ ...newCredForm, secret_key: e.target.value })}
                  placeholder="Secret Token"
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">API Endpoint (Optional)</label>
                <input
                  type="text"
                  value={newCredForm.endpoint}
                  onChange={(e) => setNewCredForm({ ...newCredForm, endpoint: e.target.value })}
                  placeholder="https://graph.facebook.com/v19.0/..."
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={newCredForm.notes}
                  onChange={(e) => setNewCredForm({ ...newCredForm, notes: e.target.value })}
                  placeholder="Instructions or usage notes..."
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Save Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
