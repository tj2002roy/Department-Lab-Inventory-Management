"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, User, KeyRound, Sparkles, ArrowRight, AlertCircle, Microscope } from "lucide-react";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Authentication failed");
      }

      if (data.data.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="h-20 w-20 rounded-full bg-white border-2 border-cyan-500/40 p-1 flex items-center justify-center mx-auto shadow-2xl shadow-cyan-500/20 overflow-hidden">
            <img
              src="/uem-logo.png"
              alt="UEM Jaipur Computer Applications Department Logo"
              className="h-full w-full object-contain rounded-full"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100">
              Laboratory Portal Login
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              University of Engineering &amp; Management Jaipur • Dept. of Computer Applications
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Login ID / Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder="e.g. admin or prof.mandal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setShowChangePasswordModal(true)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center space-x-1"
            >
              <KeyRound className="h-3 w-3" />
              <span>Change / Forgot Password?</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 transition-all active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Laboratory"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Access Card for Head of Department */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-400">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Head of Department Master Access</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">1-Click Sign In</span>
          </div>

          <button
            type="button"
            onClick={() => quickFill("sayak", "sayak123")}
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 text-left transition-all flex items-center justify-between group shadow-lg"
          >
            <div>
              <span className="text-xs font-bold text-cyan-300 block group-hover:text-cyan-200">
                Professor Sayak Pramanik
              </span>
              <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                Username: <strong className="text-slate-200">sayak</strong> • Password: <strong className="text-slate-200">sayak123</strong>
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              HOD Authority
            </span>
          </button>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
}
