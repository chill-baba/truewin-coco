'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, User, ArrowRight, Lock, Smartphone, Key } from 'lucide-react';

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
    <div className="min-h-screen bg-[#090b10] text-[#e2e8f0] flex flex-col justify-between px-4 py-12">
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center items-center space-y-10">
        {/* Brand */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/10 border border-indigo-500/30 text-indigo-400 shadow-2xl shadow-indigo-500/10">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            TRUWIN <span className="text-indigo-400 font-light">COCO</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
            Enterprise Single-Device Authentication, User Access Control, and Protected Marketing
            Credentials Management System.
          </p>
        </div>

        {/* Two Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* User Portal Card */}
          <Link
            href="/login"
            className="group bg-[#111622] border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-6 sm:p-8 shadow-xl transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">User Access Portal</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign in with your administrator-assigned UID and Password. Includes single-device
                lock verification and approved marketing credentials access.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
              <span>Enter Member Login</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Admin Console Card */}
          <Link
            href="/admin"
            className="group bg-[#111622] border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl p-6 sm:p-8 shadow-xl transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Admin Control Center</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Manage user accounts, monitor live active device sessions, approve or revoke
                marketing permissions, and review real-time security alerts.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>Access Admin Console</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500 pt-2">
          <span className="flex items-center gap-1.5 bg-[#111622] border border-slate-800/60 px-3 py-1.5 rounded-full">
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            1 UID = 1 Active Device
          </span>
          <span className="flex items-center gap-1.5 bg-[#111622] border border-slate-800/60 px-3 py-1.5 rounded-full">
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            Role-Enforced Credentials
          </span>
          <span className="flex items-center gap-1.5 bg-[#111622] border border-slate-800/60 px-3 py-1.5 rounded-full">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            HTTP-Only Cryptographic Sessions
          </span>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-600 pt-8">
        TRUWIN COCO Access Management System • Production Ready
      </footer>
    </div>
  );
}
