"use client";

import { useState, useEffect } from "react";
import { ArrowRightLeft, AlertTriangle, X, ShieldAlert } from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";

interface RelocateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: {
    id: string;
    name: string;
    labId: string;
    lab: { name: string };
    systemId?: string | null;
    system?: { unique_id: string; name: string } | null;
  };
}

export function RelocateModal({ isOpen, onClose, onSuccess, item }: RelocateModalProps) {
  const [labs, setLabs] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; role: string; designation?: string; email?: string }>>([]);
  const [selectedLabId, setSelectedLabId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [comment, setComment] = useState("");
  const [detachFromSystem, setDetachFromSystem] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch labs and users
    Promise.all([
      fetch("/api/labs").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ])
      .then(([labsRes, usersRes]) => {
        if (labsRes.data) {
          setLabs(labsRes.data);
          // Default to first lab that isn't current lab
          const otherLab = labsRes.data.find((l: any) => l.id !== item.labId);
          if (otherLab) setSelectedLabId(otherLab.id);
        }
        if (usersRes.data) {
          setUsers(usersRes.data);
          if (usersRes.data.length > 0) setSelectedUserId(usersRes.data[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to load labs or users:", err);
      });
  }, [isOpen, item.labId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/relocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ITEM",
          payload: {
            itemId: item.id,
            toLabId: selectedLabId,
            userId: selectedUserId,
            comment: comment.trim() || undefined,
            detachFromSystem,
          },
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to relocate instrument");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/85 backdrop-blur-sm p-4 sm:p-6 flex min-h-screen items-center justify-center animate-in fade-in duration-150">
        <div className="relative w-full max-w-lg my-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)]">
          {/* Sticky Modal Header */}
          <div className="sticky top-0 z-20 flex-shrink-0 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/95 backdrop-blur-md">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Relocate Laboratory Asset</h2>
                <p className="text-xs text-cyan-400/90 font-mono">Atomic Database Transaction</p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Modal Body Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Target Item Summary */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-200">{item.name}</p>
                <p className="text-slate-500 text-[11px]">
                  Current Location: <span className="text-cyan-400 font-semibold">{item.lab.name}</span>
                </p>
              </div>
              {item.system && (
                <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800 text-blue-300 font-mono text-[10px]">
                  Part of {item.system.unique_id}
                </span>
              )}
            </div>

            {/* System Warning if Assigned */}
            {item.system && (
              <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs space-y-2">
                <div className="flex items-center space-x-2 text-amber-300 font-medium">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                  <span>Component Bundled In System</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  This instrument is part of <strong>{item.system.name}</strong> ({item.system.unique_id}).
                  To move this item alone to a different lab, check the box below to detach it from the system.
                </p>
                <label className="flex items-center space-x-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={detachFromSystem}
                    onChange={(e) => setDetachFromSystem(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span className="text-xs font-semibold text-amber-200">
                    Detach instrument from {item.system.unique_id}
                  </span>
                </label>
              </div>
            )}

            {/* Destination Lab Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Destination Laboratory (Mandatory)
              </label>
              <select
                value={selectedLabId}
                onChange={(e) => setSelectedLabId(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
              >
                {labs.map((lab) => (
                  <option key={lab.id} value={lab.id} disabled={lab.id === item.labId}>
                    {lab.name} {lab.id === item.labId ? "(Current Location)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Authorizing Operator / User Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Authorizing Operator (Audit Attribution)
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.designation || user.role}) — {user.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Relocation Reason / Free-text comment */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Relocation Purpose / Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Scheduled for advanced computational modeling in Digital Lab..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none font-sans"
              />
            </div>

            {/* Error notice */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Sticky/Fixed Footer Action buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedLabId || (!!item.system && !detachFromSystem)}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all active:scale-95 flex items-center space-x-1.5"
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>{isSubmitting ? "Executing Transaction..." : "Commit Relocation"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
