"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Box,
  Layers,
  QrCode,
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  Activity,
  CheckCircle2,
  SlidersHorizontal,
  ExternalLink,
  ChevronRight,
  Lock,
  Monitor,
  Laptop,
  AlertTriangle,
  UserCheck,
  Edit3,
  Save,
  X,
  Sparkles,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { RelocateModal } from "@/components/inventory/RelocateModal";
import { ModalPortal } from "@/components/ui/ModalPortal";

const FIXED_LABS = ["Digital Lab", "Lab 1", "Lab 2", "Lab 3", "Lab 4"];

export default function LabDashboardPage() {
  const [labs, setLabs] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedLabName, setSelectedLabName] = useState<string>("All Labs");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // New Item Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Monitor");
  const [newItemLabId, setNewItemLabId] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Relocate Modal State
  const [relocateItem, setRelocateItem] = useState<any>(null);

  // Lab Counts Edit Inbox State
  const [isEditingCounts, setIsEditingCounts] = useState(false);
  const [editWorkingPcs, setEditWorkingPcs] = useState<number>(0);
  const [editInactivePcs, setEditInactivePcs] = useState<number>(0);
  const [isSavingCounts, setIsSavingCounts] = useState(false);
  const [countSaveMessage, setCountSaveMessage] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [labsRes, itemsRes, systemsRes, meRes] = await Promise.all([
        fetch("/api/labs").then((r) => r.json()),
        fetch("/api/items").then((r) => r.json()),
        fetch("/api/systems").then((r) => r.json()),
        fetch("/api/auth/me").then((r) => r.json()).catch(() => ({ data: null })),
      ]);

      if (meRes?.data) setCurrentUser(meRes.data);
      if (labsRes.data) {
        setLabs(labsRes.data);
        if (!newItemLabId && labsRes.data.length > 0) {
          setNewItemLabId(labsRes.data[0].id);
        }
      }
      if (itemsRes.data) setItems(itemsRes.data);
      if (systemsRes.data) setSystems(systemsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Filter items and systems by selected lab
  const activeLab = useMemo(() => {
    if (selectedLabName === "All Labs") return null;
    return labs.find((l) => l.name === selectedLabName);
  }, [labs, selectedLabName]);

  // Sync edit state when active lab changes
  useEffect(() => {
    if (activeLab) {
      setEditWorkingPcs(activeLab.workingPcs ?? 0);
      setEditInactivePcs(activeLab.inactivePcs ?? 0);
      setIsEditingCounts(false);
      setCountSaveMessage(null);
    }
  }, [activeLab]);

  // Aggregate PC stats across all laboratories
  const aggregateStats = useMemo(() => {
    let totalWorking = 0;
    let totalInactive = 0;
    labs.forEach((l) => {
      totalWorking += l.workingPcs || 0;
      totalInactive += l.inactivePcs || 0;
    });
    const total = totalWorking + totalInactive;
    const health = total > 0 ? ((totalWorking / total) * 100).toFixed(1) : "0";
    return { totalWorking, totalInactive, total, health };
  }, [labs]);

  // Save updated PC counts to database
  const handleSaveCounts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLab) return;
    setIsSavingCounts(true);
    setCountSaveMessage(null);
    try {
      const res = await fetch("/api/labs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labId: activeLab.id,
          workingPcs: editWorkingPcs,
          inactivePcs: editInactivePcs,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Update local labs state immediately
        setLabs((prev) =>
          prev.map((l) => (l.id === activeLab.id ? { ...l, ...data.data } : l))
        );
        setCountSaveMessage(`Successfully updated PC counts for ${activeLab.name}!`);
        setIsEditingCounts(false);
        setTimeout(() => setCountSaveMessage(null), 4000);
      } else {
        alert(data.error || "Failed to update counts");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update counts");
    } finally {
      setIsSavingCounts(false);
    }
  };

  const filteredSystems = useMemo(() => {
    let result = systems;
    if (activeLab) {
      result = result.filter((s) => s.labId === activeLab.id);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.unique_id.toLowerCase().includes(q) ||
          s.lab?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [systems, activeLab, searchQuery]);

  const filteredStandaloneItems = useMemo(() => {
    let result = items.filter((i) => !i.systemId); // Standalone items only
    if (activeLab) {
      result = result.filter((i) => i.labId === activeLab.id);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.qr_uuid.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, activeLab, searchQuery]);

  // Authorization check for current laboratory view
  const isAuthorizedForCurrentLab = useMemo(() => {
    if (!currentUser) return true;
    if (currentUser.role === "ADMIN") return true;
    if (!activeLab) return true; // Viewing aggregate labs
    return !!currentUser.assignedLabIds?.includes(activeLab.id);
  }, [currentUser, activeLab]);

  // Handle register item
  const handleRegisterItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      const userId = usersData.data?.[0]?.id;

      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItemName,
          category: newItemCategory,
          labId: newItemLabId,
          userId,
          attributes: {
            registeredVia: "Dashboard Quick-Register",
            condition: "Operational",
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsRegisterOpen(false);
        setNewItemName("");
        loadDashboardData();
      } else {
        alert(data.error || "Failed to register item");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Environment Overview */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start sm:items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-white border-2 border-cyan-500/40 p-1 flex items-center justify-center shadow-xl shadow-cyan-500/20 flex-shrink-0 overflow-hidden">
            <img
              src="/uem-logo.png"
              alt="UEM Jaipur Computer Applications Department Seal"
              className="h-full w-full object-contain rounded-full"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                UEM JAIPUR
              </span>
              <span className="text-xs text-slate-400">• 5 Institutional Laboratories</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Laboratory Inventory & Asset Hierarchy
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Real-time tracking of instruments, system groupings, and immutable audit logs across
              Digital Lab, Lab 1, Lab 2, Lab 3, and Lab 4.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              if (activeLab && !isAuthorizedForCurrentLab) {
                alert(`Authorization Required: You are not authorized to register instruments in ${activeLab.name}. Authorization is managed by the Head of Department.`);
                return;
              }
              setIsRegisterOpen(true);
            }}
            disabled={activeLab && !isAuthorizedForCurrentLab}
            className={`inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeLab && !isAuthorizedForCurrentLab
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/25 active:scale-95"
            }`}
          >
            {activeLab && !isAuthorizedForCurrentLab ? (
              <>
                <Lock className="h-4 w-4 text-slate-500" />
                <span>Locked (HOD Auth Required)</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Register Instrument</span>
              </>
            )}
          </button>

          <Link
            href="/scan"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <QrCode className="h-4 w-4 text-cyan-400" />
            <span>Optical Scanner</span>
          </Link>
        </div>
      </div>

      {/* Lab Filter Segmented Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <Building2 className="h-4 w-4 text-cyan-400" />
            <span>Select Laboratory Location</span>
          </div>
          <span className="text-xs text-slate-500">
            Showing {activeLab ? activeLab.name : "All 5 Laboratories"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl">
          <button
            onClick={() => setSelectedLabName("All Labs")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedLabName === "All Labs"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            All Laboratories ({items.length} Assets)
          </button>

          {FIXED_LABS.map((labName) => {
            const labObj = labs.find((l) => l.name === labName);
            const count = items.filter((i) => i.lab?.name === labName).length;
            const isSelected = selectedLabName === labName;

            return (
              <button
                key={labName}
                onClick={() => setSelectedLabName(labName)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>{labName}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {labObj ? `${labObj.workingPcs ?? 0} PCs` : `${count} Assets`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Laboratory In-Charge & Hardware Fleet Overview Card */}
      {activeLab ? (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden transition-all duration-300">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Toast / Notification Banner */}
          {countSaveMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold">{countSaveMessage}</span>
              </div>
              <button onClick={() => setCountSaveMessage(null)} className="text-emerald-400/80 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Top Section: Lab Header & In-Charge Details */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/30 text-cyan-400 shadow-inner">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-black text-slate-100 tracking-tight">
                    {activeLab.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    ZONE {activeLab.name.toUpperCase().replace(/\s+/g, "_")}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  {activeLab.description || "Institutional Laboratory & Workstation Facility"}
                </p>
              </div>
            </div>

            {/* In-Charge Faculty Profile Badge */}
            <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 p-3 rounded-xl shadow-inner">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md flex-shrink-0">
                {activeLab.assignments && activeLab.assignments.length > 0
                  ? activeLab.assignments[0].user?.name?.slice(0, 2).toUpperCase()
                  : "HOD"}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Lab In-Charge:
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-100">
                  {activeLab.assignments && activeLab.assignments.length > 0
                    ? activeLab.assignments.map((a: any) => a.user?.name).filter(Boolean).join(", ")
                    : "Professor Sayak Pramanik (HOD)"}
                </p>
                <p className="text-[11px] text-cyan-400/90 font-mono">
                  {activeLab.assignments && activeLab.assignments.length > 0
                    ? activeLab.assignments.map((a: any) => a.user?.email).filter(Boolean).join(", ")
                    : "hod@lab.institution.edu"}
                </p>
              </div>
            </div>
          </div>

          {/* Middle Section: PC Status Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Working PCs */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>Working PCs</span>
                </span>
                <Monitor className="h-4 w-4 text-emerald-400 opacity-80" />
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-black font-mono text-emerald-300">
                  {activeLab.workingPcs ?? 0}
                </span>
                <span className="text-xs text-emerald-400/70 font-medium">operational</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Active workstations ready for faculty and student operations
              </p>
            </div>

            {/* Inactive PCs */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-950/25 via-slate-900 to-slate-900 border border-rose-500/30 shadow-lg relative overflow-hidden group hover:border-rose-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400 flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400 inline-block" />
                  <span>Inactive PCs</span>
                </span>
                <AlertTriangle className="h-4 w-4 text-rose-400 opacity-80" />
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-black font-mono text-rose-300">
                  {activeLab.inactivePcs ?? 0}
                </span>
                <span className="text-xs text-rose-400/70 font-medium">offline / maintenance</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Hardware pending servicing, component relocation, or upgrades
              </p>
            </div>

            {/* Total Workstations & Fleet Health */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/25 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-400 flex items-center space-x-1.5">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  <span>Total Workstations</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  {((activeLab.workingPcs ?? 0) + (activeLab.inactivePcs ?? 0)) > 0
                    ? `${(((activeLab.workingPcs ?? 0) / ((activeLab.workingPcs ?? 0) + (activeLab.inactivePcs ?? 0))) * 100).toFixed(1)}% Health`
                    : "0% Health"}
                </span>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-black font-mono text-slate-100">
                  {(activeLab.workingPcs ?? 0) + (activeLab.inactivePcs ?? 0)}
                </span>
                <span className="text-xs text-slate-400 font-medium">total PCs</span>
              </div>
              {/* Health Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      ((activeLab.workingPcs ?? 0) + (activeLab.inactivePcs ?? 0)) > 0
                        ? (((activeLab.workingPcs ?? 0) / ((activeLab.workingPcs ?? 0) + (activeLab.inactivePcs ?? 0))) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Editable Counts Inbox Panel */}
          <div className="pt-2">
            {!isEditingCounts ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Laptop className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      Need to update or adjust PC counts for {activeLab.name}?
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Edit working vs inactive counts directly in this inbox to reflect immediate changes across the front overview.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditWorkingPcs(activeLab.workingPcs ?? 0);
                    setEditInactivePcs(activeLab.inactivePcs ?? 0);
                    setIsEditingCounts(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all active:scale-95"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Update Counts</span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSaveCounts}
                className="p-5 rounded-xl bg-slate-950 border border-cyan-500/40 shadow-2xl space-y-4 animate-in fade-in duration-200"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Edit3 className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                      Workstation Counts Inbox — {activeLab.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingCounts(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Working PCs Input Box */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                      <Monitor className="h-3.5 w-3.5" />
                      <span>Working PCs Inbox</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editWorkingPcs}
                      onChange={(e) => setEditWorkingPcs(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-emerald-500/40 rounded-xl text-emerald-300 font-mono text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                      placeholder="e.g. 35"
                      required
                    />
                    <p className="text-[10px] text-slate-500">Number of functional, operational PCs.</p>
                  </div>

                  {/* Inactive PCs Input Box */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-rose-400 flex items-center space-x-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Inactive PCs Inbox</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editInactivePcs}
                      onChange={(e) => setEditInactivePcs(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-rose-500/40 rounded-xl text-rose-300 font-mono text-sm focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                      placeholder="e.g. 3"
                      required
                    />
                    <p className="text-[10px] text-slate-500">Computers in maintenance or offline.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Calculated Total: <span className="font-bold text-slate-200 font-mono">{editWorkingPcs + editInactivePcs} PCs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingCounts(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCounts}
                      className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 transition-all disabled:opacity-50 active:scale-95"
                    >
                      {isSavingCounts ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          <span>Save Counts</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* Aggregate Overview when "All Laboratories" is selected */
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">
                  Institutional Laboratories Summary
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  5 ACTIVE ZONES
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Department-wide workstation deployment across all 5 institutional labs. Click any lab button above for individual in-charge details and counts editing.
              </p>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                <span className="font-bold text-base">{aggregateStats.totalWorking}</span> Working PCs
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-400">
                <span className="font-bold text-base">{aggregateStats.totalInactive}</span> Inactive PCs
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
                <span className="font-bold text-base">{aggregateStats.total}</span> Total PCs
              </div>
            </div>
          </div>

          {/* Quick Lab Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {FIXED_LABS.map((labName) => {
              const labObj = labs.find((l) => l.name === labName);
              const inChargeName = labObj?.assignments?.[0]?.user?.name || "Prof. Sayak Pramanik (HOD)";
              const working = labObj?.workingPcs ?? 0;
              const inactive = labObj?.inactivePcs ?? 0;
              const total = working + inactive;

              return (
                <button
                  key={labName}
                  onClick={() => setSelectedLabName(labName)}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900 text-left transition-all group space-y-2.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                      {labName}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">In-Charge:</span>
                    <p className="text-xs font-medium text-slate-300 truncate">
                      {inChargeName}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] font-mono">
                    <span className="text-emerald-400 font-semibold">{working} W</span>
                    <span className="text-rose-400 font-semibold">{inactive} I</span>
                    <span className="text-slate-400">{total} PCs</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* View-Only Alert for Unauthorized Faculty */}
      {activeLab && !isAuthorizedForCurrentLab && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <Lock className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-100">
                View-Only Access Active ({activeLab.name})
              </p>
              <p className="text-amber-300/80 text-[11px] mt-0.5">
                You have read-only visibility for all labs. Because you are not the assigned in-charge faculty for {activeLab.name},
                instrument alterations, registrations, and relocations are disabled. Authorization is managed exclusively by the Head of Department (Admin).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Secondary Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, category, or UUID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>{filteredSystems.length} Systems Active</span>
          <span>•</span>
          <span>{filteredStandaloneItems.length} Standalone Components</span>
        </div>
      </div>

      {/* Section 1: Bundled Systems */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Box className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-200">
                Bundled Systems ({filteredSystems.length})
              </h2>
              <p className="text-xs text-slate-400">
                Logical component groupings. Relocating a system moves all associated instruments.
              </p>
            </div>
          </div>
          <Link
            href="/systems"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>Manage Bundles</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {filteredSystems.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
            No bundled systems registered in {selectedLabName}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSystems.map((sys) => {
              const bundled = items.filter((i) => i.systemId === sys.id);
              return (
                <div
                  key={sys.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                          {sys.unique_id}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                          {sys.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-100 mt-1">{sys.name}</h3>
                      <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Building2 className="h-3 w-3 text-slate-500" />
                        <span>Location:</span>
                        <strong className="text-slate-300">{sys.lab?.name || "Unassigned"}</strong>
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-950 text-slate-300 border border-slate-800">
                      {bundled.length} Components
                    </span>
                  </div>

                  {/* Bundled Components Preview */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Bundled Components
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {bundled.map((item) => (
                        <Link
                          key={item.id}
                          href={`/inventory/item/${item.qr_uuid}`}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/50 text-xs text-slate-300 transition-colors group"
                        >
                          <div className="truncate mr-2">
                            <span className="font-medium text-slate-200 block truncate group-hover:text-cyan-300">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-500">{item.category}</span>
                          </div>
                          <ExternalLink className="h-3 w-3 text-slate-600 group-hover:text-cyan-400 flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Independent / Standalone Instruments */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-200">
                Independent Instruments ({filteredStandaloneItems.length})
              </h2>
              <p className="text-xs text-slate-400">
                Standalone instruments not bound to any system. Each instrument has a static UUID QR code.
              </p>
            </div>
          </div>
        </div>

        {filteredStandaloneItems.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
            No independent instruments found matching criteria.
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Instrument Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Current Lab</th>
                    <th className="py-3 px-4">Static QR / UUID</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredStandaloneItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/inventory/item/${item.qr_uuid}`}
                          className="font-bold text-slate-100 hover:text-cyan-400 transition-colors block"
                        >
                          {item.name}
                        </Link>
                        {item.attributes?.serialNumber && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            SN: {item.attributes.serialNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-cyan-300 font-semibold">{item.lab?.name}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-400">
                          <QrCode className="h-3.5 w-3.5 text-cyan-400" />
                          <span className="truncate max-w-[140px]">{item.qr_uuid}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {(() => {
                            const isItemAuthorized =
                              !currentUser ||
                              currentUser.role === "ADMIN" ||
                              currentUser.assignedLabIds?.includes(item.labId);

                            return (
                              <button
                                onClick={() => {
                                  if (!isItemAuthorized) {
                                    alert(
                                      `Authorization Denied: You are not authorized to relocate instruments from ${item.lab?.name}. Authorization is managed exclusively by the Head of Department.`
                                    );
                                    return;
                                  }
                                  setRelocateItem(item);
                                }}
                                disabled={!isItemAuthorized}
                                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                  !isItemAuthorized
                                    ? "bg-slate-900 text-slate-600 border border-slate-800/80 cursor-not-allowed"
                                    : "bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700"
                                }`}
                                title={
                                  !isItemAuthorized
                                    ? "Requires Lab In-Charge authorization from HOD"
                                    : "Relocate instrument"
                                }
                              >
                                {!isItemAuthorized ? (
                                  <Lock className="h-3 w-3 text-slate-600" />
                                ) : (
                                  <ArrowRightLeft className="h-3 w-3" />
                                )}
                                <span>Relocate</span>
                              </button>
                            );
                          })()}

                          <Link
                            href={`/inventory/item/${item.qr_uuid}`}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-colors"
                          >
                            <span>Inspect</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Register Instrument Modal */}
      {isRegisterOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/85 backdrop-blur-sm p-4 sm:p-6 flex min-h-screen items-center justify-center animate-in fade-in duration-150">
            <div className="relative w-full max-w-md my-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)]">
              {/* Sticky Modal Header */}
              <div className="sticky top-0 z-20 flex-shrink-0 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/95 backdrop-blur-md">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100">Register New Instrument</h2>
                    <p className="text-[11px] text-cyan-400/90 font-mono">Dynamic Static UUID QR Generation</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRegisterOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleRegisterItem} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Instrument Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ergonomic Lab Task Chair #L2-01"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-sans"
                  >
                    <option value="Monitor">Monitor</option>
                    <option value="Keyboard">Keyboard</option>
                    <option value="CPU">CPU</option>
                    <option value="Chair">Chair</option>
                    <option value="Spectrophotometer">Spectrophotometer</option>
                    <option value="Balance">Balance</option>
                    <option value="Analyzer">Analyzer</option>
                    <option value="Sensor">Sensor</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Assigned Lab Location
                  </label>
                  <select
                    value={newItemLabId}
                    onChange={(e) => setNewItemLabId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-sans"
                  >
                    {labs.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-lg text-[11px] text-cyan-300">
                  A permanent, static QR UUID will be generated immediately upon creation.
                </div>

                {/* Sticky Modal Footer */}
                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRegistering || !newItemName.trim()}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all active:scale-95"
                  >
                    {isRegistering ? "Generating QR & Registering..." : "Register & Generate QR"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Relocate Modal */}
      {relocateItem && (
        <RelocateModal
          isOpen={!!relocateItem}
          onClose={() => setRelocateItem(null)}
          onSuccess={() => {
            setRelocateItem(null);
            loadDashboardData();
          }}
          item={relocateItem}
        />
      )}
    </div>
  );
}
