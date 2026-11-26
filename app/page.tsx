'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, User, ArrowRight, Lock, Smartphone, Key, Sparkles, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          if (data.user?.role === 'admin') router.push('/admin');
          else router.push('/dashboard');
        }
      })
      .catch(() => {});
  }, [router]);

  return (
    <div className="min-h-screen bg-[#07090e] bg-ambient-grid text-[#f1f5f9] flex flex-col justify-between px-4 py-12 relative overflow-hidden">
      {/* Decorative ambient blurred orbs */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center items-center space-y-12 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/10 border border-indigo-500/30 text-indigo-400 glow-indigo shadow-2xl mb-2 animate-float">
            <Shield className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-indigo text-xs font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Next-Gen Access Management</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              TRUWIN <span className="gradient-text-indigo font-light">COCO</span>
            </h1>
          </div>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Enterprise Single-Device Authentication, Live Active Session Tracking, and Protected
            Marketing Credentials Infrastructure.
          </p>
        </div>

        {/* Portal Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* User Portal Card */}
          <Link
            href="/login"
            className="group glass-card rounded-2xl p-7 shadow-2xl flex flex-col justify-between space-y-6 cursor-pointer"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                  User Access Portal
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Log in with your administrator-assigned UID and Password. Verifies bound hardware
                  fingerprint and unlocks approved marketing assets.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
              <span>Sign In to Member Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Admin Console Card */}
          <Link
            href="/admin"
            className="group glass-card rounded-2xl p-7 shadow-2xl flex flex-col justify-between space-y-6 cursor-pointer"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Admin Control Center
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Manage user accounts, assign hardware devices, approve/revoke marketing access,
                  terminate sessions in real-time, and view security alerts.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>Enter Admin Console</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-400 pt-2">
          <span className="flex items-center gap-2 glass-panel px-3.5 py-1.5 rounded-full border border-slate-800/80">
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            1 UID = 1 Active Device
          </span>
          <span className="flex items-center gap-2 glass-panel px-3.5 py-1.5 rounded-full border border-slate-800/80">
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            Server-Enforced Permissions
          </span>
          <span className="flex items-center gap-2 glass-panel px-3.5 py-1.5 rounded-full border border-slate-800/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            Live Heartbeat Monitoring
          </span>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-600 pt-8 relative z-10">
        TRUWIN COCO Access Management System • Production Ready
      </footer>
    </div>
  );
}
