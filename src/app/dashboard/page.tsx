"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Sun, Moon, Users, UserPlus, ScanLine, Monitor, ShieldCheck, ChevronRight, ChevronDown, Plus, X, ToggleLeft, ToggleRight, ClipboardCheck, ScrollText, Search, Send, Trash2, Settings, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Activity, Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle2, Key, Menu, User, MapPin, Building2, Layers, Briefcase, CreditCard, Calendar } from "lucide-react";
import { NotificationBell } from "@/components/notification/NotificationBell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleType, ZONE_STRUCTURE, POSITION_LABELS, PAYMENT_LABELS } from "@/lib/db/mock";
import { isAdmin, getVisibleSections, DASHBOARD_SECTIONS } from "@/lib/auth/rbac";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend } from "recharts";

const ICON_MAP: Record<string, any> = { LayoutDashboard: BarChart3, Users, UserPlus, ScanLine, ClipboardCheck, FileText: ScrollText, ScrollText, Monitor, ShieldCheck, Settings };

const CHART_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6", "#06b6d4", "#f43f5e", "#10b981"];

export default function DashboardPage() {
  const router = useRouter();
  const [section, setSection] = useState("overview");
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(j => {
      if (!j.user) { router.push("/login"); return; }
      setUser(j.user);
      setDark(document.documentElement.classList.contains("dark"));
    });
  }, [router]);

  if (!user) return <div className="min-h-screen grid place-items-center"><Skeleton className="h-8 w-48" /></div>;

  return (
    <DashboardInner user={user} setUser={setUser} dark={dark} setDark={setDark} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} section={section} setSection={setSection} queryClient={queryClient} />
  );
}

