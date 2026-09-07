"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Building2,
  Users,
  KeyRound,
  CheckCircle2,
  UserPlus,
  UserMinus,
  AlertCircle,
  Save,
  Lock,
  Plus,
  X,
  Sparkles,
  Pencil,
  Trash2,
  Search,
  History,
  Clock,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";

export default function AdminPanelPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [labs, setLabs] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null);
  const [editingLab, setEditingLab] = useState<any | null>(null);
  const [deletingFaculty, setDeletingFaculty] = useState<any | null>(null);
  const [deletingLab, setDeletingLab] = useState<any | null>(null);

  // Copied state
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Add Faculty form state (strictly 8 fields)
  const [facultyForm, setFacultyForm] = useState({
    prefix: "Prof.",
    firstName: "",
    middleName: "",
    lastName: "",
    officialEmailId: "",
    employeeCode: "",
    contactNumber: "",
    position: "Faculty" as "Faculty" | "Staff",
  });
  const [isSubmittingFaculty, setIsSubmittingFaculty] = useState(false);
  const [facultyMessage, setFacultyMessage] = useState<string | null>(null);
  const [facultyError, setFacultyError] = useState<string | null>(null);
  const [newlyCreatedCreds, setNewlyCreatedCreds] = useState<{ username: string; defaultPassword: string } | null>(null);

  // Edit Faculty form state
  const [editFacultyForm, setEditFacultyForm] = useState({
    id: "",
    prefix: "Prof.",
    firstName: "",
    middleName: "",
    lastName: "",
    officialEmailId: "",
    employeeCode: "",
    contactNumber: "",
    position: "Faculty" as "Faculty" | "Staff",
  });
  const [isUpdatingFaculty, setIsUpdatingFaculty] = useState(false);
  const [editFacultyError, setEditFacultyError] = useState<string | null>(null);

  // Add Lab form state
  const [labForm, setLabForm] = useState({
    name: "",
    description: "",
    workingPcs: 0,
    inactivePcs: 0,
  });
  const [isSubmittingLab, setIsSubmittingLab] = useState(false);
  const [labMessage, setLabMessage] = useState<string | null>(null);
  const [labError, setLabError] = useState<string | null>(null);

  // Edit Lab form state
  const [editLabForm, setEditLabForm] = useState({
    id: "",
    name: "",
    description: "",
    workingPcs: 0,
    inactivePcs: 0,
  });
  const [isUpdatingLab, setIsUpdatingLab] = useState(false);
  const [editLabError, setEditLabError] = useState<string | null>(null);

  // Audit Logs state & Search
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logActionFilter, setLogActionFilter] = useState("ALL");
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Security Credentials form state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [credMessage, setCredMessage] = useState<string | null>(null);
  const [credError, setCredError] = useState<string | null>(null);
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false);

  // Lab assignment state
  const [selectedLabId, setSelectedLabId] = useState<Record<string, string>>({});
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [meRes, labsRes, teachersRes] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch("/api/labs").then((r) => r.json()),
        fetch("/api/auth/admin/assignments").then((r) => r.json()),
      ]);

      if (!meRes.data || meRes.data.role !== "ADMIN") {
        router.push("/login");
        return;
      }

      setCurrentUser(meRes.data);
      setNewUsername(meRes.data.username);
      if (labsRes.data) setLabs(labsRes.data);
      if (teachersRes.data) setTeachers(teachersRes.data);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (query = logSearchQuery, filter = logActionFilter) => {
    try {
      setLoadingLogs(true);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filter && filter !== "ALL") params.set("action", filter);

      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      const data = await res.json();
      if (data.data) {
        setLogs(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    loadLogs();
  }, []);

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Add faculty submission
  const handleAddFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingFaculty(true);
    setFacultyError(null);
    setFacultyMessage(null);
    setNewlyCreatedCreds(null);

    try {
      const res = await fetch("/api/auth/admin/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(facultyForm),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to add faculty member");
      }

      setFacultyMessage(data.message);
      setNewlyCreatedCreds({
        username: data.data.username,
        defaultPassword: data.data.defaultPassword || "teacher123",
      });

      setFacultyForm({
        prefix: "Prof.",
        firstName: "",
        middleName: "",
        lastName: "",
        officialEmailId: "",
        employeeCode: "",
        contactNumber: "",
        position: "Faculty",
      });

      await loadAdminData();
      await loadLogs();
    } catch (err: any) {
      setFacultyError(err.message);
    } finally {
      setIsSubmittingFaculty(false);
    }
  };

  // Edit faculty trigger
  const handleOpenEditFaculty = (t: any) => {
    setEditFacultyForm({
      id: t.id,
      prefix: t.prefix || "Prof.",
      firstName: t.firstName || t.name.split(" ")[1] || t.name,
      middleName: t.middleName || "",
      lastName: t.lastName || t.name.split(" ").slice(-1)[0] || "",
      officialEmailId: t.email || "",
      employeeCode: t.employeeCode || "",
      contactNumber: t.contactNumber || "",
      position: (t.position as any) || (t.designation as any) || "Faculty",
    });
    setEditFacultyError(null);
    setEditingFaculty(t);
  };

  // Save edited faculty
  const handleSaveEditFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingFaculty(true);
    setEditFacultyError(null);

    try {
      const res = await fetch("/api/auth/admin/faculty", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFacultyForm),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update member profile");
      }

      setEditingFaculty(null);
      await loadAdminData();
      await loadLogs();
    } catch (err: any) {
      setEditFacultyError(err.message);
    } finally {
      setIsUpdatingFaculty(false);
    }
  };

  // Delete faculty
  const handleConfirmDeleteFaculty = async () => {
    if (!deletingFaculty) return;
    try {
      const res = await fetch(`/api/auth/admin/faculty?id=${deletingFaculty.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setDeletingFaculty(null);
      await loadAdminData();
      await loadLogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Add lab submission
  const handleAddLabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLab(true);
    setLabError(null);
    setLabMessage(null);

    try {
      const res = await fetch("/api/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: labForm.name,
          description: labForm.description,
          workingPcs: Number(labForm.workingPcs) || 0,
          inactivePcs: Number(labForm.inactivePcs) || 0,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to provision new laboratory");
      }

      setLabMessage(data.message);
      setLabForm({
        name: "",
        description: "",
        workingPcs: 0,
        inactivePcs: 0,
      });

      await loadAdminData();
      await loadLogs();
    } catch (err: any) {
      setLabError(err.message);
    } finally {
      setIsSubmittingLab(false);
    }
  };

  // Edit lab trigger
  const handleOpenEditLab = (l: any) => {
    setEditLabForm({
      id: l.id,
      name: l.name,
      description: l.description || "",
      workingPcs: l.workingPcs || 0,
      inactivePcs: l.inactivePcs || 0,
    });
    setEditLabError(null);
    setEditingLab(l);
  };

  // Save edited lab
  const handleSaveEditLab = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingLab(true);
    setEditLabError(null);

    try {
      const res = await fetch("/api/labs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labId: editLabForm.id,
          name: editLabForm.name,
          description: editLabForm.description,
          workingPcs: editLabForm.workingPcs,
          inactivePcs: editLabForm.inactivePcs,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update laboratory");
      }

      setEditingLab(null);
      await loadAdminData();
      await loadLogs();
    } catch (err: any) {
      setEditLabError(err.message);
    } finally {
      setIsUpdatingLab(false);
    }
  };

  // Delete lab
  const handleConfirmDeleteLab = async () => {
    if (!deletingLab) return;
    try {
      const res = await fetch(`/api/labs?id=${deletingLab.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setDeletingLab(null);
      await loadAdminData();
      await loadLogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Assign/unassign teacher to lab
  const handleAssignTeacher = async (labId: string, teacherId: string) => {
    if (!teacherId) return;
    setAssignmentMessage(null);
    try {
      const res = await fetch("/api/auth/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labId, teacherId, action: "ASSIGN" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setAssignmentMessage("Authorization granted: Teacher assigned to laboratory.");
      await loadAdminData();
      await loadLogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUnassignTeacher = async (labId: string, teacherId: string) => {
    setAssignmentMessage(null);
    try {
      const res = await fetch("/api/auth/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labId, teacherId, action: "UNASSIGN" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setAssignmentMessage("Authorization revoked: Teacher removed from laboratory.");
      await loadAdminData();
      await loadLogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Update admin credentials
  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredMessage(null);
    setCredError(null);

    if (newPassword && newPassword !== confirmPassword) {
      setCredError("Passwords do not match.");
      return;
    }

    setIsUpdatingCreds(true);
    try {
      const res = await fetch("/api/auth/admin/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newUsername,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update credentials");

      setCredMessage("Admin ID & password successfully updated! Please remember your new login credentials.");
      setNewPassword("");
      setConfirmPassword("");
      await loadLogs();
    } catch (err: any) {
      setCredError(err.message);
    } finally {
      setIsUpdatingCreds(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-2">
        <p className="text-xs font-mono text-cyan-400">Verifying Head of Department security clearance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Banner with Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800/60 flex items-center space-x-1">
              <Lock className="h-3 w-3 text-rose-400" />
              <span>HEAD OF THE DEPARTMENT ONLY</span>
            </span>
            <span className="text-xs text-slate-400">• Exclusive Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            Admin Authorization & Laboratory Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Provision, edit, and decommission laboratories; register and manage faculty & staff; and review the complete daily institutional activity audit trail.
          </p>
        </div>

        {/* Action Button Cluster */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => {
              setFacultyMessage(null);
              setFacultyError(null);
              setNewlyCreatedCreds(null);
              setShowAddFacultyModal(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-2 border border-cyan-400/30 active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Add Faculty / Staff</span>
          </button>

          <button
            onClick={() => {
              setLabMessage(null);
              setLabError(null);
              setShowAddLabModal(true);
            }}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center space-x-2 border border-slate-700 active:scale-95"
          >
            <Building2 className="h-4 w-4 text-cyan-400" />
            <span>+ Add New Laboratory</span>
          </button>
        </div>
      </div>

      {assignmentMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{assignmentMessage}</span>
        </div>
      )}

      {/* Grid: Lab Allocation Matrix on Left, Admin Credentials & Roster on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Lab Authorization Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-200">
                Laboratory Faculty Assignment Matrix ({labs.length} Laboratories)
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Total Labs: <span className="text-cyan-400 font-bold">{labs.length}</span>
            </span>
          </div>

          <div className="space-y-4">
            {labs.map((lab) => {
              const assignedTeachers = teachers.filter((t) =>
                t.labAssignments?.some((a: any) => a.lab?.id === lab.id)
              );

              const unassignedTeachers = teachers.filter(
                (t) =>
                  t.role === "TEACHER" &&
                  !t.labAssignments?.some((a: any) => a.lab?.id === lab.id)
              );

              return (
                <div
                  key={lab.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-100">{lab.name}</h3>
                        {/* Edit Lab & Delete Lab Buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleOpenEditLab(lab)}
                            title="Edit laboratory parameters"
                            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingLab(lab)}
                            title="Delete laboratory"
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {lab.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-cyan-300 border border-slate-800">
                        {lab.workingPcs || 0} Working / {lab.inactivePcs || 0} Inactive PCs
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-emerald-400 border border-slate-800">
                        {assignedTeachers.length} Authorized Faculty
                      </span>
                    </div>
                  </div>

                  {/* Authorized In-Charge Faculty List */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Authorized In-Charge Faculty (Full Edit & Relocate Rights)
                    </p>
                    {assignedTeachers.length === 0 ? (
                      <p className="text-xs text-amber-400/80 italic p-2 bg-slate-950/60 rounded border border-slate-800/80">
                        No faculty currently in-charge. Only Head of Department (Admin) can modify instruments here.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {assignedTeachers.map((teacher) => (
                          <div
                            key={teacher.id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-200 block">
                                {teacher.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                @{teacher.username} • {teacher.designation || teacher.position || teacher.role}
                              </span>
                            </div>
                            <button
                              onClick={() => handleUnassignTeacher(lab.id, teacher.id)}
                              title="Revoke authorization"
                              className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assign Faculty Dropdown */}
                  {unassignedTeachers.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center space-x-2">
                      <select
                        value={selectedLabId[lab.id] || ""}
                        onChange={(e) =>
                          setSelectedLabId((prev) => ({ ...prev, [lab.id]: e.target.value }))
                        }
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">Select teacher to authorize for {lab.name}...</option>
                        {unassignedTeachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} (@{t.username})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const teacherId = selectedLabId[lab.id];
                          if (teacherId) {
                            handleAssignTeacher(lab.id, teacherId);
                            setSelectedLabId((prev) => ({ ...prev, [lab.id]: "" }));
                          }
                        }}
                        disabled={!selectedLabId[lab.id]}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Authorize</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Security Credentials & Faculty Roster Overview */}
        <div className="space-y-6">
          {/* Admin Credentials Update Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-slate-200">
              <KeyRound className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold">Admin Login Credentials</h3>
            </div>
            <p className="text-xs text-slate-400">
              The Admin login ID and password can be updated anytime below.
            </p>

            <form onSubmit={handleUpdateCredentials} className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Unique Admin Login ID / Username
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {newPassword && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {credMessage && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[11px] text-emerald-300">
                  {credMessage}
                </div>
              )}

              {credError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded text-[11px] text-rose-300">
                  {credError}
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingCreds || !newUsername}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isUpdatingCreds ? "Updating..." : "Update Admin Credentials"}</span>
              </button>
            </form>
          </div>

          {/* Quick Roster Summary with EDIT & REMOVE options */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-slate-200">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold">Faculty & Staff Overview</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                {teachers.length} Members
              </span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {teachers.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100">{t.name}</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                        {t.position || t.designation || t.role}
                      </span>
                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditFaculty(t)}
                        title="Edit faculty details"
                        className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      {/* Delete Button (disabled for Admin) */}
                      {t.role !== "ADMIN" && (
                        <button
                          onClick={() => setDeletingFaculty(t)}
                          title="Remove faculty member"
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 text-[10px] font-mono text-slate-400">
                    <div>
                      <span className="text-slate-500">ID:</span> @{t.username}
                    </div>
                    {t.employeeCode && (
                      <div>
                        <span className="text-slate-500">Emp:</span> {t.employeeCode}
                      </div>
                    )}
                    {t.email && (
                      <div className="truncate col-span-2 text-slate-400">
                        <span className="text-slate-500">Email:</span> {t.email}
                      </div>
                    )}
                    {t.contactNumber && (
                      <div>
                        <span className="text-slate-500">Phone:</span> {t.contactNumber}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-900">
                    {t.labAssignments?.length > 0 ? (
                      t.labAssignments.map((a: any) => (
                        <span
                          key={a.lab.id}
                          className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/50"
                        >
                          {a.lab.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No assigned labs</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: DAILY ACTIVITY & AUDIT LOGS WITH SEARCH                          */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>Institutional Activity &amp; Daily Audit Logs</span>
                <span className="text-xs font-normal font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                  {logs.length} Recorded Events
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Complete chronological log of facility additions, modifications, relocations, and security updates.
              </p>
            </div>
          </div>

          <button
            onClick={() => loadLogs()}
            disabled={loadingLogs}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 self-start sm:self-auto transition-colors"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loadingLogs ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh Logs</span>
          </button>
        </div>

        {/* Search Bar & Action Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search logs by operator, entity, action type, employee code, or keywords..."
              value={logSearchQuery}
              onChange={(e) => {
                setLogSearchQuery(e.target.value);
                loadLogs(e.target.value, logActionFilter);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {["ALL", "CREATE_FACULTY", "EDIT_FACULTY", "CREATE_LAB", "ASSIGN_LAB", "PASSWORD_CHANGE"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setLogActionFilter(f);
                  loadLogs(logSearchQuery, f);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all ${
                  logActionFilter === f
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700"
                }`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table / List */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              {loadingLogs ? "Loading activity logs..." : "No activity logs found matching the search criteria."}
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 max-h-[420px] overflow-y-auto">
              {logs.map((log) => {
                const isCreate = log.action_type.includes("CREATE");
                const isDelete = log.action_type.includes("DELETE") || log.action_type.includes("UNASSIGN");
                const isEdit = log.action_type.includes("EDIT") || log.action_type.includes("UPDATE");
                const isAuth = log.action_type.includes("ASSIGN") || log.action_type.includes("PASSWORD");

                return (
                  <div key={log.id} className="p-3.5 hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            isCreate
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                              : isDelete
                              ? "bg-rose-950 text-rose-300 border border-rose-800/60"
                              : isEdit
                              ? "bg-amber-950 text-amber-300 border border-amber-800/60"
                              : isAuth
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {log.action_type.replace("_", " ")}
                        </span>
                        <span className="font-semibold text-slate-200">
                          {log.userName || log.user?.name || "System"}
                        </span>
                        {log.user?.employeeCode && (
                          <span className="text-[10px] font-mono text-slate-500">
                            ({log.user.employeeCode})
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 text-xs pl-0.5">
                        {log.comment_text}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-500 whitespace-nowrap self-end sm:self-center">
                      <Clock className="h-3 w-3 text-slate-600" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD FACULTY / STAFF (8 STRICT FIELDS ONLY)                       */}
      {/* ========================================================================= */}
      {showAddFacultyModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
              <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Add Faculty / Staff Member</h3>
                    <p className="text-[11px] text-slate-400">Head of Department Institutional Roster Provisioning</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddFacultyModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {facultyMessage && (
                <div className="m-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs space-y-2">
                  <div className="flex items-center space-x-2 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>Member Created Successfully</span>
                  </div>
                  <p className="text-[11px] text-emerald-300/90 pl-6">{facultyMessage}</p>

                  {/* Shareable Default Credentials Card */}
                  {newlyCreatedCreds && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-950 border border-emerald-500/40 text-xs space-y-1.5 font-mono">
                      <p className="text-[10px] text-slate-400 font-sans uppercase font-bold">
                        Share These Credentials With Employee:
                      </p>
                      <div className="flex items-center justify-between bg-slate-900 px-2 py-1 rounded">
                        <span>Username: <strong className="text-cyan-300">{newlyCreatedCreds.username}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleCopy(newlyCreatedCreds.username)}
                          className="text-[10px] text-cyan-400 hover:underline flex items-center space-x-1"
                        >
                          {copiedText === newlyCreatedCreds.username ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedText === newlyCreatedCreds.username ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between bg-slate-900 px-2 py-1 rounded">
                        <span>Default Password: <strong className="text-amber-300">{newlyCreatedCreds.defaultPassword}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleCopy(newlyCreatedCreds.defaultPassword)}
                          className="text-[10px] text-amber-400 hover:underline flex items-center space-x-1"
                        >
                          {copiedText === newlyCreatedCreds.defaultPassword ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedText === newlyCreatedCreds.defaultPassword ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 font-sans italic pt-0.5">
                        * The employee can change this password using the "Change Password" box on the portal.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {facultyError && (
                <div className="m-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                  <span>{facultyError}</span>
                </div>
              )}

              <form onSubmit={handleAddFacultySubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Prefix <span className="text-rose-400">*</span>
                    </label>
                    <select
                      required
                      value={facultyForm.prefix}
                      onChange={(e) => setFacultyForm({ ...facultyForm, prefix: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Prof.">Prof.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Mrs.">Mrs.</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      First Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John"
                      value={facultyForm.firstName}
                      onChange={(e) => setFacultyForm({ ...facultyForm, firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Middle Name <span className="text-slate-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. R."
                      value={facultyForm.middleName}
                      onChange={(e) => setFacultyForm({ ...facultyForm, middleName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Last Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Doe"
                      value={facultyForm.lastName}
                      onChange={(e) => setFacultyForm({ ...facultyForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Official Email ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john.doe@institution.edu"
                    value={facultyForm.officialEmailId}
                    onChange={(e) => setFacultyForm({ ...facultyForm, officialEmailId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Employee Code <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. EMP-1048"
                      value={facultyForm.employeeCode}
                      onChange={(e) => setFacultyForm({ ...facultyForm, employeeCode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Contact Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={facultyForm.contactNumber}
                      onChange={(e) => setFacultyForm({ ...facultyForm, contactNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Position (Faculty / Staff) <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <label
                      className={`flex items-center justify-center p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-semibold ${
                        facultyForm.position === "Faculty"
                          ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="position"
                        value="Faculty"
                        checked={facultyForm.position === "Faculty"}
                        onChange={() => setFacultyForm({ ...facultyForm, position: "Faculty" })}
                        className="sr-only"
                      />
                      <span>Faculty</span>
                    </label>

                    <label
                      className={`flex items-center justify-center p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-semibold ${
                        facultyForm.position === "Staff"
                          ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="position"
                        value="Staff"
                        checked={facultyForm.position === "Staff"}
                        onChange={() => setFacultyForm({ ...facultyForm, position: "Staff" })}
                        className="sr-only"
                      />
                      <span>Staff</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddFacultyModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFaculty}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-1.5"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{isSubmittingFaculty ? "Registering..." : "Register Faculty / Staff"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT FACULTY / STAFF MEMBER                                      */}
      {/* ========================================================================= */}
      {editingFaculty && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
              <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Pencil className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Edit Member Profile</h3>
                    <p className="text-[11px] text-slate-400">Modify faculty &amp; staff registry details</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingFaculty(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {editFacultyError && (
                <div className="m-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                  <span>{editFacultyError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEditFaculty} className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Prefix</label>
                    <select
                      required
                      value={editFacultyForm.prefix}
                      onChange={(e) => setEditFacultyForm({ ...editFacultyForm, prefix: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Prof.">Prof.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Mrs.">Mrs.</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={editFacultyForm.firstName}
                      onChange={(e) => setEditFacultyForm({ ...editFacultyForm, firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Middle Name</label>
                    <input
                      type="text"
                      value={editFacultyForm.middleName}
                      onChange={(e) => setEditFacultyForm({ ...editFacultyForm, middleName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={editFacultyForm.lastName}
                      onChange={(e) => setEditFacultyForm({ ...editFacultyForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={editFacultyForm.officialEmailId}
                    onChange={(e) => setEditFacultyForm({ ...editFacultyForm, officialEmailId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Employee Code</label>
                    <input
                      type="text"
                      required
                      value={editFacultyForm.employeeCode}
                      onChange={(e) => setEditFacultyForm({ ...editFacultyForm, employeeCode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Contact Number</label>
                    <input
                      type="tel"
                      required
                      value={editFacultyForm.contactNumber}
                      onChange={(e) => setEditFacultyForm({ ...editFacultyForm, contactNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Position</label>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <label
                      className={`flex items-center justify-center p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-semibold ${
                        editFacultyForm.position === "Faculty"
                          ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="editPosition"
                        value="Faculty"
                        checked={editFacultyForm.position === "Faculty"}
                        onChange={() => setEditFacultyForm({ ...editFacultyForm, position: "Faculty" })}
                        className="sr-only"
                      />
                      <span>Faculty</span>
                    </label>

                    <label
                      className={`flex items-center justify-center p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-semibold ${
                        editFacultyForm.position === "Staff"
                          ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="editPosition"
                        value="Staff"
                        checked={editFacultyForm.position === "Staff"}
                        onChange={() => setEditFacultyForm({ ...editFacultyForm, position: "Staff" })}
                        className="sr-only"
                      />
                      <span>Staff</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingFaculty(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingFaculty}
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center space-x-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isUpdatingFaculty ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE FACULTY CONFIRMATION                                      */}
      {/* ========================================================================= */}
      {deletingFaculty && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Remove Faculty Member</h3>
                  <p className="text-xs text-slate-400">Revoke authorization and delete account</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to remove <strong className="text-white font-bold">{deletingFaculty.name}</strong> ({deletingFaculty.employeeCode || deletingFaculty.username}) from the institutional registry? All their assigned laboratory rights will be immediately revoked.
              </p>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingFaculty(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteFaculty}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Confirm Removal
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD LABORATORY                                                   */}
      {/* ========================================================================= */}
      {showAddLabModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
              <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Add New Laboratory Facility</h3>
                    <p className="text-[11px] text-slate-400">Institutional Laboratory Provisioning</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddLabModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {labMessage && (
                <div className="m-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>{labMessage}</span>
                </div>
              )}

              {labError && (
                <div className="m-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                  <span>{labError}</span>
                </div>
              )}

              <form onSubmit={handleAddLabSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Laboratory Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Network Security & Cryptography Lab"
                    value={labForm.name}
                    onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Description / Purpose / Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Advanced Networking, Firewalls, and Cyber Simulation"
                    value={labForm.description}
                    onChange={(e) => setLabForm({ ...labForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Initial Working PCs
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={labForm.workingPcs}
                      onChange={(e) => setLabForm({ ...labForm, workingPcs: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Initial Inactive / Faulty PCs
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={labForm.inactivePcs}
                      onChange={(e) => setLabForm({ ...labForm, inactivePcs: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-rose-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddLabModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLab}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-1.5"
                  >
                    <Building2 className="h-4 w-4" />
                    <span>{isSubmittingLab ? "Provisioning..." : "Provision Laboratory"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT LABORATORY                                                  */}
      {/* ========================================================================= */}
      {editingLab && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
              <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Pencil className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Edit Laboratory Facility</h3>
                    <p className="text-[11px] text-slate-400">Update facility name, description, and workstation capacity</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingLab(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {editLabError && (
                <div className="m-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                  <span>{editLabError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEditLab} className="p-5 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Laboratory Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editLabForm.name}
                    onChange={(e) => setEditLabForm({ ...editLabForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Description / Purpose / Department
                  </label>
                  <input
                    type="text"
                    value={editLabForm.description}
                    onChange={(e) => setEditLabForm({ ...editLabForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Working PCs
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editLabForm.workingPcs}
                      onChange={(e) => setEditLabForm({ ...editLabForm, workingPcs: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Inactive / Faulty PCs
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editLabForm.inactivePcs}
                      onChange={(e) => setEditLabForm({ ...editLabForm, inactivePcs: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-rose-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingLab(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingLab}
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center space-x-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isUpdatingLab ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: DELETE LABORATORY CONFIRMATION                                   */}
      {/* ========================================================================= */}
      {deletingLab && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Decommission Laboratory</h3>
                  <p className="text-xs text-slate-400">Permanently delete laboratory record</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to remove <strong className="text-white font-bold">{deletingLab.name}</strong>? All faculty authorizations for this facility will be removed. Note: If this laboratory houses active system rigs or instruments, they must be relocated first.
              </p>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingLab(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteLab}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Confirm Decommission
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
