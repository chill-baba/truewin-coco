'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getClientDeviceInfo } from '@/lib/device';
import {
  Shield,
  Lock,
  User,
  Smartphone,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export default function UserLoginPage() {
  const router = useRouter();
  const [uid, setUid] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<{ deviceId: string; deviceName: string } | null>(null);

  useEffect(() => {
    // Detect device on mount
    const dev = getClientDeviceInfo();
    setDeviceInfo(dev);

    // If already logged in as user, check session
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          if (data.user?.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!uid.trim() || !password) {
      setError('Please enter your assigned UID and password.');
      return;
    }

    setLoading(true);
    const dev = deviceInfo || getClientDeviceInfo();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: uid.trim(),
          password,
          deviceId: dev.deviceId,
          deviceName: dev.deviceName,
          isAdmin: false,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.error === 'UNAUTHORIZED_DEVICE') {
          setError(
            data.message ||
              'Unauthorized device. Your account is bound to another device. Please contact your administrator to reassign.'
          );
        } else if (data.error === 'ACCOUNT_DEACTIVATED') {
          setError(data.message || 'Your account is deactivated. Please contact administrator.');
        } else {
          setError(data.message || 'Invalid UID or password. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Success
      router.push('/dashboard');
    } catch {
      setError('Connection error. Please check your network and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] bg-ambient-grid text-[#f1f5f9] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/10 border border-indigo-500/30 text-indigo-400 mb-2 glow-indigo shadow-2xl animate-float">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            TRUWIN <span className="gradient-text-indigo font-light">COCO</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Single-Device Secure User Access Portal
          </p>
        </div>

        {/* Login Box */}
        <div className="glass-panel-elevated rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800/80 pb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              Member Authentication
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Log in with your administrator-assigned UID and credentials.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl badge-rose text-xs flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Assigned UID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="e.g. coco_alpha"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500 text-xs transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500 text-xs transition-all"
                />
              </div>
            </div>

            {/* Detected Device Badge */}
            {deviceInfo && (
              <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px]">Hardware:</span>
                  <span className="text-slate-200 font-medium text-[11px] truncate max-w-[150px]">
                    {deviceInfo.deviceName}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full badge-emerald font-semibold">
                  1 Device Locked
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:opacity-95 text-white font-medium text-xs shadow-lg glow-indigo transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-slate-500">
            Account registration is managed strictly by system administrators.
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center text-xs text-slate-500 px-2">
          <Link href="/" className="hover:text-slate-300 transition-colors">
            ← System Gateway
          </Link>
          <Link
            href="/admin"
            className="hover:text-indigo-400 text-slate-400 transition-colors flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            Admin Control Center
          </Link>
        </div>
      </div>
    </div>
  );
}
