"use client";

import { useState } from "react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { KeyRound, X, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmployeeId?: string;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  defaultEmployeeId = "",
}: ChangePasswordModalProps) {
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update password");
      }

      setMessage(data.message);
      setNewPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Change Password</h3>
                <p className="text-[11px] text-slate-400">Institutional Security & Credential Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Alerts */}
          {message && (
            <div className="m-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Password Updated Successfully</p>
                <p className="text-[11px] text-emerald-300/90">{message}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="m-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form with strictly the 2 requested boxes */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Box 1: Enter Employee ID */}
            <div>
              <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                Enter Employee ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. EMP-1048 or username"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Unique identifier assigned to your institutional account
              </p>
            </div>

            {/* Box 2: Set New Password */}
            <div>
              <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                Set New Password <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {message ? "Close" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={loading || !employeeId || !newPassword}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-1.5 active:scale-95"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{loading ? "Updating..." : "Update Password"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
