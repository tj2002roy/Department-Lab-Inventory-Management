"use client";

import { useState, useEffect } from "react";
import { Edit2, Check, X, ArrowRightLeft, MessageSquare, MapPin, Box, Layers, Plus, Trash2, Cpu, Lock } from "lucide-react";
import { RelocateModal } from "./RelocateModal";
import { AddCommentModal } from "./AddCommentModal";

interface ItemDetailCardProps {
  item: any;
  onRefresh: () => void;
}

export function ItemDetailCard({ item, onRefresh }: ItemDetailCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRelocateOpen, setIsRelocateOpen] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setCurrentUser(res.data);
      })
      .catch(() => {});
  }, []);

  // Editable form state
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [attributes, setAttributes] = useState<Record<string, any>>(item.attributes || {});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [updateReason, setUpdateReason] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Pick active operator user
      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      const userId = usersData.data?.[0]?.id;

      if (!userId) throw new Error("No operator user available for audit logging");

      const res = await fetch(`/api/items/${item.qr_uuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          attributes,
          userId,
          comment: updateReason.trim() || `Instrument specifications updated`,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update item specifications");
      }

      setIsEditing(false);
      setUpdateReason("");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addAttribute = () => {
    if (!newKey.trim()) return;
    setAttributes((prev) => ({ ...prev, [newKey.trim()]: newValue.trim() }));
    setNewKey("");
    setNewValue("");
  };

  const removeAttribute = (key: string) => {
    setAttributes((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const isAuthorized =
    !currentUser ||
    currentUser.role === "ADMIN" ||
    currentUser.assignedLabIds?.includes(item.labId);

  const hasBeenMoved =
    item.activityLogs?.some((l: any) => l.action_type === "MOVE") ||
    item.timeline?.some((l: any) => l.actionType === "MOVE") ||
    false;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl relative backdrop-blur-sm">
      {/* Header with Title & Quick Action Buttons */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-100">{item.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/80">
              {item.category}
            </span>
          </div>

          {/* Location & System Affiliation Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              <span>Current Lab:</span>
              <strong className="text-cyan-300">{item.lab.name}</strong>
            </div>

            {item.system ? (
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-blue-950/80 border border-blue-800 text-blue-300 font-mono">
                <Box className="h-3.5 w-3.5 text-blue-400" />
                <span>Bundled in System:</span>
                <strong className="text-white">{item.system.unique_id} ({item.system.name})</strong>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-400">
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                <span>Standalone Instrument</span>
              </div>
            )}

            {!isAuthorized && (
              <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-800/80 text-amber-300 font-medium">
                <Lock className="h-3 w-3 text-amber-400" />
                <span>View-Only Mode (Auth Managed by HOD)</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 no-print">
          {!isEditing ? (
            <>
              {/* Relocate Action: Disabled if not authorized */}
              <button
                onClick={() => {
                  if (!isAuthorized) {
                    alert(
                      `Authorization Required: You cannot relocate instruments in ${item.lab?.name}. Modification rights are granted exclusively by the Head of Department (Admin).`
                    );
                    return;
                  }
                  setIsRelocateOpen(true);
                }}
                disabled={!isAuthorized}
                className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  !isAuthorized
                    ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                    : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 active:scale-95"
                }`}
                title={
                  !isAuthorized
                    ? "Requires Lab In-Charge authorization from HOD"
                    : "Relocate instrument"
                }
              >
                {!isAuthorized ? (
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                ) : (
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                )}
                <span>Relocate</span>
              </button>

              {/* Add Note: Permitted for authorized faculty, OR if item has been moved */}
              <button
                onClick={() => {
                  if (!isAuthorized && !hasBeenMoved) {
                    alert(
                      "Comment Policy: As a non-authorized user, you can only add comments if this instrument has been moved/relocated."
                    );
                    return;
                  }
                  setIsCommentOpen(true);
                }}
                disabled={!isAuthorized && !hasBeenMoved}
                className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  !isAuthorized && !hasBeenMoved
                    ? "bg-slate-800/60 text-slate-500 border border-slate-700/60 cursor-not-allowed"
                    : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30"
                }`}
                title={
                  !isAuthorized && !hasBeenMoved
                    ? "Comments allowed only on moved items for non-authorized users"
                    : "Append audit note"
                }
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Add Note</span>
              </button>

              {/* Edit Specs: Only visible/enabled for authorized faculty or Admin */}
              {isAuthorized ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Specs</span>
                </button>
              ) : null}
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setName(item.name);
                  setCategory(item.category);
                  setAttributes(item.attributes || {});
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isSaving ? "Saving..." : "Save Specs"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Item Body / Specs View or Edit Mode */}
      <div className="mt-6 space-y-6">
        {isEditing ? (
          /* Edit Form */
          <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Instrument Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Dynamic Attributes Editor */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Custom Specifications & JSONB Attributes
              </label>
              <div className="space-y-2">
                {Object.entries(attributes).map(([key, val]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <span className="w-1/3 px-2.5 py-1.5 bg-slate-900 rounded text-xs font-mono text-cyan-300 truncate">
                      {key}
                    </span>
                    <input
                      type="text"
                      value={typeof val === "object" ? JSON.stringify(val) : String(val)}
                      onChange={(e) =>
                        setAttributes((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttribute(key)}
                      className="p-1.5 text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Attribute Row */}
              <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-slate-800/80">
                <input
                  type="text"
                  placeholder="New key (e.g. serialNumber, calibration)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-1/3 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200"
                />
                <button
                  type="button"
                  onClick={addAttribute}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Audit reason note */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Reason for Update (Appended to Audit Trail)
              </label>
              <input
                type="text"
                placeholder="e.g. Updated calibration certificate expiry date"
                value={updateReason}
                onChange={(e) => setUpdateReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                <span>Technical Specifications & Lab Metadata</span>
              </h3>

              {item.attributes && Object.keys(item.attributes).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(item.attributes).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                    >
                      <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                        {key.replace(/([A-Z])/g, " $1")}
                      </p>
                      <p className="text-sm font-semibold text-slate-200 mt-0.5 truncate">
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800 text-xs text-slate-500">
                  No custom attributes registered. Click "Edit Specs" to add technical parameters.
                </div>
              )}
            </div>

            {/* System Bundled Components List (if item belongs to system) */}
            {item.system?.items && item.system.items.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                  <Box className="h-3.5 w-3.5 text-blue-400" />
                  <span>Peer Instruments in {item.system.unique_id} ({item.system.name})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.system.items.map((peer: any) => (
                    <a
                      key={peer.id}
                      href={`/inventory/item/${peer.qr_uuid}`}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                        peer.id === item.id
                          ? "bg-cyan-950/30 border-cyan-500/40 text-cyan-300"
                          : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{peer.name}</p>
                        <p className="text-[10px] text-slate-500">{peer.category}</p>
                      </div>
                      {peer.id === item.id ? (
                        <span className="text-[10px] uppercase font-bold text-cyan-400">Current</span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">View →</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Relocate Modal */}
      <RelocateModal
        isOpen={isRelocateOpen}
        onClose={() => setIsRelocateOpen(false)}
        onSuccess={onRefresh}
        item={item}
      />

      {/* Add Comment Modal */}
      <AddCommentModal
        isOpen={isCommentOpen}
        onClose={() => setIsCommentOpen(false)}
        onSuccess={onRefresh}
        itemId={item.id}
        targetName={item.name}
      />
    </div>
  );
}
