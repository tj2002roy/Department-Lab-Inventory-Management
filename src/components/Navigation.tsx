"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  QrCode,
  Boxes,
  LayoutGrid,
  LogIn,
  LogOut,
  Settings,
  Menu,
  X,
  ShieldCheck,
  User,
  KeyRound,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.data) {
        setCurrentUser(json.data);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    fetchSession();
    // Close mobile menu on route change
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setMobileMenuOpen(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white border border-slate-700/80 p-0.5 flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 group-hover:border-cyan-400 transition-all overflow-hidden flex-shrink-0">
              <img
                src="/uem-logo.png"
                alt="UEM Jaipur Computer Applications Department Logo"
                className="h-full w-full object-contain rounded-full"
              />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold tracking-wider text-slate-100 uppercase">
                UEM Jaipur <span className="text-cyan-400">IMS</span>
              </span>
              <span className="hidden md:block text-[10px] uppercase tracking-wider text-cyan-400/90 font-mono">
                Dept. of Computer Applications
              </span>
            </div>
          </Link>
        </div>

        {/* Primary Nav Links (Desktop & Tablet Landscape) */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          <Link
            href="/"
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              pathname === "/"
                ? "bg-slate-800 text-cyan-400 border border-slate-700"
                : "text-slate-300 hover:text-white hover:bg-slate-900"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Lab Hierarchy</span>
          </Link>

          <Link
            href="/systems"
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              pathname.startsWith("/systems")
                ? "bg-slate-800 text-cyan-400 border border-slate-700"
                : "text-slate-300 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Boxes className="h-4 w-4" />
            <span>Systems Bundling</span>
          </Link>

          <Link
            href="/scan"
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              pathname.startsWith("/scan")
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                : "text-slate-300 hover:text-cyan-400 hover:bg-slate-900"
            }`}
          >
            <QrCode className="h-4 w-4 text-cyan-400" />
            <span className="font-semibold">Scan QR</span>
          </Link>

          {/* Admin Panel Link (Strictly visible to Admin / HOD) */}
          {currentUser?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-bold transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                  : "text-amber-400 hover:text-amber-300 hover:bg-amber-950/40"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* User Session Controls (Desktop) & Mobile Toggle */}
        <div className="flex items-center space-x-2">
          {currentUser ? (
            <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentUser.role === "ADMIN"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-200 leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-cyan-400 font-mono leading-tight mt-0.5">
                  {currentUser.role === "ADMIN" ? "Head of Department" : `Teacher (${currentUser.assignedLabIds?.length || 0} Labs)`}
                </p>
              </div>
              <button
                onClick={() => setShowChangePasswordModal(true)}
                title="Change Password"
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors ml-1"
              >
                <KeyRound className="h-4 w-4" />
              </button>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shadow-md"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Portal Login</span>
            </Link>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in slide-in-from-top duration-200 shadow-2xl">
          {/* User Badge on Mobile */}
          {currentUser ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center space-x-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentUser.role === "ADMIN"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  }`}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100">{currentUser.name}</p>
                  <p className="text-[10px] text-cyan-400 font-mono">
                    {currentUser.role === "ADMIN" ? "Head of Department" : `Authorized Faculty (${currentUser.assignedLabIds?.length || 0} Labs)`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  title="Change Password"
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-700 text-xs flex items-center space-x-1"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Key</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-700 text-xs flex items-center space-x-1"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center space-x-2 w-full p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20"
            >
              <LogIn className="h-4 w-4" />
              <span>Portal Login</span>
            </Link>
          )}

          {/* Nav Links on Mobile */}
          <div className="space-y-1.5 pt-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                pathname === "/"
                  ? "bg-slate-800 text-cyan-400 border border-slate-700"
                  : "text-slate-300 hover:text-white hover:bg-slate-900"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Lab Hierarchy &amp; Asset Overview</span>
            </Link>

            <Link
              href="/systems"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                pathname.startsWith("/systems")
                  ? "bg-slate-800 text-cyan-400 border border-slate-700"
                  : "text-slate-300 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Boxes className="h-4 w-4" />
              <span>Systems Bundling (Rigs)</span>
            </Link>

            <Link
              href="/scan"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                pathname.startsWith("/scan")
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-300 hover:text-cyan-400 hover:bg-slate-900"
              }`}
            >
              <QrCode className="h-4 w-4 text-cyan-400" />
              <span>Scan QR Code (Camera / Upload)</span>
            </Link>

            {currentUser?.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    : "text-amber-400 hover:text-amber-300 hover:bg-amber-950/40"
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Admin Governance Panel</span>
              </Link>
            )}
          </div>
        </div>
      )}

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        defaultEmployeeId={currentUser?.employeeCode || currentUser?.username || ""}
      />
    </header>
  );
}
