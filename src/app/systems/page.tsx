"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Plus,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";

export default function SystemsPage() {
  const [systems, setSystems] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [standaloneItems, setStandaloneItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create System Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sysName, setSysName] = useState("");
  const [selectedLabId, setSelectedLabId] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Relocate System Modal
  const [relocateSystem, setRelocateSystem] = useState<any>(null);
  const [targetLabId, setTargetLabId] = useState("");
  const [relocateComment, setRelocateComment] = useState("");
  const [isRelocating, setIsRelocating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sysRes, labsRes, itemsRes] = await Promise.all([
        fetch("/api/systems").then((r) => r.json()),
        fetch("/api/labs").then((r) => r.json()),
        fetch("/api/items?standaloneOnly=true").then((r) => r.json()),
      ]);

      if (sysRes.data) setSystems(sysRes.data);
      if (labsRes.data) {
        setLabs(labsRes.data);
        if (labsRes.data.length > 0 && !selectedLabId) {
          setSelectedLabId(labsRes.data[0].id);
        }
      }
      if (itemsRes.data) setStandaloneItems(itemsRes.data);
    } catch (err) {
      console.error("Error loading systems data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      const userId = usersData.data?.[0]?.id;

      const res = await fetch("/api/systems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sysName,
          labId: selectedLabId,
          itemIds: selectedItemIds,
          userId,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create system");

      setIsCreateOpen(false);
      setSysName("");
      setSelectedItemIds([]);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelocateSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relocateSystem) return;
    setIsRelocating(true);
    try {
      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      const userId = usersData.data?.[0]?.id;

      const res = await fetch("/api/relocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SYSTEM",
          payload: {
            systemId: relocateSystem.id,
            toLabId: targetLabId,
            userId,
            comment: relocateComment.trim() || undefined,
          },
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to relocate system");

      setRelocateSystem(null);
      setRelocateComment("");
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRelocating(false);
    }
  };

  // Filter available items by selected lab when creating a system
  const availableItemsInSelectedLab = standaloneItems.filter(
    (i) => i.labId === selectedLabId
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800/60">
              LOGICAL GROUPINGS
            </span>
            <span className="text-xs text-slate-400">• Workstation & Station Bundles</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
            Laboratory Systems & Workstation Bundling
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Group instruments (e.g. CPU, Monitor, Keyboard, Chair) into cohesive Systems with auto-generated
            System IDs (e.g. SYS-DL-001). Moving a system relocates all bundled components in one atomic database transaction.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Create New System</span>
        </button>
      </div>

      {/* Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systems.map((sys) => (
          <div
            key={sys.id}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 hover:border-slate-700 transition-colors"
          >
            {/* System Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800/60">
                    {sys.unique_id}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                    {sys.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 mt-2">{sys.name}</h3>
                <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-1">
                  <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Current Lab:</span>
                  <strong className="text-slate-200">{sys.lab?.name}</strong>
                </p>
              </div>

              <button
                onClick={() => {
                  setRelocateSystem(sys);
                  const other = labs.find((l) => l.id !== sys.labId);
                  if (other) setTargetLabId(other.id);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                <span>Relocate System</span>
              </button>
            </div>

            {/* Bundled Items List */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                  Bundled Instruments ({sys.items?.length || 0})
                </span>
                <span className="text-[11px] font-mono">Synchronized Location</span>
              </div>

              <div className="space-y-2">
                {sys.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-200">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.category} • UUID: {item.qr_uuid?.slice(0, 8)}...
                      </p>
                    </div>

                    <Link
                      href={`/inventory/item/${item.qr_uuid}`}
                      className="p-1.5 rounded bg-slate-900 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      title="Inspect item detail"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create System Modal */}
      {isCreateOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/85 backdrop-blur-sm p-4 sm:p-6 flex min-h-screen items-center justify-center animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg my-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)]">
              <div className="sticky top-0 z-20 flex-shrink-0 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/95 backdrop-blur-md">
                <div>
                  <h2 className="text-base font-bold text-slate-100">Create &amp; Bundle System</h2>
                  <p className="text-xs text-cyan-400 font-mono">Auto-generates Unique System ID</p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSystem} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">System Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Workstation 2 or Optics Bench Beta"
                    value={sysName}
                    onChange={(e) => setSysName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Target Laboratory Location
                  </label>
                  <select
                    value={selectedLabId}
                    onChange={(e) => {
                      setSelectedLabId(e.target.value);
                      setSelectedItemIds([]);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-sans"
                  >
                    {labs.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Bundle Standalone Items in this Lab ({availableItemsInSelectedLab.length} available)
                  </label>
                  {availableItemsInSelectedLab.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-lg border border-slate-800">
                      No unbundled items currently in this lab. You can register items or assign them later.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-950 rounded-lg border border-slate-800">
                      {availableItemsInSelectedLab.map((item) => {
                        const isChecked = selectedItemIds.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className="flex items-center space-x-2.5 p-2 rounded bg-slate-900 hover:bg-slate-850 text-xs text-slate-200 cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItemIds((prev) => [...prev, item.id]);
                                } else {
                                  setSelectedItemIds((prev) => prev.filter((id) => id !== item.id));
                                }
                              }}
                              className="rounded border-slate-700 bg-slate-950 text-cyan-500"
                            />
                            <div className="flex-1 truncate">
                              <span className="font-semibold block truncate">{item.name}</span>
                              <span className="text-[10px] text-slate-500">{item.category}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 z-10 flex-shrink-0 pt-3 border-t border-slate-800 flex items-center justify-end space-x-2 bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !sysName.trim()}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all active:scale-95"
                  >
                    {isSubmitting ? "Generating ID & Bundling..." : "Create System Bundle"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Relocate System Modal */}
      {relocateSystem && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/85 backdrop-blur-sm p-4 sm:p-6 flex min-h-screen items-center justify-center animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg my-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)]">
              <div className="sticky top-0 z-20 flex-shrink-0 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/95 backdrop-blur-md">
                <div>
                  <h2 className="text-base font-bold text-slate-100">
                    Relocate System {relocateSystem.unique_id}
                  </h2>
                  <p className="text-xs text-cyan-400 font-mono">
                    Atomic Transaction: System + All Bundled Components
                  </p>
                </div>
                <button
                  onClick={() => setRelocateSystem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleRelocateSystem} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                  <p className="font-semibold text-slate-200">{relocateSystem.name}</p>
                  <p className="text-slate-400">
                    Currently in: <strong className="text-cyan-400">{relocateSystem.lab?.name}</strong>
                  </p>
                  <p className="text-[11px] text-amber-400 pt-1">
                    ⚠️ Moving this system will simultaneously move all {relocateSystem.items?.length || 0}{" "}
                    associated instruments to the new lab and generate audit logs.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Destination Laboratory
                  </label>
                  <select
                    value={targetLabId}
                    onChange={(e) => setTargetLabId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-sans"
                  >
                    {labs.map((l) => (
                      <option key={l.id} value={l.id} disabled={l.id === relocateSystem.labId}>
                        {l.name} {l.id === relocateSystem.labId ? "(Current Location)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Relocation Comment / Operational Justification
                  </label>
                  <textarea
                    value={relocateComment}
                    onChange={(e) => setRelocateComment(e.target.value)}
                    placeholder="e.g. Workstation relocated for optics lab expansion..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none font-sans"
                  />
                </div>

                <div className="sticky bottom-0 z-10 flex-shrink-0 pt-3 border-t border-slate-800 flex items-center justify-end space-x-2 bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setRelocateSystem(null)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRelocating || !targetLabId}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all active:scale-95"
                  >
                    {isRelocating ? "Executing Multi-Item Transaction..." : "Commit System Move"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
