'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getClientDeviceInfo } from '@/lib/device';
import {
  Shield,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
  Lock,
  ExternalLink,
  RefreshCw,
  Send,
  User,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

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

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [heartbeatActive, setHeartbeatActive] = useState(true);

  // Marketing access state
  const [credentials, setCredentials] = useState<MarketingCred[]>([]);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // UI state
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleSecret = (id: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Load user session
  const loadSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        router.push('/login');
        return;
      }
      if (data.user?.role === 'admin') {
        router.push('/admin');
        return;
      }
      setUser(data.user);
      setSessionInfo(data.session);

      // If approved for marketing, fetch credentials
      if (data.user?.marketing_access === 'Approved') {
        fetchMarketingData();
      }
    } catch (err) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchMarketingData = async (query: string = '') => {
    setLoadingCreds(true);
    try {
      const url = query
        ? `/api/user/marketing-data?search=${encodeURIComponent(query)}`
        : '/api/user/marketing-data';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.ok) {
        setCredentials(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load marketing credentials', err);
    } finally {
      setLoadingCreds(false);
    }
  };

  // Periodic heartbeat every 20 seconds to keep session alive & check single device validity
  useEffect(() => {
    loadSession();

    const dev = getClientDeviceInfo();
    const heartbeatInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: dev.deviceId }),
        });

        if (!res.ok) {
          // Session was revoked, device reassigned, or terminated by admin!
          setHeartbeatActive(false);
          alert('Your session has ended or was revoked by the administrator.');
          router.push('/login');
        }
      } catch (e) {
        // network glitch
      }
    }, 20000);

    return () => clearInterval(heartbeatInterval);
  }, [loadSession, router]);

  // Handle Search Input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchMarketingData(val);
  };

  // Request Access
  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequesting(true);
    try {
      const res = await fetch('/api/user/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: requestReason }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setRequestSuccess(true);
        setUser((prev: any) => ({ ...prev, marketing_access: 'Pending Approval' }));
      }
    } catch (err) {
      alert('Failed to submit access request');
    } finally {
      setRequesting(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090b10] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isApproved = user?.marketing_access === 'Approved';

  return (
    <div className="min-h-screen bg-[#090b10] text-[#e2e8f0] flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0d111a]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide text-base">TRUWIN</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  COCO USER
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Authenticated Member Console</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Single Device Session:</span>
              <span className="text-white font-medium">{user?.uid}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30 text-xs font-medium transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Account Identity Header */}
        <div className="bg-[#111622] border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  User Identification
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span>{user?.uid}</span>
                <button
                  onClick={() => copyToClipboard(user?.uid, 'uid')}
                  title="Copy UID"
                  className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === 'uid' ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                      <Check className="w-3 h-3" /> Copied!
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                {user?.email && (
                  <span className="flex items-center gap-1">
                    <span className="text-slate-500">Email:</span> {user.email}
                  </span>
                )}
                {user?.phone && (
                  <span className="flex items-center gap-1">
                    <span className="text-slate-500">Phone:</span> {user.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Status Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-[#090d16] border border-slate-800/80 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">
                  Account Status
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400 capitalize">
                    {user?.status}
                  </span>
                </div>
              </div>

              <div className="bg-[#090d16] border border-slate-800/80 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">
                  Device Binding
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[110px]">
                    {user?.bound_device_name || sessionInfo?.deviceName || 'Locked to current'}
                  </span>
                </div>
              </div>

              <div className="bg-[#090d16] border border-slate-800/80 p-3 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">
                  Marketing Access
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {user?.marketing_access === 'Approved' ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400">Approved</span>
                    </>
                  ) : user?.marketing_access === 'Pending Approval' ? (
                    <>
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-400">Pending</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-400">
                        {user?.marketing_access || 'Not Requested'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Access Gate / Section */}
        {!isApproved ? (
          <div className="bg-[#111622] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl font-bold text-white">Marketing Credentials Area</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Access to protected marketing endpoints, API credentials, and lead routing keys
                requires explicit approval by the system administrator.
              </p>
            </div>

            {user?.marketing_access === 'Pending Approval' ? (
              <div className="max-w-md mx-auto p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 animate-spin text-amber-400" />
                <span>Your access request has been submitted and is awaiting administrator approval.</span>
              </div>
            ) : user?.marketing_access === 'Rejected' ? (
              <div className="max-w-md mx-auto p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                Your previous request was not approved by the administrator. You may submit a new request below.
              </div>
            ) : user?.marketing_access === 'Revoked' ? (
              <div className="max-w-md mx-auto p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                Your marketing credentials access has been revoked. Contact administrator for reinstatement.
              </div>
            ) : null}

            {user?.marketing_access !== 'Pending Approval' && (
              <form onSubmit={handleRequestAccess} className="max-w-md mx-auto space-y-3">
                <textarea
                  rows={2}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Provide reason or project note (optional)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs resize-none"
                />
                <button
                  type="submit"
                  disabled={requesting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {requesting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Request Marketing Credentials Access</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* UNLOCKED MARKETING CREDENTIALS AREA WITH SEARCHBAR AND USER DATA */
          <div className="space-y-6">
            <div className="bg-[#111622] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-bold text-white">
                      Marketing Credentials & Lead Endpoints
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Unlocked
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Live authenticated marketing API keys, integration parameters, and ad credentials.
                  </p>
                </div>

                {/* SEARCH BAR (Requirement: "also add searchbar adn only data for user") */}
                <div className="w-full md:w-80 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search credentials, category, key..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#090d16] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        fetchMarketingData('');
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-500 hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Data Table / Cards */}
              {loadingCreds ? (
                <div className="py-12 flex justify-center">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : credentials.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-sm text-slate-400">
                    {searchQuery ? `No marketing credentials matching "${searchQuery}"` : 'No marketing credentials assigned currently.'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        fetchMarketingData('');
                      }}
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      Reset search
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {credentials.map((cred) => {
                    const isSecretShown = revealedSecrets[cred.id] || false;
                    return (
                      <div
                        key={cred.id}
                        className="bg-[#090d16] border border-slate-800/90 rounded-xl p-5 space-y-4 hover:border-slate-700/80 transition-all shadow-md group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                              {cred.category}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-2 leading-snug">
                              {cred.label}
                            </h4>
                          </div>
                        </div>

                        {cred.notes && (
                          <p className="text-xs text-slate-400 leading-relaxed border-l-2 border-indigo-500/40 pl-2.5">
                            {cred.notes}
                          </p>
                        )}

                        <div className="space-y-2.5 text-xs">
                          {/* Access Key */}
                          <div>
                            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                              <span>Access Key / Client ID:</span>
                              <button
                                onClick={() => copyToClipboard(cred.access_key, `ak-${cred.id}`)}
                                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                              >
                                {copiedField === `ak-${cred.id}` ? (
                                  <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                                    <Check className="w-3 h-3" /> Copied!
                                  </span>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" /> Copy
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="p-2 rounded-lg bg-[#111622] border border-slate-800/80 font-mono text-[11px] text-slate-200 select-all truncate">
                              {cred.access_key}
                            </div>
                          </div>

                          {/* Secret Key */}
                          <div>
                            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                              <span>Secret Token / Key:</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleSecret(cred.id)}
                                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                                >
                                  {isSecretShown ? (
                                    <>
                                      <EyeOff className="w-3 h-3" /> Hide
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3 h-3" /> Reveal
                                    </>
                                  )}
                                </button>
                                <span className="text-slate-700">|</span>
                                <button
                                  onClick={() => copyToClipboard(cred.secret_key, `sk-${cred.id}`)}
                                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                                >
                                  {copiedField === `sk-${cred.id}` ? (
                                    <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                                      <Check className="w-3 h-3" /> Copied!
                                    </span>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" /> Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="p-2 rounded-lg bg-[#111622] border border-slate-800/80 font-mono text-[11px] text-slate-200 select-all truncate">
                              {isSecretShown
                                ? cred.secret_key
                                : '••••••••••••••••••••••••••••••••••••••••••••'}
                            </div>
                          </div>

                          {/* Endpoint */}
                          {cred.endpoint && (
                            <div>
                              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                                <span>API / Webhook Endpoint:</span>
                                <button
                                  onClick={() => copyToClipboard(cred.endpoint, `ep-${cred.id}`)}
                                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                                >
                                  {copiedField === `ep-${cred.id}` ? (
                                    <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                                      <Check className="w-3 h-3" /> Copied!
                                    </span>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" /> Copy
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="p-2 rounded-lg bg-[#111622] border border-slate-800/80 font-mono text-[11px] text-slate-400 select-all truncate">
                                {cred.endpoint}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security & Device Info Panel */}
        <div className="bg-[#111622] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Active Session & Device Security Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800/60 space-y-1">
              <span className="text-slate-500 font-medium uppercase text-[10px]">
                Authorized Hardware
              </span>
              <p className="text-slate-200 font-medium">
                {user?.bound_device_name || sessionInfo?.deviceName || 'Locked to current device'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                ID: {user?.bound_device_id || sessionInfo?.deviceId}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800/60 space-y-1">
              <span className="text-slate-500 font-medium uppercase text-[10px]">
                Active Heartbeat
              </span>
              <p className="text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Live Connection Verified
              </p>
              <p className="text-[10px] text-slate-500">
                Synchronized every 20s
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800/60 space-y-1">
              <span className="text-slate-500 font-medium uppercase text-[10px]">
                Single-Device Policy
              </span>
              <p className="text-slate-200 font-medium">Enforced Server-Side</p>
              <p className="text-[10px] text-slate-500">
                1 UID = 1 Session at any moment
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
        TRUWIN COCO Access Management System • Production Secure Architecture
      </footer>
    </div>
  );
}