function DashboardInner({ user, setUser, dark, setDark, sidebarOpen, setSidebarOpen, mobileOpen, setMobileOpen, section, setSection, queryClient }: { user: any; setUser: any; dark: boolean; setDark: any; sidebarOpen: boolean; setSidebarOpen: any; mobileOpen: boolean; setMobileOpen: any; section: string; setSection: any; queryClient: any }) {
  const router = useRouter();
  const { data: msgData } = useQuery({ queryKey: ["messages", "unread"], queryFn: async () => fetch("/api/auth/messages").then(r => r.json()), refetchInterval: 30000 });
  const unreadCount = msgData?.unreadCount || 0;
  const visibleSections = getVisibleSections(user.role as RoleType);

  const toggleTheme = () => {
    const nd = !dark; setDark(nd);
    document.documentElement.classList.toggle("dark", nd);
    localStorage.setItem("theme", nd ? "dark" : "light");
  };

  const logout = () => { fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); };

  const handleNav = (id: string) => {
    setSection(id);
    setMobileOpen(false);
  };

  const SidebarContent = ({ collapsed }: { collapsed?: boolean }) => (
    <>
      <div className="h-14 md:h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2.5 flex-1">
            <div className="h-8 w-8 rounded-lg overflow-hidden"><img src="/dclmlogo.JPG" alt="Logo" className="h-full w-full object-cover" /></div>
            <div><p className="text-xs font-semibold leading-none">Workers</p><p className="text-[10px] text-slate-400">Conference</p></div>
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="h-7 w-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 grid place-items-center text-slate-400 hidden md:grid">
            <ChevronRight size={14} className="rotate-180" />
          </button>
        )}
        {collapsed && (
          <button onClick={() => setSidebarOpen(false)} className="h-7 w-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 grid place-items-center text-slate-400">
            <ChevronRight size={14} />
          </button>
        )}
      </div>
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {visibleSections.map(s => {
          const Icon = ICON_MAP[s.icon] || BarChart3;
          const isBroadcast = s.id === "broadcast";
          return (
            <button key={s.id} onClick={() => handleNav(s.id)} className={`nav-item-premium w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${section === s.id ? "bg-gradient-to-r from-[#1a237e] to-[#283593] text-white shadow-lg shadow-indigo-500/20" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"}`}>
              <Icon size={16} />
              {!collapsed && s.label}
              {!collapsed && isBroadcast && unreadCount > 0 && (
                <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
              {collapsed && isBroadcast && unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-800/40 p-3 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold truncate">{user.displayName}</p>
            <p className="text-[10px] text-slate-400 truncate capitalize">{user.role?.replace("_", " ")}</p>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#f0f2f5] dark:bg-[#020617]">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex fixed inset-y-0 left-0 z-30 flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 ease-[var(--ease-out)] ${sidebarOpen ? "w-64" : "w-[68px]"}`}>
        <SidebarContent collapsed={!sidebarOpen} />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 md:hidden elevation-3">
              <div className="h-14 flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5 flex-1">
                  <div className="h-8 w-8 rounded-xl overflow-hidden"><img src="/dclmlogo.JPG" alt="Logo" className="h-full w-full object-cover" /></div>
                  <div><p className="text-xs font-semibold leading-none tracking-premium">Workers</p><p className="text-[10px] text-slate-400">Conference</p></div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="h-8 w-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 grid place-items-center text-slate-400 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
                {visibleSections.map(s => {
                  const Icon = ICON_MAP[s.icon] || BarChart3;
                  const isBroadcast = s.id === "broadcast";
                  return (
                    <button key={s.id} onClick={() => handleNav(s.id)} className={`nav-item-premium w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${section === s.id ? "bg-gradient-to-r from-[#1a237e] to-[#283593] text-white shadow-lg shadow-indigo-500/20" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"}`}>
                      <Icon size={18} />
                      <span className="flex-1 text-left">{s.label}</span>
                      {isBroadcast && unreadCount > 0 && (
                        <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">{unreadCount > 99 ? "99+" : unreadCount}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                <div className="rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-800/40 p-3 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold truncate">{user.displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate capitalize">{user.role?.replace("_", " ")}</p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className={`flex-1 min-w-0 max-w-full transition-all duration-300 ease-[var(--ease-out)] ${sidebarOpen ? "md:ml-64" : "md:ml-[68px]"}`}>
        <header className="sticky top-0 z-20 h-14 md:h-16 glass border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <button onClick={() => setMobileOpen(true)} className="h-9 w-9 shrink-0 grid place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden text-slate-600 dark:text-slate-300 transition-colors">
              <Menu size={18} />
            </button>
            <h1 className="text-sm font-bold tracking-premium capitalize truncate min-w-0">{section === "overview" ? "Dashboard" : section.replace("_", " ")}</h1>
            <span className="hidden sm:inline shrink-0 text-[10px] bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2.5 py-0.5 rounded-full font-semibold shadow-sm">DCLM 2026</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <button onClick={toggleTheme} className="h-8 w-8 md:h-9 md:w-9 grid place-items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-all duration-200">{dark ? <Moon size={14} /> : <Sun size={14} />}</button>
            <NotificationBell userId={user.id} onNavigateToBroadcast={() => handleNav("broadcast")} />
            <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-1 pr-3 py-1 hover:shadow-md transition-all duration-200">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#1a237e] to-[#7c4dff] grid place-items-center text-white text-xs font-bold ring-2 ring-white dark:ring-slate-900">{user.displayName?.[0]}</div>
              <div className="text-left leading-none"><p className="text-xs font-semibold">{user.displayName}</p><p className="text-[10px] text-slate-500">{user.email}</p></div>
            </div>
            <button onClick={logout} className="inline-flex items-center gap-1 md:gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2.5 md:px-3 py-1.5 md:py-2 text-xs font-medium hover:shadow-lg transition-all duration-200"><LogOut size={14} /> <span className="hidden sm:inline">Logout</span></button>
          </div>
        </header>
        <main className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {section === "overview" && <OverviewSection user={user} />}
              {section === "users" && isAdmin(user.role as RoleType) && <UserManagementSection />}
              {section === "workers" && <WorkerRegistrationSection user={user} />}
              {section === "verification" && <VerificationSection user={user} />}
              {section === "approval" && <ApprovalSection user={user} />}
              {section === "attendance" && <AttendanceSection />}
              {section === "broadcast" && <BroadcastSection user={user} />}
              {section === "sessions" && isAdmin(user.role as RoleType) && <SessionsSection />}
              {section === "audit" && isAdmin(user.role as RoleType) && <AuditSection />}
              {section === "reports" && isAdmin(user.role as RoleType) && <ReportsSection user={user} />}
              {section === "mfa" && isAdmin(user.role as RoleType) && <MFASection />}
              {section === "settings" && <SettingsSection user={user} setUser={setUser} />}
            </motion.div>
      </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   POWER BI PRO — Slicer Bar, Goal Progress, Drill Indicator
   ══════════════════════════════════════════════════════════════ */
function SlicerBar({ filters, setFilters, workers }: { filters: any; setFilters: any; workers: any[] }) {
  const zones = [...new Set(workers.map((w: any) => w.zone))].sort();
  const regions = [...new Set(workers.filter((w: any) => !filters.zone || w.zone === filters.zone).map((w: any) => w.region))].sort();
  const positions = [...new Set(workers.map((w: any) => w.position))].sort();

  const activeCount = [filters.zone, filters.region, filters.position, filters.payment].filter(Boolean).length;

  return (
    <div className="card-premium p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 grid place-items-center"><Search size={12} className="text-white" /></div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Slicers</p>
          {activeCount > 0 && <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">{activeCount}</span>}
        </div>
        {activeCount > 0 && (
          <button onClick={() => setFilters({ zone: "", region: "", position: "", payment: "" })} className="text-[10px] text-slate-400 hover:text-red-500 transition-colors font-medium">Clear all</button>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"><MapPin size={13} /></div>
          <select value={filters.zone} onChange={e => setFilters({ ...filters, zone: e.target.value, region: "" })} className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 text-xs appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="">All Zones</option>
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"><Building2 size={13} /></div>
          <select value={filters.region} onChange={e => setFilters({ ...filters, region: e.target.value })} disabled={!filters.zone && regions.length === 0} className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 text-xs appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50">
            <option value="">All Regions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"><Briefcase size={13} /></div>
          <select value={filters.position} onChange={e => setFilters({ ...filters, position: e.target.value })} className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 text-xs appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="">All Positions</option>
            {positions.map(p => <option key={p} value={p}>{POSITION_LABELS[p as keyof typeof POSITION_LABELS] || p}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"><CreditCard size={13} /></div>
          <select value={filters.payment} onChange={e => setFilters({ ...filters, payment: e.target.value })} className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 text-xs appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="">All Payment</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

function GoalProgress({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const status = pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger";
  const statusColor = status === "success" ? "#10b981" : status === "warning" ? "#f59e0b" : "#ef4444";
  return (
    <div className="px-4 py-3 sm:px-5 bg-white dark:bg-slate-900 relative group">
      <div className="absolute left-0 top-0 h-full w-[3px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: statusColor }} />
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
        <span className="text-[10px] font-bold tabular-nums" style={{ color: statusColor }}>{pct.toFixed(0)}%</span>
      </div>
      <div className="flex items-baseline gap-1.5 mb-1.5">
        <p className="text-xl kpi-number" style={{ color }}>{current}</p>
        <span className="text-[10px] text-slate-400">/ {target}</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${statusColor}, ${statusColor}88)` }} />
      </div>
    </div>
  );
}

function DrillIndicator() {
  return (
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-end justify-center pb-3">
      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-full backdrop-blur-sm">Click to drill</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   REPORTS — Premium Power BI Pro Design
   ══════════════════════════════════════════════════════════════ */
function ReportsSection({ user }: { user: any }) {
  const { data } = useQuery({ queryKey: ["workers"], queryFn: async () => fetch("/api/auth/workers").then(r => r.json()) });
  const workers: any[] = data?.workers || [];
  const [reportType, setReportType] = useState("registration");
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split("T")[0]);

  const isVerifier = user.role === "verifier";
  const isRegionalOfficer = user.role === "regional_officer";
  const isNationalOfficer = user.role === "national_officer";
  const isSuperAdmin = user.role === "super_admin";
  const showZoneRegionDivision = !isVerifier;
  const showZoneBreakdown = !isVerifier;
  const showFullNational = isSuperAdmin || user.role === "viewer";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const total = workers.length;
  const paid = workers.filter(w => w.paymentStatus === "paid").length;
  const unpaid = workers.filter(w => w.paymentStatus === "unpaid").length;
  const verified = workers.filter(w => w.verified).length;
  const male = workers.filter(w => w.gender === "male").length;
  const female = workers.filter(w => w.gender === "female").length;

  const dailyWorkers = workers.filter(w => {
    if (!w.createdAt) return false;
    return w.createdAt.startsWith(dailyDate);
  });
  const dailyPaid = dailyWorkers.filter(w => w.paymentStatus === "paid").length;
  const dailyVerified = dailyWorkers.filter(w => w.verified).length;
  const dailyMale = dailyWorkers.filter(w => w.gender === "male").length;
  const dailyFemale = dailyWorkers.filter(w => w.gender === "female").length;

  const byZone: Record<string, any[]> = {};
  workers.forEach(w => { if (!byZone[w.zone]) byZone[w.zone] = []; byZone[w.zone].push(w); });

  const byRegion: Record<string, any[]> = {};
  workers.forEach(w => { if (!byRegion[w.region]) byRegion[w.region] = []; byRegion[w.region].push(w); });

  const byPosition: Record<string, number> = {};
  workers.forEach(w => { byPosition[w.position] = (byPosition[w.position] || 0) + 1; });
  const topPositions = Object.entries(byPosition).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const handlePrint = () => { window.print(); };

  const reportMeta: Record<string, { label: string; title: string; subtitle: string; color: string; icon: any }> = {
    daily: { label: "Daily", title: "Daily Activity Report", subtitle: "Workers registered, paid, and verified on a specific day", color: "#f59e0b", icon: <Calendar size={18} /> },
    registration: { label: "Registration", title: "Registration Summary Report", subtitle: "Complete list of all registered workers across all zones", color: "#6366f1", icon: <UserPlus size={18} /> },
    payment: { label: "Payment", title: "Payment Status Report", subtitle: "Payment collection breakdown and outstanding balances", color: "#10b981", icon: <CreditCard size={18} /> },
    verification: { label: "Verification", title: "Verification Status Report", subtitle: "Identity verification progress and pending reviews", color: "#06b6d4", icon: <ScanLine size={18} /> },
    regional: { label: "Regional", title: "Regional Breakdown Report", subtitle: "Worker distribution by zone, region, and division", color: "#8b5cf6", icon: <MapPin size={18} /> },
    gender: { label: "Gender", title: "Gender Analysis Report", subtitle: "Gender distribution with zone-level ratios", color: "#ec4899", icon: <Users size={18} /> },
  };
  const meta = reportMeta[reportType];

  return (
    <div className="space-y-4 min-w-0">
      {/* ── Screen-Only Header ── */}
      <div className="no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                <FileSpreadsheet size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm tracking-tight">Reports</h2>
                <p className="text-[11px] text-slate-400 truncate">Professional reports — ready for PDF export</p>
              </div>
            </div>
          </div>
          <Button onClick={handlePrint} className="gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all flex-shrink-0">
            <Download size={14} /> Export PDF
          </Button>
        </div>

        {/* ── Report Type Tabs ── */}
        <div className="flex overflow-x-auto gap-1.5 mt-4 pb-1 scrollbar-thin">
          {Object.entries(reportMeta).map(([id, r]) => (
            <button key={id} onClick={() => setReportType(id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                reportType === id
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}>
              {r.icon} {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          SCREEN-ONLY — Premium Report Preview
         ════════════════════════════════════════════════════════ */}
      <div className="no-print space-y-4">
        {/* Daily Date Picker (only for daily report) */}
        {reportType === "daily" && (
          <div className="flex items-center gap-2.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Report Date:</label>
            <input type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 font-medium" />
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {(reportType === "daily" ? [
            { label: "Daily Total", value: dailyWorkers.length, color: "from-indigo-500 to-indigo-600", icon: <UserPlus size={16} /> },
            { label: "Paid Today", value: dailyPaid, color: "from-emerald-500 to-emerald-600", icon: <CheckCircle2 size={16} /> },
            { label: "Verified", value: dailyVerified, color: "from-cyan-500 to-cyan-600", icon: <ScanLine size={16} /> },
            { label: "Male", value: dailyMale, color: "from-blue-500 to-blue-600", icon: <User size={16} /> },
            { label: "Female", value: dailyFemale, color: "from-pink-500 to-pink-600", icon: <Users size={16} /> },
            { label: "Conversion", value: dailyWorkers.length > 0 ? `${((dailyPaid / dailyWorkers.length) * 100).toFixed(0)}%` : "—", color: "from-amber-500 to-amber-600", icon: <TrendingUp size={16} /> },
          ] : [
            { label: "Total Workers", value: total, color: "from-indigo-500 to-indigo-600", icon: <UserPlus size={16} /> },
            { label: "Paid", value: paid, color: "from-emerald-500 to-emerald-600", icon: <CheckCircle2 size={16} /> },
            { label: "Unpaid", value: unpaid, color: "from-amber-500 to-amber-600", icon: <AlertTriangle size={16} /> },
            { label: "Verified", value: verified, color: "from-cyan-500 to-cyan-600", icon: <ScanLine size={16} /> },
            { label: "Male", value: male, color: "from-blue-500 to-blue-600", icon: <User size={16} /> },
            { label: "Female", value: female, color: "from-pink-500 to-pink-600", icon: <Users size={16} /> },
          ]).map((s, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 p-3.5 shadow-sm hover:shadow-md transition-all group hover-lift min-w-0">
              <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${s.color}`} />
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <span className="text-white">{s.icon}</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{s.label}</span>
              </div>
              <p className="text-xl font-black tracking-tight kpi-number">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Report Content Cards */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0" style={{ background: `${meta.color}15` }}>
              <span style={{ color: meta.color }}>{meta.icon}</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm tracking-tight">{meta.title}</h3>
              <p className="text-[11px] text-slate-400 truncate">{meta.subtitle}</p>
            </div>
          </div>

          {/* Registration Summary */}
          {reportType === "registration" && (
            <div className="p-5">
              {/* Bar chart — workers by zone */}
              {showZoneBreakdown && (<div className="mb-5">
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">{isNationalOfficer ? "Verification by Zone" : "Workers by Zone"}</h4>
                <div className="space-y-2">
                  {Object.entries(byZone).sort((a, b) => b[1].length - a[1].length).map(([zone, ws]) => {
                    const pct = total > 0 ? (ws.length / total) * 100 : 0;
                    return (
                      <div key={zone} className="flex items-center gap-3 group">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 w-28 truncate text-right flex-shrink-0">{zone}</span>
                        <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative min-w-0">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg transition-all flex items-center px-2.5 min-w-0" style={{ width: `${Math.max(pct, 3)}%` }}>
                            <span className="text-[10px] font-bold text-white whitespace-nowrap">{ws.length}</span>
                          </div>
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(byZone).length === 0 && <p className="text-xs text-slate-400 text-center py-6">No workers registered yet</p>}
                </div>
              </div>)}
              {/* Data table — desktop */}
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="report-table hidden md:table">
                  <thead><tr><th>#</th><th>Full Name</th><th>Gender</th>{showZoneRegionDivision && <><th>Zone</th><th>Region</th><th>Division</th></>}<th>Position</th><th>Payment</th><th>Verified</th></tr></thead>
                  <tbody>
                    {workers.map((w, i) => (
                      <tr key={w.id}>
                        <td>{i + 1}</td><td className="font-medium">{w.name}</td><td className="capitalize">{w.gender}</td>
                        {showZoneRegionDivision && <><td>{w.zone}</td><td>{w.region}</td><td>{w.division}</td></>}
                        <td>{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</td>
                        <td><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${w.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>{w.paymentStatus}</span></td>
                        <td>{w.verified ? <CheckCircle2 size={14} className="text-emerald-500" /> : <span className="text-slate-300">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="md:hidden space-y-2 mt-4">
                {workers.map((w, i) => (
                  <div key={w.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold truncate">{w.name}</span>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${w.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>{w.paymentStatus}</span>
                        {w.verified && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">Verified</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{w.gender === "male" ? "Male" : "Female"}</span>
                      {showZoneRegionDivision && <><span>{w.zone}</span><span>{w.region}</span><span>{w.division}</span></>}
                      <span className={showZoneRegionDivision ? "col-span-2" : ""}>{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</span>
                    </div>
                  </div>
                ))}
                {workers.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No workers registered yet</p>}
              </div>
            </div>
          )}

          {/* Payment Report */}
          {reportType === "payment" && (
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Donut visual */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" className="dark:stroke-slate-800" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${total > 0 ? (paid/total)*100 : 0} 100`} className="transition-all duration-700" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray={`${total > 0 ? (unpaid/total)*100 : 0} 100`} strokeDashoffset={`-${total > 0 ? (paid/total)*100 : 0}`} className="transition-all duration-700" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black kpi-number">{total}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-[10px] font-semibold text-slate-500">Paid ({paid})</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-[10px] font-semibold text-slate-500">Unpaid ({unpaid})</span></div>
                  </div>
                </div>
                {/* Breakdown bars */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Breakdown</h4>
                  <div>
                    <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">Paid</span><span className="text-xs font-bold text-emerald-600">{paid} ({total > 0 ? ((paid/total)*100).toFixed(1) : 0}%)</span></div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700" style={{ width: `${total > 0 ? (paid/total)*100 : 0}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">Unpaid</span><span className="text-xs font-bold text-amber-600">{unpaid} ({total > 0 ? ((unpaid/total)*100).toFixed(1) : 0}%)</span></div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-700" style={{ width: `${total > 0 ? (unpaid/total)*100 : 0}%` }} /></div>
                  </div>
                  {/* Top unpaid */}
                  <div className="mt-4">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Top Unpaid</h4>
                    {workers.filter(w => w.paymentStatus === "unpaid").slice(0, 5).map(w => (
                      <div key={w.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <span className="text-xs font-medium truncate">{w.name}</span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{w.zone}</span>
                      </div>
                    ))}
                    {unpaid === 0 && <p className="text-xs text-emerald-500 font-medium">All workers have paid!</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Report */}
          {reportType === "verification" && (
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" className="dark:stroke-slate-800" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#06b6d4" strokeWidth="3" strokeDasharray={`${total > 0 ? (verified/total)*100 : 0} 100`} />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray={`${total > 0 ? ((total-verified)/total)*100 : 0} 100`} strokeDashoffset={`-${total > 0 ? (verified/total)*100 : 0}`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black kpi-number">{total > 0 ? ((verified/total)*100).toFixed(0) : 0}%</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Verified</span>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-cyan-500" /><span className="text-[10px] font-semibold text-slate-500">Verified ({verified})</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-400" /><span className="text-[10px] font-semibold text-slate-500">Pending ({total - verified})</span></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Verification</h4>
                  <div>
                    <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">Verified</span><span className="text-xs font-bold text-cyan-600">{verified} ({total > 0 ? ((verified/total)*100).toFixed(1) : 0}%)</span></div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full transition-all duration-700" style={{ width: `${total > 0 ? (verified/total)*100 : 0}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">Pending</span><span className="text-xs font-bold text-slate-500">{total - verified} ({total > 0 ? (((total-verified)/total)*100).toFixed(1) : 0}%)</span></div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-slate-400 to-slate-500 rounded-full transition-all duration-700" style={{ width: `${total > 0 ? ((total-verified)/total)*100 : 0}%` }} /></div>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    {workers.filter(w => !w.verified).slice(0, 5).map(w => (
                      <div key={w.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <span className="text-xs font-medium truncate">{w.name}</span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{w.zone}</span>
                      </div>
                    ))}
                    {verified === total && <p className="text-xs text-cyan-600 font-medium">All workers verified!</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regional Breakdown */}
          {reportType === "regional" && (
            <div className="p-5">
              {showZoneBreakdown && (<div className="mb-5">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Workers by Zone</h4>
                <div className="space-y-2">
                  {Object.entries(byZone).sort((a, b) => b[1].length - a[1].length).map(([zone, ws]) => {
                    const pct = total > 0 ? (ws.length / total) * 100 : 0;
                    return (
                      <div key={zone} className="flex items-center gap-3 group">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 w-28 truncate text-right flex-shrink-0">{zone}</span>
                        <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative min-w-0">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg transition-all flex items-center px-2.5 min-w-0" style={{ width: `${Math.max(pct, 3)}%` }}>
                            <span className="text-[10px] font-bold text-white whitespace-nowrap">{ws.length}</span>
                          </div>
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>)}
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="report-table hidden md:table">
                  <thead><tr><th>Region</th>{showZoneBreakdown && <th>Zone</th>}<th>Workers</th><th>Paid</th><th>Unpaid</th><th>Verified</th><th>Payment %</th></tr></thead>
                  <tbody>
                    {Object.entries(byRegion).sort((a, b) => b[1].length - a[1].length).map(([region, ws]) => {
                      const rp = ws.filter(w => w.paymentStatus === "paid").length;
                      return (
                        <tr key={region}>
                          <td className="font-medium">{region}</td>{showZoneBreakdown && <td>{ws[0]?.zone}</td>}<td>{ws.length}</td>
                          <td><span className="text-emerald-600 font-semibold">{rp}</span></td>
                          <td><span className="text-amber-600 font-semibold">{ws.length - rp}</span></td>
                          <td><span className="text-cyan-600 font-semibold">{ws.filter(w => w.verified).length}</span></td>
                          <td>
                            <div className="flex items-center gap-2"><div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${ws.length > 0 ? (rp / ws.length) * 100 : 0}%` }} /></div><span className="text-[10px] font-bold w-8 text-right">{ws.length > 0 ? ((rp / ws.length) * 100).toFixed(0) : 0}%</span></div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="md:hidden space-y-2 mt-4">
                {Object.entries(byRegion).sort((a, b) => b[1].length - a[1].length).map(([region, ws]) => {
                  const rp = ws.filter(w => w.paymentStatus === "paid").length;
                  return (
                    <div key={region} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold truncate">{region}</span>
                        {showZoneBreakdown && <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{ws[0]?.zone}</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white dark:bg-slate-900 rounded-lg py-1.5"><p className="text-[9px] font-bold text-slate-400 uppercase">Workers</p><p className="text-sm font-black">{ws.length}</p></div>
                        <div className="bg-white dark:bg-slate-900 rounded-lg py-1.5"><p className="text-[9px] font-bold text-emerald-400 uppercase">Paid</p><p className="text-sm font-black text-emerald-600">{rp}</p></div>
                        <div className="bg-white dark:bg-slate-900 rounded-lg py-1.5"><p className="text-[9px] font-bold text-cyan-400 uppercase">Verified</p><p className="text-sm font-black text-cyan-600">{ws.filter(w => w.verified).length}</p></div>
                      </div>
                      <div className="mt-2"><div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${ws.length > 0 ? (rp / ws.length) * 100 : 0}%` }} /></div></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gender Analysis */}
          {reportType === "gender" && (
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" className="dark:stroke-slate-800" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray={`${total > 0 ? (male/total)*100 : 0} 100`} />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ec4899" strokeWidth="3" strokeDasharray={`${total > 0 ? (female/total)*100 : 0} 100`} strokeDashoffset={`-${total > 0 ? (male/total)*100 : 0}`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black kpi-number">{total > 0 ? ((male/total)*100).toFixed(0) : 0}% / {total > 0 ? ((female/total)*100).toFixed(0) : 0}%</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">M / F</span>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-[10px] font-semibold text-slate-500">Male ({male})</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-pink-500" /><span className="text-[10px] font-semibold text-slate-500">Female ({female})</span></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{showZoneBreakdown ? "Gender by Zone" : "Gender Distribution"}</h4>
                  {showZoneBreakdown ? Object.entries(byZone).sort((a, b) => b[1].length - a[1].length).map(([zone, ws]) => {
                    const zMale = ws.filter(w => w.gender === "male").length;
                    const zFemale = ws.filter(w => w.gender === "female").length;
                    const mPct = ws.length > 0 ? (zMale / ws.length) * 100 : 50;
                    return (
                      <div key={zone}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-medium text-slate-500 truncate">{zone}</span>
                          <span className="text-[10px] font-bold text-slate-400">{zMale}M : {zFemale}F</span>
                        </div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                          <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${mPct}%` }} />
                          <div className="h-full bg-pink-500 transition-all duration-700" style={{ width: `${100 - mPct}%` }} />
                        </div>
                      </div>
                    );
                  }) : (
                    <div>
                      <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">Male</span><span className="text-xs font-bold text-indigo-600">{male} ({total > 0 ? ((male/total)*100).toFixed(0) : 0}%)</span></div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-700" style={{ width: `${total > 0 ? (male/total)*100 : 0}%` }} /></div>
                      <div className="flex items-center justify-between mb-1 mt-2"><span className="text-xs font-medium">Female</span><span className="text-xs font-bold text-pink-600">{female} ({total > 0 ? ((female/total)*100).toFixed(0) : 0}%)</span></div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-pink-400 to-pink-600 rounded-full transition-all duration-700" style={{ width: `${total > 0 ? (female/total)*100 : 0}%` }} /></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Daily Report */}
          {reportType === "daily" && (
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-700/30">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Registered</p>
                  <p className="text-3xl font-black kpi-number text-indigo-600 dark:text-indigo-400">{dailyWorkers.length}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-700/30">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Paid</p>
                  <p className="text-3xl font-black kpi-number text-emerald-600 dark:text-emerald-400">{dailyPaid}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10 rounded-xl p-4 border border-cyan-200/50 dark:border-cyan-700/30">
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">Verified</p>
                  <p className="text-3xl font-black kpi-number text-cyan-600 dark:text-cyan-400">{dailyVerified}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="text-center"><p className="text-2xl font-black kpi-number">{dailyMale}</p><p className="text-[10px] font-bold text-blue-400 uppercase">Male</p></div>
                <div className="text-center"><p className="text-2xl font-black kpi-number">{dailyFemale}</p><p className="text-[10px] font-bold text-pink-400 uppercase">Female</p></div>
                <div className="text-center"><p className="text-2xl font-black kpi-number">{dailyWorkers.length > 0 ? ((dailyPaid / dailyWorkers.length) * 100).toFixed(0) : 0}%</p><p className="text-[10px] font-bold text-emerald-400 uppercase">Paid Rate</p></div>
                <div className="text-center"><p className="text-2xl font-black kpi-number">{dailyWorkers.length > 0 ? ((dailyVerified / dailyWorkers.length) * 100).toFixed(0) : 0}%</p><p className="text-[10px] font-bold text-cyan-400 uppercase">Verified</p></div>
              </div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Workers Registered on {new Date(dailyDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h4>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="report-table hidden md:table">
                  <thead><tr><th>#</th><th>Name</th><th>Gender</th><th>Zone</th><th>Region</th><th>Position</th><th>Payment</th><th>Verified</th></tr></thead>
                  <tbody>
                    {dailyWorkers.map((w, i) => (
                      <tr key={w.id}>
                        <td>{i + 1}</td><td className="font-medium">{w.name}</td><td className="capitalize">{w.gender}</td><td>{w.zone}</td><td>{w.region}</td><td>{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</td>
                        <td><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${w.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>{w.paymentStatus}</span></td>
                        <td>{w.verified ? <CheckCircle2 size={14} className="text-emerald-500" /> : <span className="text-slate-300">—</span>}</td>
                      </tr>
                    ))}
                    {dailyWorkers.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-6 text-xs">No workers registered on this date</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-2 mt-4">
                {dailyWorkers.map((w, i) => (
                  <div key={w.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold truncate">{w.name}</span>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${w.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{w.paymentStatus}</span>
                        {w.verified && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-cyan-100 text-cyan-700">Verified</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 text-[10px] text-slate-500">
                      <span>{w.gender === "male" ? "Male" : "Female"}</span><span>{w.zone}</span>
                      <span className="col-span-2">{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</span>
                    </div>
                  </div>
                ))}
                {dailyWorkers.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No workers registered on this date</p>}
              </div>
            </div>
          )}

          {/* Top Positions — shown for registration, daily, and regional (not verifier) */}
          {showZoneBreakdown && (reportType === "registration" || reportType === "daily" || reportType === "regional") && topPositions.length > 0 && (
            <div className="px-5 pb-5">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Top Positions</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {topPositions.map(([pos, count]) => (
                  <div key={pos} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2.5 border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{POSITION_LABELS[pos as keyof typeof POSITION_LABELS] || pos}</p>
                    <p className="text-lg font-black kpi-number">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          PRINT-ONLY — Professional PDF Report
         ════════════════════════════════════════════════════════ */}
      <div className="print-report">
        <div className="report-header">
          <div className="report-header-left">
            <div className="report-logo"><img src="/dclmlogo.JPG" alt="DCLM" /></div>
            <div>
              <h1 className="report-org">Deeper Christian Life Ministry</h1>
              <p className="report-subtitle">Workers Conference 2026 — National Report</p>
            </div>
          </div>
          <div className="report-header-right">
            <p className="report-confidential">CONFIDENTIAL</p>
            <p className="report-date">{dateStr}</p>
            <p className="report-time">{timeStr}</p>
          </div>
        </div>
        <div className="report-title-section">
          <h2 className="report-title">{meta.title}</h2>
          <p className="report-generated">Generated by: {user.displayName} ({user.role?.replace("_", " ")})</p>
        </div>
        <div className="report-divider" />
        <div className="report-summary">
          {reportType === "daily" ? (<>
            <div className="report-stat"><p className="report-stat-label">Date</p><p className="report-stat-value" style={{ fontSize: "11pt" }}>{dailyDate}</p></div>
            <div className="report-stat"><p className="report-stat-label">Registered</p><p className="report-stat-value">{dailyWorkers.length}</p></div>
            <div className="report-stat"><p className="report-stat-label">Paid</p><p className="report-stat-value" style={{ color: "#10b981" }}>{dailyPaid}</p></div>
            <div className="report-stat"><p className="report-stat-label">Verified</p><p className="report-stat-value" style={{ color: "#06b6d4" }}>{dailyVerified}</p></div>
            <div className="report-stat"><p className="report-stat-label">Male</p><p className="report-stat-value" style={{ color: "#6366f1" }}>{dailyMale}</p></div>
            <div className="report-stat"><p className="report-stat-label">Female</p><p className="report-stat-value" style={{ color: "#ec4899" }}>{dailyFemale}</p></div>
          </>) : (<>
            <div className="report-stat"><p className="report-stat-label">Total Workers</p><p className="report-stat-value">{total}</p></div>
            <div className="report-stat"><p className="report-stat-label">Paid</p><p className="report-stat-value" style={{ color: "#10b981" }}>{paid}</p></div>
            <div className="report-stat"><p className="report-stat-label">Unpaid</p><p className="report-stat-value" style={{ color: "#f59e0b" }}>{unpaid}</p></div>
            <div className="report-stat"><p className="report-stat-label">Verified</p><p className="report-stat-value" style={{ color: "#06b6d4" }}>{verified}</p></div>
            <div className="report-stat"><p className="report-stat-label">Male</p><p className="report-stat-value" style={{ color: "#6366f1" }}>{male}</p></div>
            <div className="report-stat"><p className="report-stat-label">Female</p><p className="report-stat-value" style={{ color: "#ec4899" }}>{female}</p></div>
          </>)}
        </div>
        <div className="report-divider" />

        {/* Print: Registration */}
        {reportType === "registration" && (
          <div className="report-section">
            <h3 className="report-section-title">All Registered Workers</h3>
            <table className="report-table">
              <thead><tr><th>#</th><th>Full Name</th><th>Gender</th><th>Zone</th><th>Region</th><th>Division</th><th>Position</th><th>Payment</th><th>Verified</th></tr></thead>
              <tbody>
                {workers.map((w, i) => (
                  <tr key={w.id}><td>{i + 1}</td><td>{w.name}</td><td className="capitalize">{w.gender}</td><td>{w.zone}</td><td>{w.region}</td><td>{w.division}</td><td>{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</td><td className="capitalize">{w.paymentStatus}</td><td>{w.verified ? "Yes" : "No"}</td></tr>
                ))}
                {workers.length === 0 && <tr><td colSpan={9} className="text-center text-slate-400 py-4">No workers registered yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Print: Payment */}
        {reportType === "payment" && (
          <div className="report-section">
            <h3 className="report-section-title">Payment Status Breakdown</h3>
            <table className="report-table">
              <thead><tr><th>Status</th><th>Count</th><th>Percentage</th></tr></thead>
              <tbody>
                <tr><td>Paid</td><td>{paid}</td><td>{total > 0 ? ((paid / total) * 100).toFixed(1) : 0}%</td></tr>
                <tr><td>Unpaid</td><td>{unpaid}</td><td>{total > 0 ? ((unpaid / total) * 100).toFixed(1) : 0}%</td></tr>
                <tr className="report-total"><td>Total</td><td>{total}</td><td>100%</td></tr>
              </tbody>
            </table>
            <h3 className="report-section-title mt-6">Unpaid Workers</h3>
            <table className="report-table">
              <thead><tr><th>#</th><th>Name</th><th>Zone</th><th>Region</th><th>Position</th></tr></thead>
              <tbody>
                {workers.filter(w => w.paymentStatus === "unpaid").map((w, i) => (
                  <tr key={w.id}><td>{i + 1}</td><td>{w.name}</td><td>{w.zone}</td><td>{w.region}</td><td>{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</td></tr>
                ))}
                {unpaid === 0 && <tr><td colSpan={5} className="text-center text-slate-400 py-4">All workers have paid</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Print: Verification */}
        {reportType === "verification" && (
          <div className="report-section">
            <h3 className="report-section-title">Verification Status</h3>
            <table className="report-table">
              <thead><tr><th>Status</th><th>Count</th><th>Percentage</th></tr></thead>
              <tbody>
                <tr><td>Verified</td><td>{verified}</td><td>{total > 0 ? ((verified / total) * 100).toFixed(1) : 0}%</td></tr>
                <tr><td>Pending</td><td>{total - verified}</td><td>{total > 0 ? (((total - verified) / total) * 100).toFixed(1) : 0}%</td></tr>
                <tr className="report-total"><td>Total</td><td>{total}</td><td>100%</td></tr>
              </tbody>
            </table>
            <h3 className="report-section-title mt-6">Pending Verification</h3>
            <table className="report-table">
              <thead><tr><th>#</th><th>Name</th><th>Zone</th><th>Region</th><th>Position</th></tr></thead>
              <tbody>
                {workers.filter(w => !w.verified).map((w, i) => (
                  <tr key={w.id}><td>{i + 1}</td><td>{w.name}</td><td>{w.zone}</td><td>{w.region}</td><td>{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</td></tr>
                ))}
                {verified === total && <tr><td colSpan={5} className="text-center text-slate-400 py-4">All workers verified</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Print: Regional */}
        {reportType === "regional" && (
          <div className="report-section">
            <h3 className="report-section-title">Workers by Zone</h3>
            <table className="report-table">
              <thead><tr><th>Zone</th><th>Workers</th><th>% of Total</th><th>Paid</th><th>Verified</th></tr></thead>
              <tbody>
                {Object.entries(byZone).sort((a, b) => b[1].length - a[1].length).map(([zone, ws]) => (
                  <tr key={zone}><td>{zone}</td><td>{ws.length}</td><td>{total > 0 ? ((ws.length / total) * 100).toFixed(1) : 0}%</td><td>{ws.filter(w => w.paymentStatus === "paid").length}</td><td>{ws.filter(w => w.verified).length}</td></tr>
                ))}
                <tr className="report-total"><td>Total</td><td>{total}</td><td>100%</td><td>{paid}</td><td>{verified}</td></tr>
              </tbody>
            </table>
            <h3 className="report-section-title mt-6">Workers by Region</h3>
            <table className="report-table">
              <thead><tr><th>Region</th><th>Zone</th><th>Workers</th><th>Paid</th><th>Verified</th></tr></thead>
              <tbody>
                {Object.entries(byRegion).sort((a, b) => b[1].length - a[1].length).map(([region, ws]) => (
                  <tr key={region}><td>{region}</td><td>{ws[0]?.zone}</td><td>{ws.length}</td><td>{ws.filter(w => w.paymentStatus === "paid").length}</td><td>{ws.filter(w => w.verified).length}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Print: Gender */}
        {reportType === "gender" && (
          <div className="report-section">
            <h3 className="report-section-title">Gender Distribution</h3>
            <table className="report-table">
              <thead><tr><th>Gender</th><th>Count</th><th>Percentage</th><th>Paid</th><th>Verified</th></tr></thead>
              <tbody>
                <tr><td>Male</td><td>{male}</td><td>{total > 0 ? ((male / total) * 100).toFixed(1) : 0}%</td><td>{workers.filter(w => w.gender === "male" && w.paymentStatus === "paid").length}</td><td>{workers.filter(w => w.gender === "male" && w.verified).length}</td></tr>
                <tr><td>Female</td><td>{female}</td><td>{total > 0 ? ((female / total) * 100).toFixed(1) : 0}%</td><td>{workers.filter(w => w.gender === "female" && w.paymentStatus === "paid").length}</td><td>{workers.filter(w => w.gender === "female" && w.verified).length}</td></tr>
                <tr className="report-total"><td>Total</td><td>{total}</td><td>100%</td><td>{paid}</td><td>{verified}</td></tr>
              </tbody>
            </table>
            <h3 className="report-section-title mt-6">Gender by Zone</h3>
            <table className="report-table">
              <thead><tr><th>Zone</th><th>Male</th><th>Female</th><th>Ratio (M:F)</th></tr></thead>
              <tbody>
                {Object.entries(byZone).sort((a, b) => b[1].length - a[1].length).map(([zone, ws]) => {
                  const zMale = ws.filter(w => w.gender === "male").length;
                  const zFemale = ws.filter(w => w.gender === "female").length;
                  return <tr key={zone}><td>{zone}</td><td>{zMale}</td><td>{zFemale}</td><td>{zFemale > 0 ? (zMale / zFemale).toFixed(1) : "—"}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Print: Daily */}
        {reportType === "daily" && (
          <div className="report-section">
            <h3 className="report-section-title">Workers Registered on {dailyDate}</h3>
            <table className="report-table">
              <thead><tr><th>#</th><th>Name</th><th>Gender</th><th>Zone</th><th>Region</th><th>Position</th><th>Payment</th><th>Verified</th></tr></thead>
              <tbody>
                {dailyWorkers.map((w, i) => (
                  <tr key={w.id}><td>{i + 1}</td><td>{w.name}</td><td className="capitalize">{w.gender}</td><td>{w.zone}</td><td>{w.region}</td><td>{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</td><td className="capitalize">{w.paymentStatus}</td><td>{w.verified ? "Yes" : "No"}</td></tr>
                ))}
                {dailyWorkers.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-4">No workers registered on this date</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Print Footer */}
        <div className="report-footer">
          <div className="report-divider" />
          <div className="report-footer-content">
            <p>Generated by: <strong>Workers Conference Management System</strong></p>
            <p>Deeper Christian Life Ministry — {dateStr} at {timeStr}</p>
            <p className="report-confidential-footer">This document is confidential. Unauthorized distribution is prohibited.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   OVERVIEW — Premium Analytics Dashboard
   ══════════════════════════════════════════════════════════════ */
function OverviewSection({ user }: { user: any }) {
  const { data } = useQuery({ queryKey: ["workers"], queryFn: async () => fetch("/api/auth/workers").then(r => r.json()) });
  const workers: any[] = data?.workers || [];
  const [filters, setFilters] = useState({ zone: "", region: "", position: "", payment: "" });

  const filteredWorkers = useMemo(() => {
    return workers.filter((w: any) => {
      if (filters.zone && w.zone !== filters.zone) return false;
      if (filters.region && w.region !== filters.region) return false;
      if (filters.position && w.position !== filters.position) return false;
      if (filters.payment && w.paymentStatus !== filters.payment) return false;
      return true;
    });
  }, [workers, filters]);

  const stats = useMemo(() => {
    const total = filteredWorkers.length;
    const paid = filteredWorkers.filter(w => w.paymentStatus === "paid");
    const unpaid = filteredWorkers.filter(w => w.paymentStatus === "unpaid");
    const verified = filteredWorkers.filter(w => w.verified);
    const male = filteredWorkers.filter(w => w.gender === "male");
    const female = filteredWorkers.filter(w => w.gender === "female");

    const paidMale = paid.filter(w => w.gender === "male").length;
    const paidFemale = paid.filter(w => w.gender === "female").length;
    const unpaidMale = unpaid.filter(w => w.gender === "male").length;
    const unpaidFemale = unpaid.filter(w => w.gender === "female").length;

    // By zone
    const byZone: Record<string, number> = {};
    filteredWorkers.forEach(w => { byZone[w.zone] = (byZone[w.zone] || 0) + 1; });

    // By region (top 10)
    const byRegion: Record<string, number> = {};
    filteredWorkers.forEach(w => { byRegion[w.region] = (byRegion[w.region] || 0) + 1; });
    const topRegions = Object.entries(byRegion).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

    // By position
    const byPosition: Record<string, number> = {};
    filteredWorkers.forEach(w => { byPosition[w.position] = (byPosition[w.position] || 0) + 1; });
    const positionData = Object.entries(byPosition).map(([key, value]) => ({ name: POSITION_LABELS[key as keyof typeof POSITION_LABELS] || key, value }));

    // By division (top 8)
    const byDivision: Record<string, number> = {};
    filteredWorkers.forEach(w => { byDivision[w.division] = (byDivision[w.division] || 0) + 1; });
    const topDivisions = Object.entries(byDivision).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));

    // Verified by day (last 7 days)
    const dayMap: Record<string, Record<string, number>> = {};
    const days = 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dayMap[key] = {};
      Object.keys(byRegion).forEach(r => dayMap[key][r] = 0);
    }
    verified.forEach(w => {
      const d = new Date(w.createdAt);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dayMap[key]) dayMap[key][w.region] = (dayMap[key][w.region] || 0) + 1;
    });
    const chartData = Object.entries(dayMap).map(([day, regions]) => ({ day, ...regions }));
    const topRegionNames = Object.entries(byRegion).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([r]) => r);

    // Gender pie
    const genderPie = [
      { name: "Male", value: male.length, color: "#6366f1" },
      { name: "Female", value: female.length, color: "#ec4899" },
    ];

    // Payment pie
    const paymentPie = [
      { name: "Paid", value: paid.length, color: "#10b981" },
      { name: "Unpaid", value: unpaid.length, color: "#f59e0b" },
    ];

    // Verification rate
    const verificationRate = total > 0 ? ((verified.length / total) * 100).toFixed(1) : "0";

    // Zone distribution pie
    const zonePie = Object.entries(byZone).map(([name, value]) => ({ name: name.replace(" Zone", ""), value }));

    // Average per region
    const regionCount = Object.keys(byRegion).length;
    const avgPerRegion = regionCount > 0 ? (total / regionCount).toFixed(1) : "0";

    // Gender pay gap analysis
    const paidRate = total > 0 ? ((paid.length / total) * 100).toFixed(1) : "0";

    return {
      total, paid: paid.length, unpaid: unpaid.length, verified: verified.length,
      male: male.length, female: female.length,
      paidMale, paidFemale, unpaidMale, unpaidFemale,
      topRegions, positionData, topDivisions,
      chartData, topRegionNames,
      genderPie, paymentPie, zonePie,
      verificationRate, avgPerRegion, paidRate, regionCount,
    };
  }, [filteredWorkers]);

  return (
    <div className="space-y-5">
      {/* ── Power BI Slicer Bar ── */}
      <SlicerBar filters={filters} setFilters={setFilters} workers={workers} />

      {/* ── Power BI KPI Banner ── */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 elevation-1 overflow-hidden">
        <div className="relative bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#3949ab] px-4 sm:px-6 py-5 noise-overlay overflow-hidden">
          <div className="blob absolute -top-20 -right-20 h-40 w-40 bg-indigo-400/30" />
          <div className="blob absolute -bottom-10 -left-10 h-32 w-32 bg-violet-400/20" style={{ animationDelay: "4s" }} />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl overflow-hidden ring-2 ring-white/20"><img src="/dclmlogo.JPG" alt="Logo" className="h-full w-full object-cover" /></div>
                <p className="text-[10px] font-semibold text-indigo-200 uppercase tracking-widest">Workers Conference</p>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1.5 tracking-premium">Registration Analytics — 2026</h2>
              <p className="text-[11px] sm:text-xs text-indigo-200/80 mt-0.5">Welcome, {user.displayName} &middot; <span className="capitalize">{user.role?.replace("_", " ")}</span></p>
            </div>
            <div className="flex sm:hidden items-center gap-4 text-right">
              <div><p className="text-2xl kpi-number text-white">{stats.total}</p><p className="text-[10px] text-indigo-200 uppercase tracking-wider">Total</p></div>
              <div className="h-8 w-px bg-white/20" />
              <div><p className="text-2xl kpi-number text-emerald-300">{stats.verificationRate}%</p><p className="text-[10px] text-indigo-200 uppercase tracking-wider">Verified</p></div>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-right">
              <div><p className="text-3xl kpi-number text-white">{stats.total}</p><p className="text-[10px] text-indigo-200 uppercase tracking-wider">Total Registered</p></div>
              <div className="h-10 w-px bg-white/20" />
              <div><p className="text-3xl kpi-number text-emerald-300">{stats.verificationRate}%</p><p className="text-[10px] text-indigo-200 uppercase tracking-wider">Verified</p></div>
            </div>
          </div>
        </div>
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-slate-100 dark:bg-slate-800/50">
          <KPIBlock label="Registered" value={stats.total} sub={`${stats.male}M / ${stats.female}F`} color="#6366f1" />
          <KPIBlock label="Paid" value={stats.paid} sub={`${stats.paidRate}% collection`} color="#10b981" delta={Number(stats.paidRate) > 50 ? "+" : "-"} />
          <KPIBlock label="Unpaid" value={stats.unpaid} sub={`${(100 - Number(stats.paidRate)).toFixed(1)}% outstanding`} color="#f59e0b" />
          <KPIBlock label="Verified" value={stats.verified} sub={`${stats.verificationRate}% of total`} color="#06b6d4" />
          <KPIBlock label="Regions" value={stats.regionCount} sub={`${stats.avgPerRegion} avg/region`} color="#8b5cf6" />
        </div>
        {/* Goal Progress Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-slate-100 dark:bg-slate-800/50">
          <GoalProgress label="Registration Goal" current={stats.total} target={Math.max(stats.total * 1.5, 100)} color="#6366f1" />
          <GoalProgress label="Payment Target" current={stats.paid} target={stats.total || 100} color="#10b981" />
          <GoalProgress label="Verification Target" current={stats.verified} target={stats.total || 100} color="#06b6d4" />
          <GoalProgress label="Male Target" current={stats.male} target={Math.max(Math.round(stats.total * 0.55), 1)} color="#8b5cf6" />
          <GoalProgress label="Female Target" current={stats.female} target={Math.max(Math.round(stats.total * 0.45), 1)} color="#ec4899" />
        </div>
      </div>

      {/* ── Metric Cards — Power BI Card Visual ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <PBICard
          title="Total Registered"
          value={stats.total}
          trend={stats.total > 0 ? `${stats.male}M · ${stats.female}F` : ""}
          trendUp={stats.male >= stats.female}
          male={stats.male}
          female={stats.female}
          accent="#6366f1"
          sparkData={[stats.male * 0.3, stats.male * 0.5, stats.male * 0.7, stats.male * 0.85, stats.male, stats.total]}
        />
        <PBICard
          title="Workers Paid"
          value={stats.paid}
          trend={stats.total > 0 ? `${stats.paidRate}% of total` : ""}
          trendUp={Number(stats.paidRate) > 50}
          male={stats.paidMale}
          female={stats.paidFemale}
          accent="#10b981"
          sparkData={[stats.paid * 0.2, stats.paid * 0.4, stats.paid * 0.6, stats.paid * 0.8, stats.paid]}
        />
        <PBICard
          title="Workers Unpaid"
          value={stats.unpaid}
          trend={stats.total > 0 ? `${(100 - Number(stats.paidRate)).toFixed(0)}% outstanding` : ""}
          trendUp={false}
          male={stats.unpaidMale}
          female={stats.unpaidFemale}
          accent="#f59e0b"
          sparkData={[stats.unpaid, stats.unpaid * 0.9, stats.unpaid * 0.7, stats.unpaid * 0.5, stats.unpaid]}
        />
        <PBICard
          title="Verified"
          value={stats.verified}
          trend={stats.total > 0 ? `${stats.verificationRate}% verified` : ""}
          trendUp={Number(stats.verificationRate) > 50}
          male={stats.verified}
          female={0}
          accent="#06b6d4"
          sparkData={[stats.verified * 0.1, stats.verified * 0.3, stats.verified * 0.6, stats.verified * 0.9, stats.verified]}
        />
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-premium overflow-hidden">
          <div className="px-4 sm:px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Area Chart</p>
                <h3 className="font-semibold text-sm mt-0.5 tracking-premium">Verified by Region — 7 Days</h3>
              </div>
              <span className="text-[10px] bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-2.5 py-1 rounded-full font-semibold hidden sm:inline shadow-sm">STACKED</span>
            </div>
          </div>
          <div className="p-3 sm:p-4 h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  {stats.topRegionNames.map((r, i) => (
                    <linearGradient key={r} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.05} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", backdropFilter: "blur(12px)" }} />
                {stats.topRegionNames.map((r, i) => (
                  <Area key={r} type="monotone" dataKey={r} stackId="1" stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={`url(#grad-${i})`} strokeWidth={2} />
                ))}
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-premium overflow-hidden">
          <div className="px-4 sm:px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Gender Breakdown</p>
            <h3 className="font-semibold text-sm mt-0.5 tracking-premium">Male vs Female</h3>
          </div>
          <div className="p-4 sm:p-5">
            {/* Male Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Male</span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{stats.male} — {stats.total > 0 ? ((stats.male / stats.total) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="h-8 sm:h-7 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-700 ease-out flex items-center justify-end px-2.5"
                  style={{
                    width: `${stats.total > 0 ? Math.max((stats.male / stats.total) * 100, stats.male > 0 ? 8 : 0) : 0}%`,
                    background: "linear-gradient(90deg, #6366f1, #818cf8)",
                  }}
                >
                  {stats.male > 0 && <span className="text-[11px] font-bold text-white drop-shadow-sm whitespace-nowrap">{stats.male}</span>}
                </div>
              </div>
            </div>
            {/* Female Bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Female</span>
                <span className="text-xs font-bold text-pink-600 dark:text-pink-400">{stats.female} — {stats.total > 0 ? ((stats.female / stats.total) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="h-8 sm:h-7 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-700 ease-out flex items-center justify-end px-2.5"
                  style={{
                    width: `${stats.total > 0 ? Math.max((stats.female / stats.total) * 100, stats.female > 0 ? 8 : 0) : 0}%`,
                    background: "linear-gradient(90deg, #ec4899, #f472b6)",
                  }}
                >
                  {stats.female > 0 && <span className="text-[11px] font-bold text-white drop-shadow-sm whitespace-nowrap">{stats.female}</span>}
                </div>
              </div>
            </div>
            {/* Summary Row */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 px-1.5 sm:px-2 py-2 text-center">
                <p className="text-[9px] sm:text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">M:F</p>
                <p className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-300 mt-0.5">{stats.female > 0 ? (stats.male / stats.female).toFixed(1) : "—"}:1</p>
              </div>
              <div className="rounded-lg bg-pink-50 dark:bg-pink-950/30 px-1.5 sm:px-2 py-2 text-center">
                <p className="text-[9px] sm:text-[10px] font-semibold text-pink-400 uppercase tracking-wider">Female</p>
                <p className="text-base sm:text-lg font-black text-pink-600 dark:text-pink-300 mt-0.5">{stats.total > 0 ? ((stats.female / stats.total) * 100).toFixed(1) : 0}%</p>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-1.5 sm:px-2 py-2 text-center">
                <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Gap</p>
                <p className="text-base sm:text-lg font-black text-slate-600 dark:text-slate-300 mt-0.5">{Math.abs(stats.male - stats.female)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card-premium overflow-hidden">
          <div className="px-4 sm:px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Bar Chart</p>
            <h3 className="font-semibold text-sm mt-0.5 tracking-premium">Workers by Region</h3>
          </div>
          <div className="p-3 sm:p-4 h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topRegions} layout="vertical" margin={{ left: 5, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", backdropFilter: "blur(12px)" }} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                  {stats.topRegions.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Data Label Summary */}
          {stats.topRegions.length > 0 && (
            <div className="px-4 sm:px-5 pb-3 flex items-center gap-3 text-[10px]">
              <span className="text-slate-400">Top:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{stats.topRegions[0]?.name}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-slate-400">Total regions:</span>
              <span className="font-semibold">{stats.regionCount}</span>
            </div>
          )}
        </div>

        <div className="card-premium overflow-hidden">
          <div className="px-4 sm:px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Donut Chart</p>
            <h3 className="font-semibold text-sm mt-0.5 tracking-premium">Payment Status</h3>
          </div>
          <div className="p-3 sm:p-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={stats.paymentPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {stats.paymentPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, backdropFilter: "blur(12px)" }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 sm:gap-5 mt-1 text-[11px] sm:text-xs">
              <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#10b981" }} /> Paid: {stats.paid}</span>
              <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#f59e0b" }} /> Unpaid: {stats.unpaid}</span>
            </div>
            <div className="mt-3 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Collection Rate</p>
              <p className="text-lg font-bold text-emerald-600 kpi-number">{stats.paidRate}%</p>
            </div>
          </div>
        </div>

        <div className="card-premium overflow-hidden">
          <div className="px-4 sm:px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Column Chart</p>
            <h3 className="font-semibold text-sm mt-0.5 tracking-premium">By Position</h3>
          </div>
          <div className="p-3 sm:p-4 h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.positionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} angle={-25} textAnchor="end" height={55} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", backdropFilter: "blur(12px)" }} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={24}>
                  {stats.positionData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Power BI Analytical Insights ── */}
      <div className="card-premium overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center shadow-sm"><BarChart3 size={14} className="text-white" /></div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">AI-Powered Insights</p>
            <h3 className="font-semibold text-sm tracking-premium">Advanced Analytics</h3>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <InsightCard
              icon={<BarChart3 size={14} />}
              title="Regional Coverage"
              value={`${stats.regionCount}`}
              unit="regions"
              detail={`${stats.avgPerRegion} avg workers per region`}
              trend={Number(stats.avgPerRegion) > 10 ? "up" : "down"}
              insight={stats.total > 0 ? `Top region: ${stats.topRegions[0]?.name} contributes ${((stats.topRegions[0]?.count / stats.total) * 100).toFixed(1)}% of all registrations. Consider increasing outreach in underrepresented regions.` : "No data yet."}
              accent="#6366f1"
            />
            <InsightCard
              icon={<DollarSign size={14} />}
              title="Payment Efficiency"
              value={stats.paidRate}
              unit="%"
              detail={`${stats.paid} of ${stats.total} workers paid`}
              trend={Number(stats.paidRate) > 60 ? "up" : "down"}
              insight={stats.unpaid > stats.paid ? `Payment gap: ${stats.unpaid - stats.paid} more unpaid than paid. Target follow-up in ${stats.topRegions[0]?.name}.` : `Strong collection at ${stats.paidRate}%. Only ${stats.unpaid} outstanding.`}
              accent="#10b981"
            />
            <InsightCard
              icon={<Activity size={14} />}
              title="Gender Balance"
              value={stats.female > 0 ? (stats.male / stats.female).toFixed(1) : "—"}
              unit=":1 M/F"
              detail={`${stats.male} male, ${stats.female} female`}
              trend={stats.female > stats.male * 0.4 ? "up" : "down"}
              insight={stats.female < stats.male * 0.3 ? `Significant gender gap. Female participation at ${((stats.female / Math.max(stats.total, 1)) * 100).toFixed(1)}%. Recommend targeted outreach.` : `Balanced participation. Female share: ${((stats.female / Math.max(stats.total, 1)) * 100).toFixed(1)}%.`}
              accent="#ec4899"
            />
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Zone Distribution</p>
              <div className="space-y-2.5">
                {stats.zonePie.map((z, i) => (
                  <div key={z.name} className="flex items-center gap-3 text-xs">
                    <span className="w-28 truncate text-slate-600 dark:text-slate-400 font-medium">{z.name}</span>
                    <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stats.total > 0 ? (z.value / stats.total) * 100 : 0}%`, background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})` }} />
                    </div>
                    <span className="w-10 text-right font-bold text-slate-700 dark:text-slate-300">{z.value}</span>
                    <span className="w-12 text-right text-slate-400 text-[10px]">{stats.total > 0 ? ((z.value / stats.total) * 100).toFixed(0) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Top Divisions</p>
              <div className="space-y-2.5">
                {stats.topDivisions.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-3 text-xs">
                    <span className="w-5 h-5 rounded-full grid place-items-center text-[9px] font-bold" style={{ background: CHART_COLORS[i % CHART_COLORS.length] + "18", color: CHART_COLORS[i % CHART_COLORS.length] }}>{i + 1}</span>
                    <span className="w-28 truncate text-slate-600 dark:text-slate-400 font-medium">{d.name}</span>
                    <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stats.total > 0 ? (d.count / stats.total) * 100 : 0}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                    <span className="w-10 text-right font-bold text-slate-700 dark:text-slate-300">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Power BI KPI Block ── */
function KPIBlock({ label, value, sub, color, delta }: { label: string; value: number; sub: string; color: string; delta?: string }) {
  return (
    <div className="px-4 py-4 sm:px-5 bg-white dark:bg-slate-900 relative group">
      <div className="absolute left-0 top-0 h-full w-[3px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: color }} />
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl mt-0.5 kpi-number" style={{ color }}>{value}</p>
      <div className="flex items-center gap-1 mt-0.5">
        {delta && <span className={`text-[10px] font-bold ${delta === "+" ? "text-emerald-500" : "text-amber-500"}`}>{delta}</span>}
        <p className="text-[10px] text-slate-400">{sub}</p>
      </div>
    </div>
  );
}

/* ── Power BI Card Visual ── */
function PBICard({ title, value, trend, trendUp, male, female, accent, sparkData }: { title: string; value: number; trend: string; trendUp: boolean; male: number; female: number; accent: string; sparkData: number[] }) {
  const max = Math.max(...sparkData, 1);
  const points = sparkData.map((v, i) => `${(i / (sparkData.length - 1)) * 100},${100 - (v / max) * 80}`).join(" ");
  const total = male + female;
  return (
    <div className="card-premium p-4 sm:p-5 relative overflow-hidden group">
      <DrillIndicator />
      <div className="accent-bar" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{title}</p>
          <p className="text-2xl sm:text-3xl mt-1 kpi-number" style={{ color: accent }}>{value}</p>
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${trendUp ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600" : "bg-amber-50 dark:bg-amber-950/30 text-amber-600"}`}>
            {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend}
          </div>
        )}
      </div>
      {/* Gender Bar */}
      {total > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm" style={{ background: "#6366f1" }} />M</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm" style={{ background: "#ec4899" }} />F</span>
            </span>
            <span className="tabular-nums">{male} / {female}</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div className="h-full rounded-l-full transition-all duration-500" style={{ width: `${(male / total) * 100}%`, background: "linear-gradient(90deg, #6366f1, #818cf8)" }} />
            <div className="h-full rounded-r-full transition-all duration-500" style={{ width: `${(female / total) * 100}%`, background: "linear-gradient(90deg, #ec4899, #f472b6)" }} />
          </div>
        </div>
      )}
      {/* Mini sparkline */}
      <div className="mt-2.5 h-6 w-full opacity-60 group-hover:opacity-100 transition-opacity">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id={`spark-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.3} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={`0,100 ${points} 100,100`} fill={`url(#spark-${title})`} />
          <polyline points={points} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

/* ── Insight Card ── */
function InsightCard({ icon, title, value, unit, detail, trend, insight, accent }: { icon: React.ReactNode; title: string; value: string | number; unit: string; detail: string; trend: "up" | "down"; insight: string; accent: string }) {
  return (
    <div className="card-premium p-4 relative overflow-hidden group">
      <div className="accent-bar" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl grid place-items-center transition-transform group-hover:scale-110" style={{ background: accent + "15", color: accent }}>{icon}</div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{title}</p>
        </div>
        {trend === "up" ? <TrendingUp size={13} className="text-emerald-500" /> : <TrendingDown size={13} className="text-amber-500" />}
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-2xl kpi-number" style={{ color: accent }}>{value}</p>
        <span className="text-xs text-slate-400 font-medium">{unit}</span>
      </div>
      <p className="text-[11px] text-slate-400 mt-0.5">{detail}</p>
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{insight}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   USER MANAGEMENT
   ══════════════════════════════════════════════════════════════ */
function UserManagementSection() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", username: "", displayName: "", role: "regional_officer" as RoleType, zone: "", region: "" });
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: async () => fetch("/api/auth/users").then(r => r.json()) });

  const createUser = useMutation({
    mutationFn: async (f: typeof form) => { const r = await fetch("/api/auth/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; },
    onSuccess: (j) => { setTempPw(j.tempPassword); qc.invalidateQueries({ queryKey: ["users"] }); setError(null); },
    onError: (e: any) => setError(e.message),
  });
  const toggleActive = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: string }) => fetch("/api/auth/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
  const resetPassword = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const r = await fetch("/api/auth/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: "reset_password", newPassword }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      return j;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setResetSuccess(resetTarget?.name || "User"); setResetError(null); setNewPassword(""); setTimeout(() => { setResetTarget(null); setResetSuccess(null); }, 2500); },
    onError: (e: any) => { setResetError(e.message); setResetSuccess(null); },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">All Users ({data?.users?.length || 0})</h3>
        <Button onClick={() => { setShowCreate(true); setTempPw(null); setError(null); }} className="gap-1.5"><UserPlus size={16} /> Create User</Button>
      </div>
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between"><h4 className="font-semibold">Create New User</h4><button onClick={() => setShowCreate(false)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-slate-100"><X size={14} /></button></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="user@dclm.org" /></div>
                  <div><Label>Username</Label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="username" /></div>
                  <div><Label>Full Name</Label><Input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} placeholder="John Doe" /></div>
                  <div><Label>Role</Label>
                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as RoleType, zone: "", region: "" })} className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                       <option value="regional_officer">Regional Officer</option><option value="verifier">Verifier</option><option value="viewer">Viewer</option><option value="national_officer">National Officer</option><option value="super_admin">Super Administrator</option>
                    </select>
                  </div>
                  {(form.role === "regional_officer" || form.role === "verifier") && (
                    <>
                      <div><Label>Zone</Label>
                        <select value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value, region: "" })} className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                          <option value="">Select zone</option>
                          {Object.keys(ZONE_STRUCTURE).map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                      </div>
                      <div><Label>Region</Label>
                        <select value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} disabled={!form.zone} className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 disabled:opacity-50">
                          <option value="">{form.zone ? "Select region" : "Select zone first"}</option>
                          {form.zone && Object.keys(ZONE_STRUCTURE[form.zone] || {}).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
                {tempPw && (
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 p-4">
                    <p className="text-sm font-semibold text-emerald-800">User created! Temporary password:</p>
                    <div className="mt-2 flex items-center gap-2"><code className="bg-white dark:bg-slate-800 border px-3 py-1.5 rounded-lg text-sm font-mono">{tempPw}</code><Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(tempPw)}>Copy</Button></div>
                    <p className="text-xs text-emerald-700 mt-2">User must change this on first login.</p>
                  </div>
                )}
                <Button loading={createUser.isPending} onClick={() => createUser.mutate(form)} disabled={!form.email || !form.username || !form.displayName}><Plus size={16} /> Create User</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      {isLoading ? <div className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden space-y-3">
            {data?.users?.map((u: any) => (
              <div key={u.id} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{u.displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                  </div>
                  {u.isActive ? <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">Active</span> : <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600">Inactive</span>}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{u.role?.replace("_", " ")}</span>
                  {(u.zone || u.region) && <span className="text-[10px] text-slate-400">{[u.zone, u.region].filter(Boolean).join(" › ")}</span>}
                  {u.isTempPassword && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">Temp password pending</span>}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => { setResetTarget({ id: u.id, name: u.displayName }); setResetError(null); setResetSuccess(null); setNewPassword(""); }} className="flex-1 min-h-[36px] py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 inline-flex items-center justify-center gap-1.5"><Key size={12} /> Reset Password</button>
                  <button onClick={() => toggleActive.mutate({ userId: u.id, action: u.isActive ? "deactivate" : "activate" })} className={`flex-1 min-h-[36px] py-1.5 rounded-lg text-xs font-semibold ${u.isActive ? "bg-slate-100 dark:bg-slate-800 text-slate-500" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"}`}>{u.isActive ? "Deactivate" : "Activate"}</button>
                </div>
              </div>
            ))}
            {data?.users?.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-sm text-slate-400">No users found.</div>
            )}
          </div>
          {/* Desktop: table */}
          <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="text-left text-slate-500 bg-slate-50 dark:bg-slate-800"><tr><th className="px-4 py-3">Name</th><th>Email</th><th>Role</th><th>Zone</th><th>Region</th><th>Temp Pw</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody className="divide-y">
                {data?.users?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium">{u.displayName}</td><td className="text-slate-500">{u.email}</td>
                    <td><span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{u.role?.replace("_", " ")}</span></td>
                    <td className="text-slate-500 text-xs">{u.zone || "—"}</td>
                    <td className="text-slate-500 text-xs">{u.region || "—"}</td>
                    <td>{u.isTempPassword ? <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">Pending</span> : <span className="text-xs text-slate-400">Changed</span>}</td>
                    <td>{u.isActive ? <span className="text-emerald-600 text-xs font-medium">Active</span> : <span className="text-red-600 text-xs font-medium">Inactive</span>}</td>
                    <td className="text-right"><div className="flex items-center justify-end gap-1">
                      <button title="Reset Password" onClick={() => { setResetTarget({ id: u.id, name: u.displayName }); setResetError(null); setResetSuccess(null); setNewPassword(""); }} className="h-7 w-7 grid place-items-center rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></button>
                      <button onClick={() => toggleActive.mutate({ userId: u.id, action: u.isActive ? "deactivate" : "activate" })} className="h-7 w-7 grid place-items-center rounded-md hover:bg-slate-100">{u.isActive ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} className="text-red-500" />}</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {/* Reset Password Modal */}
      <AnimatePresence>
        {resetTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm" onClick={() => { if (!resetPassword.isPending) { setResetTarget(null); setResetError(null); setResetSuccess(null); } }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 grid place-items-center text-amber-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Reset Password</h4>
                    <p className="text-[11px] text-slate-400">for {resetTarget.name}</p>
                  </div>
                </div>
                <button onClick={() => { if (!resetPassword.isPending) { setResetTarget(null); setResetError(null); setResetSuccess(null); } }} className="h-7 w-7 grid place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={14} /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                {resetSuccess ? (
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
                    <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2" />
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Password Reset Successfully</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{resetTarget.name}&apos;s password has been updated. They will need to use the new password on next login.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label>New Password</Label>
                      <Input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setResetError(null); }} placeholder="Minimum 12 characters" className="mt-1.5" autoFocus />
                      {newPassword.length > 0 && newPassword.length < 12 && (
                        <p className="text-[10px] text-amber-600 mt-1">{12 - newPassword.length} more characters needed</p>
                      )}
                    </div>
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-3">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password Requirements</p>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <span className={newPassword.length >= 12 ? "text-emerald-600" : "text-slate-400"}>{newPassword.length >= 12 ? "✓" : "○"} 12+ characters</span>
                        <span className={/[A-Z]/.test(newPassword) ? "text-emerald-600" : "text-slate-400"}>{/[A-Z]/.test(newPassword) ? "✓" : "○"} Uppercase letter</span>
                        <span className={/[a-z]/.test(newPassword) ? "text-emerald-600" : "text-slate-400"}>{/[a-z]/.test(newPassword) ? "✓" : "○"} Lowercase letter</span>
                        <span className={/[0-9]/.test(newPassword) ? "text-emerald-600" : "text-slate-400"}>{/[0-9]/.test(newPassword) ? "✓" : "○"} Number</span>
                        <span className={/[^A-Za-z0-9]/.test(newPassword) ? "text-emerald-600 col-span-2" : "text-slate-400 col-span-2"}>{/[^A-Za-z0-9]/.test(newPassword) ? "✓" : "○"} Special character</span>
                      </div>
                    </div>
                    {resetError && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-xl px-3 py-2">{resetError}</p>}
                  </>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                {!resetSuccess && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { setResetTarget(null); setResetError(null); }} disabled={resetPassword.isPending}>Cancel</Button>
                    <Button size="sm" loading={resetPassword.isPending} disabled={!newPassword || newPassword.length < 12} onClick={() => resetPassword.mutate({ userId: resetTarget.id, newPassword })} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"><Key size={13} /> Reset Password</Button>
                  </>
                )}
                {resetSuccess && <Button size="sm" onClick={() => { setResetTarget(null); setResetSuccess(null); }}>Done</Button>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FormSelect({ icon: Icon, label, value, onChange, disabled, placeholder, children, required }: {
  icon: any;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  placeholder: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <Label>{label}{required && " *"}</Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none z-10">
          <Icon size={16} />
        </div>
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 disabled:opacity-50 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
        >
          <option value="" disabled>{placeholder}</option>
          {children}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   WORKER REGISTRATION
   ══════════════════════════════════════════════════════════════ */
function WorkerRegistrationSection({ user }: { user: any }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showCleanup, setShowCleanup] = useState(false);
  const [cleanupCount, setCleanupCount] = useState<number | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<{ headers: string[]; rows: any[] } | null>(null);
  const [bulkErrors, setBulkErrors] = useState<{ row: number; message: string }[] | null>(null);
  const [bulkResult, setBulkResult] = useState<{ created: number; errors: { row: number; message: string }[]; total: number } | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [zone, setZone] = useState(""); const [region, setRegion] = useState(""); const [division, setDivision] = useState("");
  const [name, setName] = useState(""); const [gender, setGender] = useState<"male" | "female">("male");
  const [position, setPosition] = useState<any>("adult_worker"); const [paymentStatus, setPaymentStatus] = useState<any>("unpaid");
  const [error, setError] = useState<string | null>(null); const [success, setSuccess] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["workers"], queryFn: async () => fetch("/api/auth/workers").then(r => r.json()) });
  const zones = Object.keys(ZONE_STRUCTURE);
  const regions = zone ? Object.keys(ZONE_STRUCTURE[zone] || {}) : [];
  const divisions = zone && region ? ZONE_STRUCTURE[zone]?.[region] || [] : [];

  const createWorker = useMutation({
    mutationFn: async () => { const r = await fetch("/api/auth/workers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, gender, zone, region, division, position, paymentStatus }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workers"] }); setSuccess(`"${name}" registered`); setName(""); setZone(""); setRegion(""); setDivision(""); setError(null); setTimeout(() => setSuccess(null), 3000); },
    onError: (e: any) => setError(e.message),
  });
  const deleteWorker = useMutation({ mutationFn: async (id: string) => fetch("/api/auth/workers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workerId: id, action: "delete" }) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["workers"] }) });
  const toggleVerify = useMutation({ mutationFn: async (id: string) => fetch("/api/auth/workers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workerId: id, action: "toggleVerified" }) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["workers"] }) });

  function parseCSV(text: string) {
    const lines = text.trim().split(/\r?\n/).filter((l: string) => l.trim());
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].split(",").map((h: string) => h.trim());
    const rows = lines.slice(1).map((line: string) => {
      const values = line.split(",").map((v: string) => v.trim());
      const obj: any = {};
      headers.forEach((h: string, i: number) => { obj[h] = values[i] || ""; });
      return obj;
    });
    return { headers, rows };
  }

  function handleBulkFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);
    setBulkResult(null);
    setBulkErrors(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setBulkPreview(parsed);
    };
    reader.readAsText(file);
  }

  function handleBulkUpload() {
    if (!bulkPreview?.rows.length) return;
    setBulkUploading(true);
    fetch("/api/auth/workers/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: bulkPreview.rows }) })
      .then(r => r.json())
      .then(j => {
        setBulkResult(j);
        if (j.created > 0) qc.invalidateQueries({ queryKey: ["workers"] });
      })
      .catch(() => setBulkErrors([{ row: 0, message: "Upload failed" }]))
      .finally(() => setBulkUploading(false));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="font-semibold">Registered Workers ({data?.workers?.length || 0})</h3>
        <div className="flex flex-wrap items-center gap-2">
          {user.role !== "verifier" && (isAdmin(user.role as RoleType) || user.role === "national_officer") && (
            <a href="/api/auth/workers/export" download className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><Download size={14} /> Export CSV</a>
          )}
          {user.role !== "verifier" && (
            <Button variant="outline" size="sm" onClick={() => { setShowBulk(!showBulk); setShowForm(false); setBulkPreview(null); setBulkResult(null); setBulkErrors(null); setBulkFile(null); }} className="gap-1.5"><Upload size={14} /> Bulk Upload</Button>
          )}
          {user.role !== "verifier" && (isAdmin(user.role as RoleType) || user.role === "national_officer") && data?.workers?.some((w: any) => w.registeredByName === "Bulk Import") && (
            <Button variant="outline" size="sm" onClick={() => setShowCleanup(!showCleanup)} className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/20"><AlertTriangle size={14} /> Clean Up</Button>
          )}
          <Button onClick={() => { setShowForm(true); setShowBulk(false); setError(null); setSuccess(null); }} className="gap-1.5"><UserPlus size={14} /> Register Worker</Button>
        </div>
      </div>
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/20 dark:to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 grid place-items-center"><UserPlus size={18} className="text-indigo-600 dark:text-indigo-400" /></div>
                  <div><h4 className="font-semibold text-sm">Register New Worker</h4><p className="text-[11px] text-slate-400">Fill in the worker details below</p></div>
                </div>
                <button onClick={() => setShowForm(false)} className="h-7 w-7 grid place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={14} /></button>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-5">
                {/* ── Personal Info ── */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5"><User size={12} /> Personal Information</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <Label>Full Name *</Label>
                      <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Mensah" className="h-11" />
                    </div>
                    <FormSelect icon={User} label="Gender" value={gender} onChange={e => setGender(e.target.value as any)} placeholder="Select gender..." required>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </FormSelect>
                  </div>
                </div>
                {/* ── Location ── */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5"><MapPin size={12} /> Location Details</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <FormSelect icon={MapPin} label="Zone" value={zone} onChange={e => { setZone(e.target.value); setRegion(""); setDivision(""); }} placeholder="Select zone..." required>
                      {zones.map(z => <option key={z} value={z}>{z}</option>)}
                    </FormSelect>
                    <FormSelect icon={Building2} label="Region" value={region} onChange={e => { setRegion(e.target.value); setDivision(""); }} disabled={!zone} placeholder="Select region..." required>
                      {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </FormSelect>
                    <FormSelect icon={Layers} label="Division" value={division} onChange={e => setDivision(e.target.value)} disabled={!region} placeholder="Select division..." required>
                      {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                    </FormSelect>
                  </div>
                </div>
                {/* ── Role & Status ── */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5"><Briefcase size={12} /> Role & Payment</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <FormSelect icon={Briefcase} label="Position" value={position} onChange={e => setPosition(e.target.value)} placeholder="Select position..." required>
                      {Object.entries(POSITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </FormSelect>
                    <FormSelect icon={CreditCard} label="Payment Status" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} placeholder="Select payment status..." required>
                      {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </FormSelect>
                  </div>
                </div>
                {/* ── Messages ── */}
                {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 rounded-xl px-4 py-2.5"><AlertTriangle size={14} /> {error}</div>}
                {success && <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl px-4 py-2.5"><CheckCircle2 size={14} /> {success}</div>}
                {/* ── Submit ── */}
                <Button loading={createWorker.isPending} onClick={() => createWorker.mutate()} disabled={!name || !zone || !region || !division} className="w-full sm:w-auto h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-500/20"><Plus size={16} /> Register Worker</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── Cleanup Panel ── */}
      <AnimatePresence>
        {showCleanup && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="rounded-2xl overflow-hidden border-amber-200 dark:border-amber-800">
              <CardHeader className="flex flex-row items-center justify-between border-b border-amber-100 dark:border-amber-900/50 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/20 dark:to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 grid place-items-center"><AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" /></div>
                  <div><h4 className="font-semibold text-sm">Clean Up Phantom Workers</h4><p className="text-[11px] text-slate-400">Remove template-imported dummy entries</p></div>
                </div>
                <button onClick={() => { setShowCleanup(false); setCleanupCount(null); }} className="h-7 w-7 grid place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={14} /></button>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                {cleanupCount === null ? (
                  <>
                    <p className="text-sm text-slate-600 dark:text-slate-400">This will delete all workers registered by <span className="font-semibold text-amber-600">"Bulk Import"</span> — dummy entries created by uploading the unedited CSV template.</p>
                    <p className="text-xs text-slate-400">Real workers are never affected.</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setShowCleanup(false); setCleanupCount(null); }} className="gap-1.5">Cancel</Button>
                      <Button size="sm" loading={cleanupLoading} onClick={async () => {
                        setCleanupLoading(true);
                        try {
                          const res = await fetch("/api/auth/workers?registeredByName=Bulk+Import", { method: "DELETE" });
                          const j = await res.json();
                          setCleanupCount(j.deleted || 0);
                          qc.invalidateQueries({ queryKey: ["workers"] });
                        } catch { setCleanupCount(0); }
                        setCleanupLoading(false);
                      }} className="gap-1.5 bg-amber-600 hover:bg-amber-700"><Trash2 size={14} /> Delete Phantom Workers</Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                    <p className="text-sm font-medium">{cleanupCount} phantom worker{cleanupCount !== 1 ? "s" : ""} deleted</p>
                    <p className="text-xs text-slate-400 mt-1">Dashboard stats are now accurate</p>
                    <Button variant="outline" size="sm" onClick={() => { setShowCleanup(false); setCleanupCount(null); }} className="mt-3">Close</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── Bulk Upload Panel ── */}
      <AnimatePresence>
        {showBulk && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2"><FileSpreadsheet size={18} className="text-indigo-500" /><h4 className="font-semibold">Bulk Upload Workers</h4></div>
                <button onClick={() => setShowBulk(false)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-slate-100"><X size={14} /></button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Download Template */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 px-4 py-3">
                  <Download size={18} className="text-indigo-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Download CSV Template</p>
                    <p className="text-xs text-slate-500">Headers only — fill in your own rows before uploading</p>
                  </div>
                  <a href="/api/auth/workers/bulk" download className="shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-indigo-700 transition-colors"><Download size={12} /> Download</a>
                </div>
                {/* File Upload Zone */}
                <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${bulkFile ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/10" : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600"}`}>
                  <input type="file" accept=".csv" onChange={handleBulkFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Upload size={24} className={`mx-auto ${bulkFile ? "text-emerald-500" : "text-slate-400"}`} />
                  {bulkFile ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{bulkFile.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{bulkPreview?.rows.length || 0} rows detected</p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Drop CSV file here or click to browse</p>
                      <p className="text-xs text-slate-400 mt-1">Accepts .csv files only</p>
                    </div>
                  )}
                </div>
                {/* Preview Table */}
                {bulkPreview && bulkPreview.rows.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Preview (first 10 rows)</p>
                    <div className="overflow-x-auto rounded-xl border">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                          <tr>{bulkPreview.headers.map((h: string) => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y">
                          {bulkPreview.rows.slice(0, 10).map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              {bulkPreview.headers.map((h: string) => <td key={h} className="px-3 py-2 text-slate-600 dark:text-slate-400">{row[h] || "—"}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {bulkPreview.rows.length > 10 && <p className="text-xs text-slate-400 mt-2">...and {bulkPreview.rows.length - 10} more rows</p>}
                  </div>
                )}
                {/* Upload Button */}
                {bulkPreview && bulkPreview.rows.length > 0 && !bulkResult && (
                  <Button loading={bulkUploading} onClick={handleBulkUpload} className="gap-1.5"><Upload size={14} /> Upload {bulkPreview.rows.length} Workers</Button>
                )}
                {/* Result */}
                {bulkResult && (
                  <div className={`rounded-xl p-4 ${bulkResult.errors.length > 0 ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200" : "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200"}`}>
                    <div className="flex items-center gap-2">
                      {bulkResult.errors.length > 0 ? <AlertTriangle size={16} className="text-amber-500" /> : <span className="text-emerald-500 text-lg">&#10003;</span>}
                      <p className="text-sm font-semibold">{bulkResult.created} of {bulkResult.total} workers imported successfully</p>
                    </div>
                    {bulkResult.errors.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                        {bulkResult.errors.map((e, i) => <p key={i} className="text-xs text-amber-700 dark:text-amber-300">{e.message}</p>)}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      {isLoading ? <div className="space-y-3"><Skeleton className="h-12 w-full" /></div> : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden space-y-3">
            {data?.workers?.map((w: any) => (
              <div key={w.id} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{w.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{w.zone} › {w.region} › {w.division}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${w.gender === "male" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600" : "bg-pink-50 dark:bg-pink-900/30 text-pink-600"}`}>{w.gender}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</span>
                  {w.paymentStatus === "paid" ? <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">Paid</span> : <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-600">Unpaid</span>}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => toggleVerify.mutate(w.id)} className={`flex-1 min-h-[36px] py-1.5 rounded-lg text-xs font-semibold ${w.verified ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>{w.verified ? "✓ Verified" : "Mark Verified"}</button>
                  <button aria-label="Delete worker" onClick={() => { if (confirm(`Delete "${w.name}"?`)) deleteWorker.mutate(w.id); }} className="h-9 w-9 shrink-0 grid place-items-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {data?.workers?.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-sm text-slate-400">No workers registered yet.</div>
            )}
          </div>
          {/* Desktop: table */}
          <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border overflow-x-auto">
            <table className="w-full text-sm min-w-[850px]">
              <thead className="text-left text-slate-500 bg-slate-50 dark:bg-slate-800"><tr><th className="px-4 py-3">Name</th><th>Gender</th><th>Zone</th><th>Region</th><th>Division</th><th>Position</th><th>Payment</th><th>Verified</th><th>Actions</th></tr></thead>
              <tbody className="divide-y">
                {data?.workers?.map((w: any) => (
                  <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium">{w.name}</td><td className="capitalize">{w.gender}</td>
                    <td className="text-slate-500 text-xs">{w.zone}</td><td className="text-slate-500 text-xs">{w.region}</td><td className="text-slate-500 text-xs">{w.division}</td>
                    <td><span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</span></td>
                    <td>{w.paymentStatus === "paid" ? <span className="text-emerald-600 text-xs font-medium">Paid</span> : <span className="text-amber-600 text-xs font-medium">Unpaid</span>}</td>
                    <td><button onClick={() => toggleVerify.mutate(w.id)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${w.verified ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>{w.verified ? "Verified" : "Pending"}</button></td>
                    <td><button onClick={() => { if (confirm(`Delete "${w.name}"?`)) deleteWorker.mutate(w.id); }} className="h-7 w-7 grid place-items-center rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
                {data?.workers?.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-sm text-slate-400">No workers registered yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VERIFICATION
   ══════════════════════════════════════════════════════════════ */
function VerificationSection({ user }: { user: any }) {
  const [locked, setLocked] = useState(false);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const verify = (e: React.FormEvent) => { e.preventDefault(); if (locked) { setResult("Verification window is locked by National Officer."); return; } if (code.length < 2) { setResult("Enter a valid worker name."); return; } setResult(`Worker "${code}" — Verified ✓`); };
  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 flex items-center justify-between ${!locked ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20" : "bg-red-50 border-red-200 dark:bg-red-950/20"}`}>
        <div className="flex items-center gap-2 text-sm font-medium"><span className={`h-2 w-2 rounded-full ${!locked ? "bg-emerald-500" : "bg-red-500"}`} /> Verification: {!locked ? "OPEN" : "LOCKED"}</div>
        {isAdmin(user.role as RoleType) && <button onClick={() => setLocked(!locked)} className="text-xs rounded-full bg-white dark:bg-slate-800 border px-3 py-1.5">{locked ? "Unlock" : "Lock"}</button>}
      </div>
      <Card className="rounded-2xl"><CardHeader><h3 className="font-semibold">Verify Worker</h3></CardHeader>
        <CardContent>
          <form onSubmit={verify} className="flex flex-col sm:flex-row gap-2"><Input value={code} onChange={e => setCode(e.target.value)} placeholder="Enter worker name" className="w-full sm:max-w-xs" /><Button type="submit" className="shrink-0">Verify</Button></form>
          {result && <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800 border p-3 text-sm">{result}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   APPROVAL — Souvenir Approval by Region (Batch System)
   ══════════════════════════════════════════════════════════════ */
function ApprovalSection({ user }: { user: any }) {
  const [locked, setLocked] = useState(false);
  const qc = useQueryClient();
  const { data: workerData, isLoading: workersLoading } = useQuery({ queryKey: ["workers"], queryFn: async () => fetch("/api/auth/workers").then(r => r.json()) });
  const { data: approvalData, isLoading: approvalsLoading } = useQuery({ queryKey: ["approvals"], queryFn: async () => fetch("/api/auth/approvals").then(r => r.json()) });

  const isLoading = workersLoading || approvalsLoading;
  const workers = workerData?.workers || [];
  const allApprovals = approvalData?.approvals || [];

  const regionStats = useMemo(() => {
    const map: Record<string, { total: number; verified: number; currentBatch: number; lastApproval: any }> = {};
    workers.forEach((w: any) => {
      if (!map[w.region]) map[w.region] = { total: 0, verified: 0, currentBatch: 0, lastApproval: null };
      map[w.region].total++;
      if (w.verified) map[w.region].verified++;
    });
    Object.keys(map).forEach(region => {
      const regionApprovals = allApprovals.filter((a: any) => a.region === region).sort((a: any, b: any) => b.batchNumber - a.batchNumber);
      const lastApproval = regionApprovals[0] || null;
      map[region].lastApproval = lastApproval;
      if (lastApproval) {
        map[region].currentBatch = map[region].verified - lastApproval.verifiedCount;
      } else {
        map[region].currentBatch = map[region].verified;
      }
    });
    return Object.entries(map).map(([region, stats]) => ({ region, ...stats }));
  }, [workers, allApprovals]);

  const totalWorkers = regionStats.reduce((s, r) => s + r.total, 0);
  const totalVerified = regionStats.reduce((s, r) => s + r.verified, 0);
  const totalBatches = allApprovals.length;
  const totalCurrentBatch = regionStats.reduce((s, r) => s + Math.max(0, r.currentBatch), 0);
  const regionsWithBatch = regionStats.filter(r => r.currentBatch > 0).length;

  const approveMutation = useMutation({
    mutationFn: async ({ region, verifiedCount }: { region: string; verifiedCount: number }) =>
      fetch("/api/auth/approvals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ region, verifiedCount }) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["approvals"] }); },
  });

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 40%, #3b82f6 100%)" }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative px-6 py-5 sm:px-8 sm:py-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/15 backdrop-blur-sm grid place-items-center">
                <ClipboardCheck size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Souvenir Approval</h2>
                <p className="text-xs sm:text-sm text-white/70 mt-0.5">Batch-based approval for souvenir distribution</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${!locked ? "bg-white/15 text-white" : "bg-red-500/30 text-red-100"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${!locked ? "bg-emerald-300" : "bg-red-300"}`} />
                {!locked ? "OPEN" : "LOCKED"}
              </div>
              {isAdmin(user.role as RoleType) && (
                <button onClick={() => setLocked(!locked)} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors">
                  {locked ? "Unlock" : "Lock"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 bg-white dark:bg-slate-900">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total Workers</p>
          <p className="text-2xl font-black mt-0.5" style={{ color: "#6366f1" }}>{totalWorkers}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{totalVerified} verified</p>
        </div>
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 bg-white dark:bg-slate-900">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Current Batch</p>
          <p className="text-2xl font-black mt-0.5" style={{ color: "#f59e0b" }}>{totalCurrentBatch}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Awaiting approval</p>
        </div>
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 bg-white dark:bg-slate-900">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Approved Batches</p>
          <p className="text-2xl font-black mt-0.5" style={{ color: "#10b981" }}>{totalBatches}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Across all regions</p>
        </div>
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 bg-white dark:bg-slate-900">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Regions Pending</p>
          <p className="text-2xl font-black mt-0.5" style={{ color: "#8b5cf6" }}>{regionsWithBatch}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Have new verifications</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
      ) : (
        <>
          {/* ── Current Batch: Regions with new verifications ── */}
          {regionsWithBatch > 0 && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current Batch — Pending Approval</p>
                    <p className="text-[10px] text-slate-400">Workers verified after the last approval per region</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">{totalCurrentBatch} workers</span>
              </div>
              {/* Mobile: cards */}
              <div className="md:hidden space-y-3 p-3">
                {regionStats.filter(r => r.currentBatch > 0).map((r) => (
                  <div key={r.region} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>{r.region.charAt(0)}</div>
                        <div className="min-w-0"><p className="font-semibold text-sm truncate">{r.region}</p><p className="text-[11px] text-slate-400">{r.verified} verified total</p></div>
                      </div>
                      <span className="shrink-0 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 border border-amber-200 dark:border-amber-800">+{r.currentBatch} new</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{r.lastApproval ? <>Last: Batch {r.lastApproval.batchNumber} ({r.lastApproval.verifiedCount} workers)</> : "Never approved before"}</p>
                    {!locked && (
                      <button onClick={() => approveMutation.mutate({ region: r.region, verifiedCount: r.verified })} disabled={approveMutation.isPending} className="w-full min-h-[38px] rounded-lg text-xs font-semibold text-white shadow-md disabled:opacity-50 inline-flex items-center justify-center gap-1.5" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}><CheckCircle2 size={12} /> Approve Batch</button>
                    )}
                  </div>
                ))}
              </div>
              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="text-left text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest">Region</th>
                      <th className="text-[10px] font-semibold uppercase tracking-widest">Total Verified</th>
                      <th className="text-[10px] font-semibold uppercase tracking-widest">Last Approved</th>
                      <th className="text-[10px] font-semibold uppercase tracking-widest">New in Batch</th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {regionStats.filter(r => r.currentBatch > 0).map((r, i) => (
                      <tr key={r.region} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
                              {r.region.charAt(0)}
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{r.region}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">{r.verified}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {r.lastApproval ? (
                            <span>Batch {r.lastApproval.batchNumber} ({r.lastApproval.verifiedCount} workers)</span>
                          ) : (
                            <span className="text-slate-400">Never</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 border border-amber-200 dark:border-amber-800">
                            +{r.currentBatch} new
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {!locked && (
                            <button
                              onClick={() => approveMutation.mutate({ region: r.region, verifiedCount: r.verified })}
                              disabled={approveMutation.isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white shadow-md disabled:opacity-50"
                              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                            >
                              <CheckCircle2 size={10} /> Approve Batch
                            </button>
                          )}
                          {locked && <span className="text-[10px] text-slate-400 italic">Locked</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Approval History ── */}
          {allApprovals.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Approval History</p>
                    <p className="text-[10px] text-slate-400">Previously approved batches</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{allApprovals.length} approvals</span>
              </div>
              {/* Mobile: cards */}
              <div className="md:hidden space-y-3 p-3">
                {allApprovals.map((a: any) => (
                  <div key={a.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>{a.region.charAt(0)}</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{a.region}</p>
                        <p className="text-[11px] text-slate-400 truncate">{a.verifiedCount} workers · {a.approvedByName} · {new Date(a.approvedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="shrink-0 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">#{a.batchNumber}</span>
                  </div>
                ))}
              </div>
              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="text-left text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest">Region</th>
                      <th className="text-[10px] font-semibold uppercase tracking-widest">Batch</th>
                      <th className="text-[10px] font-semibold uppercase tracking-widest">Workers Approved</th>
                      <th className="text-[10px] font-semibold uppercase tracking-widest">Approved By</th>
                      <th className="text-[10px] font-semibold uppercase tracking-widest">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {allApprovals.map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                              {a.region.charAt(0)}
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{a.region}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                            #{a.batchNumber}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">{a.verifiedCount}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{a.approvedByName}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{new Date(a.approvedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── All Regions Overview ── */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">All Regions</p>
                <p className="text-[10px] text-slate-400">Complete overview</p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{regionStats.length} regions</span>
            </div>
            {/* Mobile: cards */}
            <div className="md:hidden space-y-3 p-3">
              {regionStats.map((r, i) => (
                <div key={r.region} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#ef4444"][i % 7]}, ${["#818cf8", "#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#22d3ee", "#f87171"][i % 7]})` }}>{r.region.charAt(0)}</div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{r.region}</p>
                      <p className="text-[11px] text-slate-400">{allApprovals.filter((a: any) => a.region === r.region).length} batches</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold"><span className={r.verified === r.total && r.total > 0 ? "text-emerald-600" : "text-amber-600"}>{r.verified}</span><span className="text-slate-400">/{r.total}</span></p>
                    {r.currentBatch > 0 && <span className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600">+{r.currentBatch}</span>}
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="text-left text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest">Region</th>
                    <th className="text-[10px] font-semibold uppercase tracking-widest">Workers</th>
                    <th className="text-[10px] font-semibold uppercase tracking-widest">Verified</th>
                    <th className="text-[10px] font-semibold uppercase tracking-widest">Current Batch</th>
                    <th className="text-[10px] font-semibold uppercase tracking-widest">Batches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {regionStats.map((r, i) => {
                    const regionApprovals = allApprovals.filter((a: any) => a.region === r.region);
                    return (
                      <tr key={r.region} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#ef4444"][i % 7]}, ${["#818cf8", "#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#22d3ee", "#f87171"][i % 7]})` }}>
                              {r.region.charAt(0)}
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{r.region}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">{r.total}</td>
                        <td className="px-5 py-3.5">
                          <span className={`font-semibold ${r.verified === r.total && r.total > 0 ? "text-emerald-600" : "text-amber-600"}`}>{r.verified}</span>
                          <span className="text-slate-400"> / {r.total}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {r.currentBatch > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600">+{r.currentBatch}</span>
                          ) : (
                            <span className="text-[10px] text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{regionApprovals.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {regionStats.length === 0 && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center">
              <ClipboardCheck size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm text-slate-400">No regions found. Register workers first.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ATTENDANCE
   ══════════════════════════════════════════════════════════════ */
function AttendanceSection() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const { data: workerData } = useQuery({ queryKey: ["workers"], queryFn: async () => fetch("/api/auth/workers").then(r => r.json()) });
  const { data: attData, isLoading } = useQuery({ queryKey: ["attendance"], queryFn: async () => fetch("/api/auth/attendance").then(r => r.json()) });
  const checkIn = useMutation({ mutationFn: async (w: any) => fetch("/api/auth/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workerId: w.id, workerName: w.name, zone: w.zone, region: w.region, division: w.division }) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance"] }); setSelectedWorker(null); setSearchQuery(""); } });
  const checkOut = useMutation({ mutationFn: async (id: string) => fetch("/api/auth/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workerId: id, action: "checkout" }) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }) });
  const filteredWorkers = workerData?.workers?.filter((w: any) => searchQuery && (w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.id.toLowerCase().includes(searchQuery.toLowerCase()))) || [];
  const checkedInIds = new Set((attData?.attendances || []).filter((a: any) => !a.checkedOutAt).map((a: any) => a.workerId));

  return (
    <div className="space-y-4">
      <div><Label>Search Worker to Check In</Label>
        <div className="relative mt-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><Input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSelectedWorker(null); }} placeholder="Type worker name..." className="pl-10" /></div>
        {searchQuery && !selectedWorker && (
          <div className="mt-2 rounded-xl border bg-white dark:bg-slate-900 max-h-48 overflow-auto divide-y">
            {filteredWorkers.map((w: any) => (
              <button key={w.id} onClick={() => setSelectedWorker(w)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between">
                <span>{w.name} <span className="text-xs text-slate-400">({w.region})</span></span>
                {checkedInIds.has(w.id) ? <span className="text-xs text-emerald-600">Checked In</span> : <span className="text-xs text-slate-400">Not in</span>}
              </button>
            ))}
            {filteredWorkers.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">No workers found.</p>}
          </div>
        )}
      </div>
      {selectedWorker && <Card className="rounded-2xl"><CardContent className="pt-6"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="min-w-0"><p className="font-semibold truncate">{selectedWorker.name}</p><p className="text-sm text-slate-500 truncate">{selectedWorker.zone} / {selectedWorker.region}</p></div><Button onClick={() => checkIn.mutate(selectedWorker)} disabled={checkedInIds.has(selectedWorker.id)} className="shrink-0 self-start sm:self-auto">{checkedInIds.has(selectedWorker.id) ? "Checked In" : "Check In"}</Button></div></CardContent></Card>}
      <h3 className="font-semibold">Check-in Log ({attData?.attendances?.length || 0})</h3>
      {isLoading ? <Skeleton className="h-12 w-full" /> : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden space-y-3">
            {(attData?.attendances || []).map((a: any) => (
              <div key={a.id} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{a.workerName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{a.zone} › {a.region}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{new Date(a.checkedInAt).toLocaleString()}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  {a.checkedOutAt ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">Left</span> : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">Present</span>}
                  {!a.checkedOutAt && <button onClick={() => checkOut.mutate(a.workerId)} className="min-h-[32px] px-3 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600">Check Out</button>}
                </div>
              </div>
            ))}
            {(!attData?.attendances || attData.attendances.length === 0) && (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-sm text-slate-400">No check-ins yet.</div>
            )}
          </div>
          {/* Desktop: table */}
          <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="text-left text-slate-500 bg-slate-50 dark:bg-slate-800"><tr><th className="px-4 py-3">Worker</th><th>Zone</th><th>Region</th><th>Checked In</th><th>Status</th><th>Action</th></tr></thead>
              <tbody className="divide-y">
                {(attData?.attendances || []).map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium">{a.workerName}</td><td className="text-xs">{a.zone}</td><td className="text-xs">{a.region}</td><td className="text-xs">{new Date(a.checkedInAt).toLocaleString()}</td>
                    <td>{a.checkedOutAt ? <span className="text-xs text-slate-500">Left</span> : <span className="text-xs text-emerald-600 font-medium">Present</span>}</td>
                    <td>{!a.checkedOutAt && <button onClick={() => checkOut.mutate(a.workerId)} className="text-xs rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 hover:bg-red-50">Check Out</button>}</td>
                  </tr>
                ))}
                {(!attData?.attendances || attData.attendances.length === 0) && <tr><td colSpan={6} className="text-center py-8 text-sm text-slate-400">No check-ins yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   REPORTS
   ══════════════════════════════════════════════════════════════ */
function BroadcastSection({ user }: { user: any }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState(""); const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState<RoleType | "all">("all");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [success, setSuccess] = useState<string | null>(null);
  const canSend = isAdmin(user.role as RoleType);

  const { data, isLoading } = useQuery({ queryKey: ["messages"], queryFn: async () => fetch("/api/auth/messages").then(r => r.json()) });

  const sendMessage = useMutation({
    mutationFn: async () => fetch("/api/auth/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, targetRole, priority }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["messages"] }); qc.invalidateQueries({ queryKey: ["messages", "unread"] }); setTitle(""); setContent(""); setSuccess("Broadcast sent!"); setShowForm(false); setTimeout(() => setSuccess(null), 3000); },
  });
  const markRead = useMutation({
    mutationFn: async (messageId: string) => fetch("/api/auth/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark_read", messageId }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["messages"] }); qc.invalidateQueries({ queryKey: ["messages", "unread"] }); },
  });
  const markAllRead = useMutation({
    mutationFn: async () => fetch("/api/auth/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark_all_read" }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["messages"] }); qc.invalidateQueries({ queryKey: ["messages", "unread"] }); },
  });

  const messages = data?.messages || [];
  const unreadCount = data?.unreadCount || 0;
  const ROLE_COLORS: Record<string, string> = { all: "#6366f1", super_admin: "#ef4444", national_officer: "#8b5cf6", regional_officer: "#3b82f6", verifier: "#f59e0b", viewer: "#10b981" };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Broadcast</h3>
          {unreadCount > 0 && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>{unreadCount} unread</span>}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} className="gap-1.5 text-xs">Mark all read</Button>}
          {canSend && <Button onClick={() => setShowForm(!showForm)} className="gap-1.5"><Send size={16} /> New Broadcast</Button>}
        </div>
      </div>

      <AnimatePresence>{showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
          <Card className="rounded-2xl"><CardHeader className="flex flex-row items-center justify-between"><h4 className="font-semibold">Send Broadcast</h4><button onClick={() => setShowForm(false)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-slate-100"><X size={14} /></button></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="md:col-span-2"><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Broadcast title" /></div>
                <div className="md:col-span-2"><Label>Message *</Label><textarea value={content} onChange={e => setContent(e.target.value)} rows={4} className="flex w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" placeholder="Write your broadcast message..." /></div>
                <div><Label>Send To</Label>
                  <select value={targetRole} onChange={e => setTargetRole(e.target.value as any)} className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                    <option value="all">Everyone</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="national_officer">National Officer</option>
                    <option value="regional_officer">Regional Officer</option>
                    <option value="verifier">Verifier</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div><Label>Priority</Label>
                  <select value={priority} onChange={e => setPriority(e.target.value as any)} className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <Button loading={sendMessage.isPending} onClick={() => sendMessage.mutate()} disabled={!title || !content}><Send size={16} /> Send Broadcast</Button>
            </CardContent>
          </Card>
        </motion.div>
      )}</AnimatePresence>

      {success && <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700">{success}</div>}

      {isLoading ? <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div> : (
        <div className="space-y-3">
          {messages.map((m: any) => {
            const isUnread = !m.readBy?.includes(user.id);
            return (
              <div key={m.id} className={`rounded-2xl border p-4 transition-all ${isUnread ? "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-900/30" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isUnread && <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />}
                      <h4 className={`font-semibold text-sm ${isUnread ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>{m.title}</h4>
                      {m.priority === "urgent" && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600">URGENT</span>}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: (ROLE_COLORS[m.targetRole] || "#6366f1") + "15", color: ROLE_COLORS[m.targetRole] || "#6366f1" }}>
                        {m.targetRole === "all" ? "Everyone" : m.targetRole?.replace("_", " ")}
                      </span>
                    </div>
                    <p className={`text-sm mt-1.5 ${isUnread ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>{m.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>From {m.senderName}</span>
                      <span>{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  {isUnread && (
                    <button onClick={() => markRead.mutate(m.id)} className="shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-300 dark:text-slate-600 mb-2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              <p className="text-sm text-slate-400">No broadcasts yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SESSIONS
   ══════════════════════════════════════════════════════════════ */
function SessionsSection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["sessions"], queryFn: async () => fetch("/api/auth/sessions").then(r => r.json()) });
  const revokeAll = useMutation({ mutationFn: async () => fetch("/api/auth/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["sessions"] }); location.reload(); } });
  const revokeOne = useMutation({ mutationFn: async (sid: string) => fetch("/api/auth/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sid }) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }) });
  if (isLoading) return <div className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h3 className="font-semibold">Active Sessions</h3><Button variant="outline" size="sm" onClick={() => revokeAll.mutate()}>Logout all devices</Button></div>
      <div className="space-y-3">
        {data?.sessions?.map((s: any) => (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 bg-white dark:bg-slate-900">
            <div className="min-w-0"><p className="text-sm font-medium truncate">{s.browser} • {s.os} {data.currentSid === s.id && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Current</span>}</p><p className="text-xs text-slate-500 truncate">{s.ip} • {new Date(s.lastActivity).toLocaleString()}</p></div>
            <button onClick={() => revokeOne.mutate(s.id)} className="h-8 w-8 shrink-0 grid place-items-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><X size={16} /></button>
          </div>
        ))}
        {data?.sessions?.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No active sessions.</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   AUDIT
   ══════════════════════════════════════════════════════════════ */
function AuditSection() {
  const { data, isLoading } = useQuery({ queryKey: ["audit"], queryFn: async () => fetch("/api/auth/audit").then(r => r.json()) });
  if (isLoading) return <div className="space-y-3"><Skeleton className="h-12 w-full" /></div>;
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Audit Trail (immutable)</h3>
      <div className="max-h-[400px] overflow-auto divide-y rounded-2xl border bg-white dark:bg-slate-900">
        {data?.logs?.map((l: any) => (
          <div key={l.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 text-sm">
            <div className="min-w-0"><span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{l.action}</span><span className="ml-2 text-slate-600 dark:text-slate-300 break-words">{l.detail || ""}</span></div>
            <span className="text-xs text-slate-500 shrink-0">{new Date(l.timestamp).toLocaleString()}</span>
          </div>
        ))}
        {data?.logs?.length === 0 && <p className="text-sm text-slate-400 py-12 text-center">No logs yet.</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MFA
   ══════════════════════════════════════════════════════════════ */
function MFASection() {
  const [enabled, setEnabled] = useState(false); const [code, setCode] = useState(""); const [msg, setMsg] = useState("");
  useEffect(() => { fetch("/api/auth/mfa").then(r => r.json()).then(j => setEnabled(j.mfaEnabled)); }, []);
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Multi-Factor Authentication</h3>
      <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4 flex items-center justify-between">
        <div><p className="text-sm font-medium">Authenticator App (TOTP)</p><p className="text-xs text-slate-500">{enabled ? "Enabled" : "Not enabled"}</p></div>
        {enabled ? <Button variant="outline" size="sm" onClick={async () => { await fetch("/api/auth/mfa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "disable" }) }); setEnabled(false); }}>Disable</Button> : <Button size="sm" onClick={async () => { await fetch("/api/auth/mfa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "enable" }) }); setEnabled(true); setMsg("MFA enabled. Code: 123456"); }}>Enable</Button>}
      </div>
      <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4">
        <p className="text-sm font-medium">Verify code (demo: 123456)</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2"><Input value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code" className="w-full sm:max-w-xs" maxLength={6} /><Button onClick={async () => { const r = await fetch("/api/auth/mfa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify", code }) }); const j = await r.json(); setMsg(r.ok ? "✓ Verified" : j.error); }} disabled={code.length !== 6} className="shrink-0">Verify</Button></div>
        {msg && <p className="text-sm mt-2 text-slate-600 dark:text-slate-300">{msg}</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SETTINGS
   ══════════════════════════════════════════════════════════════ */
function SettingsSection({ user, setUser }: { user: any; setUser: (u: any) => void }) {
  const [username, setUsername] = useState(user.username || "");
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [email, setEmail] = useState(user.email || "");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true); setMsg(null); setError(null);
    try {
      const r = await fetch("/api/auth/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, displayName, email }) });
      const j = await r.json();
      if (!r.ok) { setError(j.error); return; }
      setUser(j.user);
      setMsg("Profile updated successfully");
    } catch { setError("Failed to update"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h3 className="font-semibold">Account Settings</h3>
      <Card className="rounded-2xl">
        <CardHeader><h4 className="font-semibold">Profile Information</h4><p className="text-sm text-slate-500">Update your account details and basic info.</p></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl overflow-hidden shadow-lg"><img src="/dclmlogo.JPG" alt="Logo" className="h-full w-full object-cover" /></div>
            <div><p className="font-semibold">{displayName}</p><p className="text-sm text-slate-500">{user.role?.replace("_", " ")}</p><p className="text-xs text-slate-400">Member since {new Date(user.createdAt).toLocaleDateString()}</p></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Username</Label><Input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" /></div>
            <div><Label>Display Name</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Full name" /></div>
            <div className="md:col-span-2"><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@dclm.org" type="email" /></div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          {msg && <p className="text-sm text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2">{msg}</p>}
          <Button loading={loading} onClick={save}>Save Changes</Button>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader><h4 className="font-semibold">Security</h4></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"><div><p className="text-sm font-medium">Password</p><p className="text-xs text-slate-500">Last changed: Unknown</p></div><Button variant="outline" size="sm">Change Password</Button></div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"><div><p className="text-sm font-medium">Two-Factor Auth</p><p className="text-xs text-slate-500">{user.mfaEnabled ? "Enabled" : "Disabled"}</p></div><Button variant="outline" size="sm">{user.mfaEnabled ? "Manage" : "Enable"}</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
