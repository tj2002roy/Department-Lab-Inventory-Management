"use client";

import { useState, useEffect } from "react";
import { MessageSquare, AlertCircle, X } from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";

interface AddCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemId?: string;
  systemId?: string;
  targetName: string;
}

export function AddCommentModal({
  isOpen,
  onClose,
  onSuccess,
  itemId,
  systemId,
  targetName,
}: AddCommentModalProps) {
  const [users, setUsers] = useState<Array<{ id: string; name: string; role: string; designation?: string; email?: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/users")
      .then((r) => r.json())
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setUsers(res.data);
          setSelectedUserId(res.data[0].id);
        }
      })
      .catch((err) => console.error("Error loading users:", err));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: itemId || undefined,
          systemId: systemId || undefined,
          userId: selectedUserId,
          commentText: commentText.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to append comment to audit trail");
      }

      setCommentText("");
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
        <div className="relative w-full max-w-md my-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)]">
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 flex-shrink-0 p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/95 backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Add Immutable Audit Note</h3>
                <p className="text-[11px] text-cyan-400/90 truncate max-w-xs">{targetName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                Auditor / Operator Identity
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.designation || u.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                Comment / Observation Note
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Record condition notes, maintenance schedules, or compliance remarks..."
                rows={4}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none font-sans"
              />
            </div>

            {error && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                {isSubmitting ? "Logging..." : "Append Note"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
