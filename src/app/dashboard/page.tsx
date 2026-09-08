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
import { toProperCase } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend } from "recharts";

const ICON_MAP: Record<string, any> = { LayoutDashboard: BarChart3, Users, UserPlus, ScanLine, ClipboardCheck, FileText: ScrollText, ScrollText, Monitor, ShieldCheck, Settings };

const CHART_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6", "#06b6d4", "#f43f5e", "#10b981"];

// Workers cache is scoped by viewer role+scope so a national full list can never
// be served from cache to a regional officer (and vice versa).
const WORKERS_KEY = (user: any) => ["workers", user?.role, user?.region ?? "", user?.zone ?? ""];

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

  const logout = () => { fetch("/api/auth/logout", { method: "POST" }); queryClient.clear(); router.push("/login"); };

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
              {section === "reports" && (isAdmin(user.role as RoleType) || user.role === "regional_officer" || user.role === "viewer") && <ReportsSection user={user} />}
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
  const { data } = useQuery({ queryKey: WORKERS_KEY(user), queryFn: async () => fetch("/api/auth/workers").then(r => r.json()) });
  const rawWorkers: any[] = data?.workers || [];
  const isRegional = user.role === "regional_officer";
  const scopeLabel = isRegional ? (user.region ? `Region: ${user.region}` : "Your Region") : null;
  const workers: any[] = useMemo(() => {
    if (!isRegional) return rawWorkers;
    if (!user.region) return rawWorkers;
    const want = user.region.trim().toLowerCase();
    return rawWorkers.filter((w: any) => w.region && w.region.trim().toLowerCase() === want);
  }, [rawWorkers, user.region, isRegional]);
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

  const byDivision: Record<string, any[]> = {};
  workers.forEach(w => { const d = w.division || "Unassigned"; if (!byDivision[d]) byDivision[d] = []; byDivision[d].push(w); });

  const byPosition: Record<string, number> = {};
  workers.forEach(w => { byPosition[w.position] = (byPosition[w.position] || 0) + 1; });
  const topPositions = Object.entries(byPosition).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const [participantsExpanded, setParticipantsExpanded] = useState(false);
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({});
  const [reportSearch, setReportSearch] = useState("");
  const [regionalExpanded, setRegionalExpanded] = useState(false);
  const [divisionExpanded, setDivisionExpanded] = useState(false);
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const [verificationExpanded, setVerificationExpanded] = useState(false);
  const [genderExpanded, setGenderExpanded] = useState(false);
  const [dailyExpanded, setDailyExpanded] = useState(false);

  // Keep zone expand state in sync when workers change
  useEffect(() => {
    if (Object.keys(byZone).length && Object.keys(expandedZones).length === 0) {
      setExpandedZones(Object.fromEntries(Object.keys(byZone).map(z => [z, false])));
    }
  }, [byZone, expandedZones]);

  const toggleZone = (zone: string) => setExpandedZones(prev => ({ ...prev, [zone]: !prev[zone] }));
  const setAllZones = (expanded: boolean) => setExpandedZones(Object.fromEntries(Object.keys(byZone).map(z => [z, expanded])));

  const filteredWorkers = useMemo(() => {
    if (!reportSearch.trim()) return workers;
    const q = reportSearch.toLowerCase();
    return workers.filter((w: any) => w.name.toLowerCase().includes(q) || w.zone.toLowerCase().includes(q) || w.region.toLowerCase().includes(q) || w.division.toLowerCase().includes(q) || POSITION_LABELS[w.position as keyof typeof POSITION_LABELS]?.toLowerCase().includes(q));
  }, [workers, reportSearch]);

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

        {isRegional && (
          <div className="mt-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-3 flex items-center gap-2.5 shadow-md">
            <div className="h-8 w-8 rounded-lg bg-white/20 grid place-items-center"><MapPin size={16} className="text-white" /></div>
            <div><p className="text-sm font-bold">Report Limited — {scopeLabel}</p><p className="text-xs text-white/80">All figures below are for your assigned region only. National data is not accessible.</p></div>
          </div>
        )}
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
              {/* ── Premium Collapsible Participant List ── */}
              <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                {/* Collapsible Header */}
                <button onClick={() => setParticipantsExpanded(!participantsExpanded)} className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 hover:from-indigo-50/50 hover:to-white dark:hover:from-indigo-950/10 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 grid place-items-center shadow-md shadow-indigo-500/20"><Users size={14} className="text-white" /></div>
                    <div className="text-left">
                      <p className="text-sm font-bold tracking-tight">Registered Participants</p>
                      <p className="text-[11px] text-slate-400">{filteredWorkers.length} of {total} workers{reportSearch ? " — filtered" : ""} • {verified} verified</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">{participantsExpanded ? "Collapse" : "Expand"}</span>
                    <div className={`h-7 w-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 grid place-items-center shadow-sm transition-transform ${participantsExpanded ? "rotate-180" : ""}`}><ChevronDown size={14} className="text-slate-500" /></div>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {participantsExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="overflow-hidden">
                      {/* Controls */}
                      <div className="px-4 sm:px-5 py-3 bg-slate-50/70 dark:bg-slate-800/30 border-y border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
                        <div className="relative flex-1 max-w-sm">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input value={reportSearch} onChange={e => setReportSearch(e.target.value)} placeholder="Search name, zone, region, division, position..." className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => setAllZones(true)} className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors">Expand all</button>
                          <button onClick={() => setAllZones(false)} className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors">Collapse all</button>
                        </div>
                      </div>

                      {/* Grouped by Zone — Premium Collapsible Cards */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {Object.entries(byZone).sort((a, b) => b[1].length - a[1].length).map(([zone, ws]) => {
                          const zoneFiltered = ws.filter((w: any) => !reportSearch.trim() || w.name.toLowerCase().includes(reportSearch.toLowerCase()) || w.zone.toLowerCase().includes(reportSearch.toLowerCase()) || w.region.toLowerCase().includes(reportSearch.toLowerCase()) || w.division.toLowerCase().includes(reportSearch.toLowerCase()));
                          if (zoneFiltered.length === 0 && reportSearch) return null;
                          const expanded = expandedZones[zone] ?? false;
                          const zPaid = zoneFiltered.filter((w: any) => w.paymentStatus === "paid").length;
                          const zVerified = zoneFiltered.filter((w: any) => w.verified).length;
                          return (
                            <div key={zone} className="bg-white dark:bg-slate-900">
                              <button onClick={() => toggleZone(zone)} className="w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3 text-left min-w-0">
                                  <div className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 transition-transform ${expanded ? "rotate-180" : ""} bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800`}><ChevronDown size={12} className="text-indigo-600 dark:text-indigo-400" /></div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold truncate">{zone}</p>
                                    <p className="text-[11px] text-slate-400">{zoneFiltered.length} participants • {zPaid} paid • {zVerified} verified</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                  <span className="hidden sm:inline-flex h-6 min-w-[28px] items-center justify-center px-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-bold shadow-sm">{zoneFiltered.length}</span>
                                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">{zPaid} paid</span>
                                </div>
                              </button>
                              <AnimatePresence initial={false}>
                                {expanded && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                    {/* Desktop premium table — upgraded */}
                                    <div className="hidden md:block table-scroll overflow-x-auto scrollbar-thin">
                                      <table className="table-premium w-full text-xs">
                                        <thead className="thead-dark">
                                          <tr className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white">
                                            <th className="text-left font-semibold px-4 py-2.5 w-10">#</th>
                                            <th className="text-left font-semibold px-3 py-2.5">Full Name</th>
                                            <th className="text-left font-semibold px-3 py-2.5">Gender</th>
                                            {showZoneRegionDivision && <><th className="text-left font-semibold px-3 py-2.5">Region</th><th className="text-left font-semibold px-3 py-2.5">Division</th></>}
                                            <th className="text-left font-semibold px-3 py-2.5">Position</th>
                                            <th className="text-left font-semibold px-3 py-2.5">Payment</th>
                                            <th className="text-center font-semibold px-3 py-2.5 w-16">Verified</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                          {zoneFiltered.map((w: any, i: number) => (
                                            <tr key={w.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 transition-colors group">
                                              <td className="px-4 py-2.5 text-slate-400 font-medium">{i + 1}</td>
                                              <td className="px-3 py-2.5"><div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 grid place-items-center text-white text-[10px] font-bold shrink-0">{toProperCase(w.name)[0]}</div><span className="font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{toProperCase(w.name)}</span></div></td>
                                              <td className="px-3 py-2.5"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${w.gender === "male" ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300" : "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300"}`}>{w.gender === "male" ? "Male" : "Female"}</span></td>
                                              {showZoneRegionDivision && <><td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{w.region}</td><td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{w.division}</td></>}
                                              <td className="px-3 py-2.5"><span className="inline-flex px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium border border-slate-200 dark:border-slate-700">{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</span></td>
                                              <td className="px-3 py-2.5"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${w.paymentStatus === "paid" ? "bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20" : "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300"}`}>{w.paymentStatus === "paid" ? "● Paid" : "○ Unpaid"}</span></td>
                                              <td className="px-3 py-2.5 text-center">{w.verified ? <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500 shadow-sm"><CheckCircle2 size={12} className="text-white" /></span> : <span className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 inline-flex items-center justify-center text-slate-300">—</span>}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                    {/* Mobile cards */}
                                    <div className="md:hidden p-3 space-y-2 bg-slate-50/50 dark:bg-slate-800/20">
                                      {zoneFiltered.map((w: any) => (
                                        <div key={w.id} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 min-w-0"><div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 grid place-items-center text-white text-xs font-bold shrink-0">{toProperCase(w.name)[0]}</div><span className="text-xs font-bold truncate">{toProperCase(w.name)}</span></div>
                                            <div className="flex gap-1.5 shrink-0">{w.paymentStatus === "paid" ? <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white">Paid</span> : <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">Unpaid</span>}{w.verified && <span className="h-5 w-5 rounded-full bg-emerald-500 grid place-items-center"><CheckCircle2 size={10} className="text-white" /></span>}</div>
                                          </div>
                                          <div className="flex flex-wrap gap-1.5 text-[10px]"><span className={`px-2 py-0.5 rounded-full border font-medium ${w.gender === "male" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-pink-50 text-pink-700 border-pink-200"}`}>{w.gender}</span><span className="px-2 py-0.5 rounded-full bg-slate-100 border text-slate-600">{w.region}</span><span className="px-2 py-0.5 rounded-full bg-slate-100 border text-slate-600">{w.division}</span><span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</span></div>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                        {filteredWorkers.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No participants match your search</p>}
                        {workers.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No workers registered yet</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  {/* Top unpaid — Premium Collapsible */}
                  <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <button onClick={() => setPaymentExpanded(!paymentExpanded)} className="w-full flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900 hover:from-amber-100 dark:hover:from-amber-900/20 transition-colors">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle size={12} className="text-amber-500" /> Top Unpaid ({unpaid})</span>
                      <span className={`h-6 w-6 rounded-full bg-white dark:bg-slate-800 border grid place-items-center transition-transform ${paymentExpanded ? "rotate-180" : ""}`}><ChevronDown size={12} /></span>
                    </button>
                    <AnimatePresence initial={false}>
                      {paymentExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                            {workers.filter(w => w.paymentStatus === "unpaid").slice(0, 20).map(w => (
                              <div key={w.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-amber-50/50 dark:hover:bg-amber-950/10 transition-colors group">
                                <div className="flex items-center gap-2 min-w-0"><div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center text-white text-[10px] font-bold shrink-0">{toProperCase(w.name)[0]}</div><span className="text-xs font-medium truncate group-hover:text-amber-700 transition-colors">{toProperCase(w.name)}</span></div>
                                <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border text-slate-500 shrink-0 ml-2">{w.zone}</span>
                              </div>
                            ))}
                            {unpaid === 0 && <p className="text-xs text-emerald-600 font-medium text-center py-4 bg-emerald-50 dark:bg-emerald-950/10">All workers have paid!</p>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                  <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <button onClick={() => setVerificationExpanded(!verificationExpanded)} className="w-full flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-cyan-50 to-white dark:from-cyan-950/20 dark:to-slate-900 hover:from-cyan-100 dark:hover:from-cyan-900/20 transition-colors">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><ScanLine size={12} className="text-cyan-500" /> Pending Verification ({total - verified})</span>
                      <span className={`h-6 w-6 rounded-full bg-white dark:bg-slate-800 border grid place-items-center transition-transform ${verificationExpanded ? "rotate-180" : ""}`}><ChevronDown size={12} /></span>
                    </button>
                    <AnimatePresence initial={false}>
                      {verificationExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                            {workers.filter(w => !w.verified).slice(0, 20).map(w => (
                              <div key={w.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/10 transition-colors group">
                                <div className="flex items-center gap-2 min-w-0"><div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 grid place-items-center text-white text-[10px] font-bold shrink-0">{toProperCase(w.name)[0]}</div><span className="text-xs font-medium truncate group-hover:text-cyan-700 transition-colors">{toProperCase(w.name)}</span></div>
                                <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border text-slate-500 shrink-0 ml-2">{w.zone}</span>
                              </div>
                            ))}
                            {verified === total && <p className="text-xs text-cyan-600 font-medium text-center py-4 bg-cyan-50 dark:bg-cyan-950/10">All workers verified!</p>}
                            {total - verified === 0 && verified !== total && <p className="text-xs text-slate-400 text-center py-4">No pending</p>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
              {/* Regional Table — Premium Collapsible */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 shadow-sm mt-4">
                <button onClick={() => setRegionalExpanded(!regionalExpanded)} className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-900 hover:from-purple-100 dark:hover:from-purple-900/20 transition-colors">
                  <div className="flex items-center gap-2.5"><div className="h-7 w-7 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600 grid place-items-center shadow-sm"><MapPin size={12} className="text-white" /></div><div className="text-left"><p className="text-xs font-bold">Regional Breakdown</p><p className="text-[11px] text-slate-400">{Object.keys(byRegion).length} regions • {total} workers</p></div></div>
                  <div className="flex items-center gap-2"><span className="hidden sm:inline text-[11px] font-semibold text-purple-600 bg-purple-50 dark:bg-purple-950/30 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800">{regionalExpanded ? "Collapse" : "Expand"}</span><span className={`h-7 w-7 rounded-full bg-white dark:bg-slate-800 border grid place-items-center transition-transform ${regionalExpanded ? "rotate-180" : ""}`}><ChevronDown size={14} /></span></div>
                </button>
                <AnimatePresence initial={false}>
                  {regionalExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="table-scroll overflow-x-auto scrollbar-thin">
                        <table className="table-premium w-full text-xs">
                          <thead className="thead-dark">
                            <tr className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white">
                              <th className="text-left font-semibold px-4 py-2.5">Region</th>{showZoneBreakdown && <th className="text-left font-semibold px-3 py-2.5">Zone</th>}<th className="text-center font-semibold px-3 py-2.5">Workers</th><th className="text-center font-semibold px-3 py-2.5">Paid</th><th className="text-center font-semibold px-3 py-2.5">Unpaid</th><th className="text-center font-semibold px-3 py-2.5">Verified</th><th className="text-left font-semibold px-4 py-2.5">Payment %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {Object.entries(byRegion).sort((a, b) => b[1].length - a[1].length).map(([region, ws]) => {
                              const rp = ws.filter(w => w.paymentStatus === "paid").length;
                              return (
                                <tr key={region} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/10 transition-colors">
                                  <td className="px-4 py-2.5 font-semibold">{region}</td>{showZoneBreakdown && <td className="px-3 py-2.5 text-slate-500">{ws[0]?.zone}</td>}<td className="px-3 py-2.5 text-center font-bold">{ws.length}</td>
                                  <td className="px-3 py-2.5 text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-[11px] font-bold shadow-sm">{rp}</span></td>
                                  <td className="px-3 py-2.5 text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-bold">{ws.length - rp}</span></td>
                                  <td className="px-3 py-2.5 text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white text-[11px] font-bold shadow-sm">{ws.filter(w => w.verified).length}</span></td>
                                  <td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all" style={{ width: `${ws.length > 0 ? (rp / ws.length) * 100 : 0}%` }} /></div><span className="text-[11px] font-bold w-8 text-right">{ws.length > 0 ? ((rp / ws.length) * 100).toFixed(0) : 0}%</span></div></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {/* Mobile cards */}
                      <div className="md:hidden p-3 space-y-2 bg-slate-50/50 dark:bg-slate-800/20">
                        {Object.entries(byRegion).sort((a, b) => b[1].length - a[1].length).map(([region, ws]) => {
                          const rp = ws.filter(w => w.paymentStatus === "paid").length;
                          return (
                            <div key={region} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                              <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold truncate">{region}</span>{showZoneBreakdown && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/30 border border-purple-200 text-purple-600 text-xs">{ws[0]?.zone}</span>}</div>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg py-2 border"><p className="text-[9px] font-bold text-slate-400 uppercase">Workers</p><p className="text-lg font-black">{ws.length}</p></div>
                                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg py-2 border border-emerald-200 dark:border-emerald-800"><p className="text-[9px] font-bold text-emerald-600 uppercase">Paid</p><p className="text-lg font-black text-emerald-600">{rp}</p></div>
                                <div className="bg-cyan-50 dark:bg-cyan-950/20 rounded-lg py-2 border border-cyan-200 dark:border-cyan-800"><p className="text-[9px] font-bold text-cyan-600 uppercase">Verified</p><p className="text-lg font-black text-cyan-600">{ws.filter(w => w.verified).length}</p></div>
                              </div>
                              <div className="mt-2"><div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" style={{ width: `${ws.length > 0 ? (rp / ws.length) * 100 : 0}%` }} /></div></div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Divisional Breakdown — same pattern as Regional */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 shadow-sm mt-4">
                <button onClick={() => setDivisionExpanded(!divisionExpanded)} className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900 hover:from-indigo-100 dark:hover:from-indigo-900/20 transition-colors">
                  <div className="flex items-center gap-2.5"><div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 grid place-items-center shadow-sm"><Layers size={12} className="text-white" /></div><div className="text-left"><p className="text-xs font-bold">Divisional Breakdown</p><p className="text-[11px] text-slate-400">{Object.keys(byDivision).length} divisions • {total} workers</p></div></div>
                  <div className="flex items-center gap-2"><span className="hidden sm:inline text-[11px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">{divisionExpanded ? "Collapse" : "Expand"}</span><span className={`h-7 w-7 rounded-full bg-white dark:bg-slate-800 border grid place-items-center transition-transform ${divisionExpanded ? "rotate-180" : ""}`}><ChevronDown size={14} /></span></div>
                </button>
                <AnimatePresence initial={false}>
                  {divisionExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="table-scroll overflow-x-auto scrollbar-thin">
                        <table className="table-premium w-full text-xs">
                          <thead className="thead-dark">
                            <tr className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white">
                              <th className="text-left font-semibold px-4 py-2.5">Division</th><th className="text-center font-semibold px-3 py-2.5">Workers</th><th className="text-center font-semibold px-3 py-2.5">Paid</th><th className="text-center font-semibold px-3 py-2.5">Unpaid</th><th className="text-center font-semibold px-3 py-2.5">Verified</th><th className="text-left font-semibold px-4 py-2.5">Payment %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {Object.entries(byDivision).sort((a, b) => b[1].length - a[1].length).map(([division, ws]) => {
                              const dp = ws.filter(w => w.paymentStatus === "paid").length;
                              return (
                                <tr key={division} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 transition-colors">
                                  <td className="px-4 py-2.5 font-semibold">{division}</td><td className="px-3 py-2.5 text-center font-bold">{ws.length}</td>
                                  <td className="px-3 py-2.5 text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-[11px] font-bold shadow-sm">{dp}</span></td>
                                  <td className="px-3 py-2.5 text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-bold">{ws.length - dp}</span></td>
                                  <td className="px-3 py-2.5 text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white text-[11px] font-bold shadow-sm">{ws.filter(w => w.verified).length}</span></td>
                                  <td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all" style={{ width: `${ws.length > 0 ? (dp / ws.length) * 100 : 0}%` }} /></div><span className="text-[11px] font-bold w-8 text-right">{ws.length > 0 ? ((dp / ws.length) * 100).toFixed(0) : 0}%</span></div></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {/* Mobile cards */}
                      <div className="md:hidden p-3 space-y-2 bg-slate-50/50 dark:bg-slate-800/20">
                        {Object.entries(byDivision).sort((a, b) => b[1].length - a[1].length).map(([division, ws]) => {
                          const dp = ws.filter(w => w.paymentStatus === "paid").length;
                          return (
                            <div key={division} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                              <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold truncate">{division}</span></div>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg py-2 border"><p className="text-[9px] font-bold text-slate-400 uppercase">Workers</p><p className="text-lg font-black">{ws.length}</p></div>
                                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg py-2 border border-emerald-200 dark:border-emerald-800"><p className="text-[9px] font-bold text-emerald-600 uppercase">Paid</p><p className="text-lg font-black text-emerald-600">{dp}</p></div>
                                <div className="bg-cyan-50 dark:bg-cyan-950/20 rounded-lg py-2 border border-cyan-200 dark:border-cyan-800"><p className="text-[9px] font-bold text-cyan-600 uppercase">Verified</p><p className="text-lg font-black text-cyan-600">{ws.filter(w => w.verified).length}</p></div>
                              </div>
                              <div className="mt-2"><div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" style={{ width: `${ws.length > 0 ? (dp / ws.length) * 100 : 0}%` }} /></div></div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mt-1">
                  <button onClick={() => setGenderExpanded(!genderExpanded)} className="w-full flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-pink-50 to-white dark:from-pink-950/20 dark:to-slate-900 hover:from-pink-100 dark:hover:from-pink-900/20 transition-colors">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><Users size={12} className="text-pink-500" /> {showZoneBreakdown ? "Gender by Zone" : "Gender Distribution"}</span>
                    <span className={`h-6 w-6 rounded-full bg-white dark:bg-slate-800 border grid place-items-center transition-transform ${genderExpanded ? "rotate-180" : ""}`}><ChevronDown size={12} /></span>
                  </button>
                  <AnimatePresence initial={false}>
                    {genderExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-3 space-y-3">
                          {showZoneBreakdown ? Object.entries(byZone).sort((a, b) => b[1].length - a[1].length).map(([zone, ws]) => {
                            const zMale = ws.filter(w => w.gender === "male").length;
                            const zFemale = ws.filter(w => w.gender === "female").length;
                            const mPct = ws.length > 0 ? (zMale / ws.length) * 100 : 50;
                            return (
                              <div key={zone} className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-bold truncate">{zone}</span>
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border shadow-sm">{zMale}M : {zFemale}F</span>
                                </div>
                                <div className="h-3 bg-white dark:bg-slate-900 rounded-full overflow-hidden flex border shadow-inner">
                                  <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-700" style={{ width: `${mPct}%` }} />
                                  <div className="h-full bg-gradient-to-r from-pink-500 to-pink-600 transition-all duration-700" style={{ width: `${100 - mPct}%` }} />
                                </div>
                              </div>
                            );
                          }) : (
                            <div className="space-y-3 p-1">
                              <div className="rounded-xl p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800"><div className="flex items-center justify-between mb-1"><span className="text-xs font-bold">Male</span><span className="text-xs font-bold text-indigo-600">{male} ({total > 0 ? ((male/total)*100).toFixed(0) : 0}%)</span></div><div className="h-3 bg-white dark:bg-slate-900 rounded-full overflow-hidden border"><div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" style={{ width: `${total > 0 ? (male/total)*100 : 0}%` }} /></div></div>
                              <div className="rounded-xl p-3 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800"><div className="flex items-center justify-between mb-1"><span className="text-xs font-bold">Female</span><span className="text-xs font-bold text-pink-600">{female} ({total > 0 ? ((female/total)*100).toFixed(0) : 0}%)</span></div><div className="h-3 bg-white dark:bg-slate-900 rounded-full overflow-hidden border"><div className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full" style={{ width: `${total > 0 ? (female/total)*100 : 0}%` }} /></div></div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                <button onClick={() => setDailyExpanded(!dailyExpanded)} className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900 hover:from-amber-100 dark:hover:from-amber-900/20 transition-colors">
                  <div className="flex items-center gap-2.5"><div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center shadow-sm"><Calendar size={12} className="text-white" /></div><div className="text-left"><p className="text-xs font-bold">Workers Registered on {new Date(dailyDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p><p className="text-[11px] text-slate-400">{dailyWorkers.length} participant{dailyWorkers.length !== 1 ? "s" : ""}</p></div></div>
                  <div className="flex items-center gap-2"><span className="hidden sm:inline-flex h-6 min-w-[28px] items-center justify-center px-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold shadow-sm">{dailyWorkers.length}</span><span className={`h-7 w-7 rounded-full bg-white dark:bg-slate-800 border grid place-items-center transition-transform ${dailyExpanded ? "rotate-180" : ""}`}><ChevronDown size={14} /></span></div>
                </button>
                <AnimatePresence initial={false}>
                  {dailyExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="hidden md:block table-scroll overflow-x-auto scrollbar-thin">
                        <table className="table-premium w-full text-xs">
                          <thead className="thead-dark"><tr className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white"><th className="text-left font-semibold px-4 py-2.5 w-10">#</th><th className="text-left font-semibold px-3 py-2.5">Name</th><th className="text-left font-semibold px-3 py-2.5">Gender</th><th className="text-left font-semibold px-3 py-2.5">Zone</th><th className="text-left font-semibold px-3 py-2.5">Region</th><th className="text-left font-semibold px-3 py-2.5">Position</th><th className="text-left font-semibold px-3 py-2.5">Payment</th><th className="text-center font-semibold px-3 py-2.5">Verified</th></tr></thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {dailyWorkers.map((w, i) => (
                              <tr key={w.id} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/10 transition-colors group">
                                <td className="px-4 py-2.5 text-slate-400 font-medium">{i + 1}</td><td className="px-3 py-2.5"><div className="flex items-center gap-2"><div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center text-white text-[10px] font-bold">{toProperCase(w.name)[0]}</div><span className="font-semibold group-hover:text-amber-600 transition-colors">{toProperCase(w.name)}</span></div></td><td className="px-3 py-2.5 capitalize"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${w.gender === "male" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-pink-50 text-pink-700 border-pink-200"}`}>{w.gender}</span></td><td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{w.zone}</td><td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{w.region}</td><td className="px-3 py-2.5"><span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border text-[11px] font-medium">{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</span></td>
                                <td className="px-3 py-2.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${w.paymentStatus === "paid" ? "bg-emerald-500 text-white border-emerald-600 shadow-sm" : "bg-amber-100 text-amber-800 border-amber-200"}`}>{w.paymentStatus}</span></td>
                                <td className="px-3 py-2.5 text-center">{w.verified ? <span className="inline-flex h-6 w-6 rounded-full bg-emerald-500 grid place-items-center shadow-sm"><CheckCircle2 size={12} className="text-white" /></span> : <span className="text-slate-300">—</span>}</td>
                              </tr>
                            ))}
                            {dailyWorkers.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-8 text-xs">No workers registered on this date</td></tr>}
                          </tbody>
                        </table>
                      </div>
                      <div className="md:hidden p-3 space-y-2 bg-slate-50/50 dark:bg-slate-800/20">
                        {dailyWorkers.map((w, i) => (
                          <div key={w.id} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex items-center justify-between mb-1.5"><div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center text-white text-xs font-bold">{toProperCase(w.name)[0]}</div><span className="text-xs font-bold truncate">{toProperCase(w.name)}</span></div><div className="flex gap-1.5 shrink-0"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${w.paymentStatus === "paid" ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-800"}`}>{w.paymentStatus}</span>{w.verified && <span className="h-5 w-5 rounded-full bg-emerald-500 grid place-items-center"><CheckCircle2 size={10} className="text-white" /></span>}</div></div>
                            <div className="flex flex-wrap gap-1.5 text-[10px]"><span className={`px-2 py-0.5 rounded-full border font-medium ${w.gender === "male" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-pink-50 text-pink-700 border-pink-200"}`}>{w.gender}</span><span className="px-2 py-0.5 rounded-full bg-slate-100 border text-slate-600">{w.zone}</span><span className="px-2 py-0.5 rounded-full bg-slate-100 border text-slate-600">{w.region}</span><span className="px-2 py-0.5 rounded-full bg-white border text-slate-600">{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</span></div>
                          </div>
                        ))}
                        {dailyWorkers.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No workers registered on this date</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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

        {/* Print: Registration — 25y: all 10 headings, landscape, professional */}
        {reportType === "registration" && (
          <div className="report-section">
            <h3 className="report-section-title">All Registered Workers — Landscape Detail</h3>
            <p className="text-[7pt] text-slate-500 mb-2">All columns: Zone, Region, Division, Name, Gender, Position, Contact, Payment, Verified • Landscape A4 • {workers.length} rows</p>
            <table className="report-table">
              <thead><tr><th>#</th><th>Zone</th><th>Region</th><th>Division</th><th>Full Name</th><th>Gender</th><th>Position</th><th>Contact</th><th>Payment</th><th>Verified</th></tr></thead>
              <tbody>
                {workers.map((w, i) => (
                  <tr key={w.id}><td>{i + 1}</td><td>{w.zone}</td><td>{w.region}</td><td>{w.division}</td><td style={{fontWeight:700}}>{toProperCase(w.name)}</td><td className="capitalize">{w.gender}</td><td>{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</td><td className="col-contact">{w.contact || "—"}</td><td className="capitalize">{w.paymentStatus}</td><td>{w.verified ? "Yes" : "No"}</td></tr>
                ))}
                {workers.length === 0 && <tr><td colSpan={10} className="text-center text-slate-400 py-4">No workers registered yet</td></tr>}
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
            <h3 className="report-section-title mt-6">Unpaid Workers — Contact Included</h3>
            <table className="report-table">
              <thead><tr><th>#</th><th>Zone</th><th>Region</th><th>Division</th><th>Name</th><th>Gender</th><th>Position</th><th>Contact</th></tr></thead>
              <tbody>
                {workers.filter(w => w.paymentStatus === "unpaid").map((w, i) => (
                  <tr key={w.id}><td>{i + 1}</td><td>{w.zone}</td><td>{w.region}</td><td>{w.division}</td><td style={{fontWeight:600}}>{toProperCase(w.name)}</td><td className="capitalize">{w.gender}</td><td>{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</td><td className="col-contact">{w.contact || "—"}</td></tr>
                ))}
                {unpaid === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-4">All workers have paid</td></tr>}
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
            <h3 className="report-section-title mt-6">Pending Verification — Contact Included</h3>
            <table className="report-table">
              <thead><tr><th>#</th><th>Zone</th><th>Region</th><th>Division</th><th>Name</th><th>Gender</th><th>Position</th><th>Contact</th></tr></thead>
              <tbody>
                {workers.filter(w => !w.verified).map((w, i) => (
                  <tr key={w.id}><td>{i + 1}</td><td>{w.zone}</td><td>{w.region}</td><td>{w.division}</td><td style={{fontWeight:600}}>{toProperCase(w.name)}</td><td className="capitalize">{w.gender}</td><td>{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</td><td className="col-contact">{w.contact || "—"}</td></tr>
                ))}
                {verified === total && <tr><td colSpan={8} className="text-center text-slate-400 py-4">All workers verified</td></tr>}
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
            <h3 className="report-section-title mt-6">Workers by Division</h3>
            <table className="report-table">
              <thead><tr><th>Division</th><th>Workers</th><th>Paid</th><th>Unpaid</th><th>Verified</th><th>Payment %</th></tr></thead>
              <tbody>
                {Object.entries(byDivision).sort((a, b) => b[1].length - a[1].length).map(([division, ws]) => {
                  const dp = ws.filter(w => w.paymentStatus === "paid").length;
                  return <tr key={division}><td>{division}</td><td>{ws.length}</td><td>{dp}</td><td>{ws.length - dp}</td><td>{ws.filter(w => w.verified).length}</td><td>{ws.length > 0 ? ((dp / ws.length) * 100).toFixed(1) : 0}%</td></tr>;
                })}
                <tr className="report-total"><td>Total</td><td>{total}</td><td>{paid}</td><td>{total - paid}</td><td>{verified}</td><td>{total > 0 ? ((paid / total) * 100).toFixed(1) : 0}%</td></tr>
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

        {/* Print: Daily — landscape with all headings */}
        {reportType === "daily" && (
          <div className="report-section">
            <h3 className="report-section-title">Workers Registered on {dailyDate} — Landscape</h3>
            <p className="text-[7pt] text-slate-500 mb-2">Zone, Region, Division, Name, Gender, Position, Contact, Payment, Verified • Landscape</p>
            <table className="report-table">
              <thead><tr><th>#</th><th>Zone</th><th>Region</th><th>Division</th><th>Full Name</th><th>Gender</th><th>Position</th><th>Contact</th><th>Payment</th><th>Verified</th></tr></thead>
              <tbody>
                {dailyWorkers.map((w, i) => (
                  <tr key={w.id}><td>{i + 1}</td><td>{w.zone}</td><td>{w.region}</td><td>{w.division}</td><td style={{fontWeight:700}}>{toProperCase(w.name)}</td><td className="capitalize">{w.gender}</td><td>{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</td><td className="col-contact">{w.contact || "—"}</td><td className="capitalize">{w.paymentStatus}</td><td>{w.verified ? "Yes" : "No"}</td></tr>
                ))}
                {dailyWorkers.length === 0 && <tr><td colSpan={10} className="text-center text-slate-400 py-4">No workers registered on this date</td></tr>}
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
  const { data } = useQuery({ queryKey: WORKERS_KEY(user), queryFn: async () => fetch("/api/auth/workers").then(r => r.json()) });
  const rawWorkers: any[] = data?.workers || [];
  const isRegional = user.role === "regional_officer";
  const scopeLabel = isRegional ? (user.region ? `Region: ${user.region}` : "Your Region") : null;
  const workers: any[] = useMemo(() => {
    if (!isRegional) return rawWorkers;
    if (!user.region) return rawWorkers;
    const want = user.region.trim().toLowerCase();
    return rawWorkers.filter((w: any) => w.region && w.region.trim().toLowerCase() === want);
  }, [rawWorkers, user.region, isRegional]);
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

    // By division (top 8) — normalize keys (trim + lowercase) so drift like
    // "Nsawam " / "nsawam" / "Nsawam" all count together under one entry.
    const byDivision: Record<string, number> = {};
    const divisionDisplay: Record<string, string> = {};
    filteredWorkers.forEach(w => {
      const raw = (w.division || "").trim();
      const key = raw.toLowerCase();
      if (!key) return;
      byDivision[key] = (byDivision[key] || 0) + 1;
      if (!divisionDisplay[key]) divisionDisplay[key] = raw;
    });
    const topDivisions = Object.entries(byDivision).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([key, count]) => ({ name: divisionDisplay[key], count }));

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
    // Division coverage
    const divisionCount = Object.keys(byDivision).length;
    const avgPerDivision = divisionCount > 0 ? (total / divisionCount).toFixed(1) : "0";

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
      divisionCount, avgPerDivision,
    };
  }, [filteredWorkers]);

  return (
    <div className="space-y-5">
      {isRegional && (
        <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-3 flex items-center gap-2.5 shadow-md">
          <div className="h-8 w-8 rounded-lg bg-white/20 grid place-items-center"><MapPin size={16} className="text-white" /></div>
          <div><p className="text-sm font-bold">Your Region Dashboard — {scopeLabel}</p><p className="text-xs text-white/80">All stats and charts below are limited to your assigned region. Full national data is not accessible.</p></div>
        </div>
      )}
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
              detail={`${stats.avgPerRegion} avg / region`}
              trend={Number(stats.avgPerRegion) > 10 ? "up" : "down"}
              insight={stats.total > 0 ? `Top region: ${stats.topRegions[0]?.name} (${((stats.topRegions[0]?.count / stats.total) * 100).toFixed(1)}%) • Top division: ${stats.topDivisions[0]?.name} (${((stats.topDivisions[0]?.count / stats.total) * 100).toFixed(1)}%). ${stats.divisionCount} divisions across ${stats.regionCount} regions.` : "No data yet."}
              accent="#6366f1"
              extra={`${stats.divisionCount} divisions • ${stats.avgPerDivision} avg / division`}
              extraIcon={<Layers size={10} />}
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
function InsightCard({ icon, title, value, unit, detail, trend, insight, accent, extra, extraIcon }: { icon: React.ReactNode; title: string; value: string | number; unit: string; detail: string; trend: "up" | "down"; insight: string; accent: string; extra?: string; extraIcon?: React.ReactNode }) {
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
      {extra && (
        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30 border border-indigo-100 dark:border-indigo-800/50 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 shadow-sm">
          {extraIcon} {extra}
        </div>
      )}
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
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: async () => fetch("/api/auth/users").then(r => r.json()) });
  const filteredUsers = useMemo(() => {
    const list: any[] = data?.users || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((u: any) => u.displayName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q) || u.zone?.toLowerCase().includes(q) || u.region?.toLowerCase().includes(q));
  }, [data?.users, searchQuery]);

  // Regional officer duplicate scan — normalized displayName (trim + lowercase + single spaces)
  const [dismissedRegDupKeys, setDismissedRegDupKeys] = useState<Set<string>>(new Set());
  const [activeRegDupKey, setActiveRegDupKey] = useState<string | null>(null);
  const regionalDupGroups = useMemo(() => {
    const regs = (data?.users || []).filter((u: any) => String(u.role).toLowerCase() === "regional_officer");
    const map: Record<string, any[]> = {};
    regs.forEach((u: any) => {
      const key = String(u.displayName || "").trim().toLowerCase().replace(/\s+/g, " ");
      if (!key || dismissedRegDupKeys.has(key)) return;
      map[key] = map[key] || [];
      map[key].push(u);
    });
    return Object.entries(map)
      .filter(([, v]) => v.length > 1)
      .map(([k, v]) => ({ key: k, users: v as any[] }))
      .sort((a, b) => b.users.length - a.users.length);
  }, [data?.users, dismissedRegDupKeys]);

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

  useEffect(() => {
    if (editingUser) {
      setEditForm({ displayName: editingUser.displayName || "", username: editingUser.username || "", email: editingUser.email || "", role: editingUser.role, zone: editingUser.zone || "", region: editingUser.region || "" });
      setEditError(null);
      setEditSuccess(null);
    }
  }, [editingUser]);

  const updateUser = useMutation({
    mutationFn: async ({ userId, patch }: { userId: string; patch: any }) => {
      const r = await fetch("/api/auth/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, ...patch }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      return j;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setEditSuccess("User updated successfully"); setEditError(null); setTimeout(() => { setEditingUser(null); setEditSuccess(null); }, 1500); },
    onError: (e: any) => { setEditError(e.message); setEditSuccess(null); },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">All Users ({data?.users?.length || 0})</h3>
        <Button onClick={() => { setShowCreate(true); setTempPw(null); setError(null); }} className="gap-1.5"><UserPlus size={16} /> Create User</Button>
      </div>
      {/* Premium Search Pane */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, username, email, role, zone, region..." className="pl-9 pr-9 h-10 rounded-xl" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={16} /></button>}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-300 border border-indigo-200 font-medium">{filteredUsers.length} of {data?.users?.length || 0}</span>
          <span className="hidden sm:inline">• Click a user to edit details or reset password</span>
        </div>
      </div>
      {regionalDupGroups.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center shadow-sm shrink-0"><Users size={14} className="text-white" /></div>
              <div className="min-w-0">
                <p className="text-sm font-bold flex items-center gap-1.5"><AlertTriangle size={12} className="text-amber-600" /> Potential duplicate regional officers — {regionalDupGroups.length} name{regionalDupGroups.length > 1 ? "s" : ""} ({regionalDupGroups.reduce((a, g) => a + g.users.length, 0)} accounts)</p>
                <p className="text-[11px] text-slate-500">Same display name after trimming/casing. Keep as distinct people or review.</p>
              </div>
            </div>
            <button onClick={() => setActiveRegDupKey(regionalDupGroups[0].key)} className="shrink-0 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-50">Review</button>
          </div>
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {regionalDupGroups.slice(0, 6).map(g => (
              <div key={g.key} className="bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-amber-800 p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0"><p className="text-xs font-bold truncate">{toProperCase(g.users[0].displayName)}</p><p className="text-[10px] text-slate-400 truncate">{g.users.length} accounts • e.g. {g.users.map((u: any) => u.region || "—").join(", ")}</p></div>
                <button onClick={() => setDismissedRegDupKeys(prev => new Set([...prev, g.key]))} className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600">Keep distinct</button>
              </div>
            ))}
          </div>
          {regionalDupGroups.length > 6 && <p className="text-[11px] text-slate-400 mt-2 text-center">+ {regionalDupGroups.length - 6} more groups — use Review</p>}
        </div>
      )}
      {/* Duplicate review dialog */}
      <AnimatePresence>
        {activeRegDupKey && (() => {
          const group = regionalDupGroups.find(g => g.key === activeRegDupKey) || regionalDupGroups[0];
          if (!group) return null;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setActiveRegDupKey(null)}>
              <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div><h3 className="font-semibold text-sm">Duplicate name: {toProperCase(group.users[0].displayName)}</h3><p className="text-xs text-slate-400">{group.users.length} regional officer accounts share this name</p></div>
                  <button onClick={() => setActiveRegDupKey(null)} className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 grid place-items-center"><X size={16} /></button>
                </div>
                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                  {group.users.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <div className="min-w-0"><p className="text-sm font-semibold truncate">{toProperCase(u.displayName)}</p><p className="text-[11px] text-slate-500 truncate">{u.username} • {u.email}</p><p className="text-[11px] text-slate-400 truncate">{u.zone || "—"} › {u.region || "—"}</p></div>
                      <button onClick={() => { setSearchQuery(u.displayName); setActiveRegDupKey(null); }} className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700">View</button>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setActiveRegDupKey(null)}>Close</Button>
                  <Button onClick={() => { setDismissedRegDupKeys(prev => new Set([...prev, group.key])); setActiveRegDupKey(null); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">Keep distinct — dismiss</Button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
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
          {/* Mobile: card list — click to edit */}
          <div className="md:hidden space-y-3">
            {filteredUsers?.map((u: any) => (
              <div key={u.id} onClick={() => setEditingUser(u)} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate flex items-center gap-1.5">{u.displayName} <ChevronRight size={12} className="text-slate-300 group-hover:text-indigo-400 transition-colors" /></p>
                    <p className="text-[11px] text-slate-400 truncate">{u.email} • @{u.username}</p>
                  </div>
                  {u.isActive ? <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">Active</span> : <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600">Inactive</span>}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{u.role?.replace("_", " ")}</span>
                  {(u.zone || u.region) && <span className="text-[10px] text-slate-400">{[u.zone, u.region].filter(Boolean).join(" › ")}</span>}
                  {u.isTempPassword && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">Temp password pending</span>}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={(e) => { e.stopPropagation(); setEditingUser(u); }} className="flex-1 min-h-[36px] py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 hover:bg-indigo-100 inline-flex items-center justify-center gap-1.5"><Settings size={12} /> Edit Details</button>
                  <button onClick={(e) => { e.stopPropagation(); setResetTarget({ id: u.id, name: u.displayName }); setResetError(null); setResetSuccess(null); setNewPassword(""); }} className="flex-1 min-h-[36px] py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 inline-flex items-center justify-center gap-1.5"><Key size={12} /> Reset Password</button>
                  <button onClick={(e) => { e.stopPropagation(); toggleActive.mutate({ userId: u.id, action: u.isActive ? "deactivate" : "activate" }); }} className={`px-3 min-h-[36px] py-1.5 rounded-lg text-xs font-semibold ${u.isActive ? "bg-slate-100 dark:bg-slate-800 text-slate-500" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"}`}>{u.isActive ? "Deactivate" : "Activate"}</button>
                </div>
              </div>
            ))}
            {filteredUsers?.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-sm text-slate-400">{searchQuery ? `No users match "${searchQuery}"` : "No users found."}</div>
            )}
          </div>
          {/* Desktop: table — click row to edit — premium */}
          <div className="hidden md:block table-premium-wrap">
            <div className="table-scroll overflow-x-auto scrollbar-thin">
              <table className="table-premium w-full text-sm min-w-[800px]">
                <thead className="thead-dark text-left text-white bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700"><tr><th className="px-4 py-3 font-semibold">Name</th><th className="px-3 py-3 font-semibold">Username</th><th className="px-3 py-3 font-semibold">Role</th><th className="px-3 py-3 font-semibold">Zone → Region</th><th className="px-3 py-3 font-semibold">Temp Pw</th><th className="px-3 py-3 font-semibold">Status</th><th className="text-right px-4 py-3 font-semibold">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers?.map((u: any) => (
                    <tr key={u.id} onClick={() => setEditingUser(u)} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 cursor-pointer group transition-colors">
                      <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 grid place-items-center text-white text-xs font-bold">{u.displayName[0]}</div><div><p className="font-medium group-hover:text-indigo-600 transition-colors">{u.displayName}</p><p className="text-xs text-slate-400">{u.email}</p></div></div></td>
                      <td className="px-3 py-3"><span className="px-2 py-1 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 border text-slate-600">@{u.username}</span></td>
                      <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{u.role?.replace("_", " ")}</span></td>
                      <td className="px-3 py-3 text-xs text-slate-500">{[u.zone, u.region].filter(Boolean).join(" › ") || "—"}</td>
                      <td className="px-3 py-3">{u.isTempPassword ? <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 border border-amber-200">Pending</span> : <span className="text-xs text-slate-400">Changed</span>}</td>
                      <td className="px-3 py-3">{u.isActive ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">● Active</span> : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">● Inactive</span>}</td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}><div className="flex items-center justify-end gap-1">
                        <button title="Edit details" onClick={() => setEditingUser(u)} className="h-7 w-7 grid place-items-center rounded-md bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 text-indigo-600"><Settings size={14} /></button>
                        <button title="Reset Password" onClick={() => { setResetTarget({ id: u.id, name: u.displayName }); setResetError(null); setResetSuccess(null); setNewPassword(""); }} className="h-7 w-7 grid place-items-center rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600"><Key size={14} /></button>
                        <button onClick={() => toggleActive.mutate({ userId: u.id, action: u.isActive ? "deactivate" : "activate" })} className="h-7 w-7 grid place-items-center rounded-md hover:bg-slate-100">{u.isActive ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} className="text-red-500" />}</button>
                      </div></td>
                    </tr>
                  ))}
                  {filteredUsers?.length === 0 && <tr><td colSpan={7} className="table-empty"><div className="table-empty-icon"><Search size={16} /></div><p className="text-sm font-medium">{searchQuery ? `No users match "${searchQuery}"` : "No users found."}</p><p className="text-xs mt-1">Try adjusting search or create a new user</p></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>{filteredUsers.length} of {data?.users?.length || 0} users • click row to edit</span>{filteredUsers?.length !== data?.users?.length && <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 text-[10px] font-bold">Filtered</span>}</div>
          </div>
        </>
      )}
      {/* Edit User Modal — premium 25y */}
      <AnimatePresence>
        {editingUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4" onClick={() => { if (!updateUser.isPending) setEditingUser(null); }}>
            <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 grid place-items-center"><Settings size={18} className="text-white" /></div>
                  <div><h4 className="font-semibold">Edit User</h4><p className="text-xs text-white/80 truncate">{editingUser.displayName} • @{editingUser.username}</p></div>
                </div>
                <button onClick={() => setEditingUser(null)} className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 grid place-items-center transition-colors"><X size={16} className="text-white" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Full Name</Label><Input value={editForm.displayName || ""} onChange={e => setEditForm({ ...editForm, displayName: e.target.value })} placeholder="Full Name" className="mt-1" /></div>
                  <div><Label>Username *</Label><Input value={editForm.username || ""} onChange={e => setEditForm({ ...editForm, username: e.target.value })} placeholder="username" className="mt-1 font-mono text-sm" /></div>
                </div>
                <div><Label>Email</Label><Input type="email" value={editForm.email || ""} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="user@dclm.org" className="mt-1" /></div>
                <div><Label>Role</Label><select value={editForm.role || ""} onChange={e => setEditForm({ ...editForm, role: e.target.value, zone: "", region: "" } as any)} className="mt-1 flex h-10 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm"><option value="viewer">Viewer</option><option value="verifier">Verifier</option><option value="regional_officer">Regional Officer</option><option value="national_officer">National Officer</option><option value="super_admin">Super Administrator</option></select></div>
                {(editForm.role === "regional_officer" || editForm.role === "verifier") && (
                  <div className="grid sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                    <div><Label>Zone</Label><select value={editForm.zone || ""} onChange={e => setEditForm({ ...editForm, zone: e.target.value, region: "" })} className="mt-1 flex h-10 w-full rounded-xl border bg-white dark:bg-slate-900 px-3 text-sm"><option value="">Select zone</option>{Object.keys(ZONE_STRUCTURE).map(z => <option key={z} value={z}>{z}</option>)}</select></div>
                    <div><Label>Region</Label><select value={editForm.region || ""} onChange={e => setEditForm({ ...editForm, region: e.target.value })} disabled={!editForm.zone} className="mt-1 flex h-10 w-full rounded-xl border bg-white dark:bg-slate-900 px-3 text-sm disabled:opacity-50"><option value="">{editForm.zone ? "Select region" : "Select zone first"}</option>{editForm.zone && Object.keys(ZONE_STRUCTURE[editForm.zone] || {}).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                  </div>
                )}
                {editError && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-xl px-3 py-2 border border-red-200">{editError}</p>}
                {editSuccess && <p className="text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl px-3 py-2 border border-emerald-200 flex items-center gap-2"><CheckCircle2 size={14} /> {editSuccess}</p>}
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 flex items-center justify-between gap-3">
                  <div><p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Need to reset password?</p><p className="text-[11px] text-amber-700 dark:text-amber-300">Set a new password for this user</p></div>
                  <Button variant="outline" size="sm" onClick={() => { const u = editingUser; setEditingUser(null); setResetTarget({ id: u.id, name: u.displayName }); setNewPassword(""); setResetError(null); }} className="shrink-0 gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100"><Key size={14} /> Reset Password</Button>
                </div>
              </div>
              <div className="px-6 py-4 border-t bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-2 sticky bottom-0">
                <Button variant="outline" onClick={() => setEditingUser(null)} disabled={updateUser.isPending}>Cancel</Button>
                <Button onClick={() => updateUser.mutate({ userId: editingUser.id, patch: { username: editForm.username.trim(), displayName: editForm.displayName.trim(), email: editForm.email.trim(), role: editForm.role, zone: editForm.zone || null, region: editForm.region || null } })} disabled={updateUser.isPending || !editForm.username?.trim() || !editForm.displayName?.trim() || !editForm.email?.trim()} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white gap-1.5">{updateUser.isPending ? "Saving..." : "Save Changes"}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

function FormSelect({ icon: Icon, label, value, onChange, disabled, placeholder, children, required, error }: {
  icon: any;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  placeholder: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
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
          className={`flex h-11 w-full rounded-xl border pl-10 pr-9 py-2 text-sm bg-white dark:bg-slate-900 disabled:opacity-50 appearance-none cursor-pointer focus:outline-none focus:ring-2 transition-all ${error ? "border-red-400 dark:border-red-500 focus:ring-red-500/20 focus:border-red-400" : "border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-400"}`}
        >
          <option value="" disabled>{placeholder}</option>
          {children}
        </select>
        <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${error ? "text-red-400" : "text-slate-400"}`} />
      </div>
      {error && <p className="text-[11px] font-medium text-red-600 mt-1">{error}</p>}
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
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped?: number; skippedDetails?: { row: number; message: string }[]; errors: { row: number; message: string }[]; total: number; error?: string } | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [showDupDialog, setShowDupDialog] = useState(false);
  const [dupInfo, setDupInfo] = useState<{ duplicates: any[]; validCount: number; duplicateCount: number } | null>(null);
  const [zone, setZone] = useState(""); const [region, setRegion] = useState(""); const [division, setDivision] = useState("");
  const [name, setName] = useState(""); const [gender, setGender] = useState<any>("");
  const [position, setPosition] = useState<any>(""); const [paymentStatus, setPaymentStatus] = useState<any>("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null); const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [editingWorker, setEditingWorker] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: WORKERS_KEY(user), queryFn: async () => fetch("/api/auth/workers").then(r => r.json()) });
  const isRegional = user.role === "regional_officer";
  const scopeLabel = isRegional ? (user.region ? `Region: ${user.region}` : "Your Region") : null;
  const visibleWorkers = useMemo(() => {
    if (!isRegional) return data?.workers || [];
    if (!user.region) return data?.workers || [];
    const want = user.region.trim().toLowerCase();
    return (data?.workers || []).filter((w: any) => w.region && w.region.trim().toLowerCase() === want);
  }, [data?.workers, user.region, isRegional]);
  const zones = Object.keys(ZONE_STRUCTURE);
  const regions = zone ? Object.keys(ZONE_STRUCTURE[zone] || {}) : [];
  const divisions = zone && region ? ZONE_STRUCTURE[zone]?.[region] || [] : [];
  const { data: locks } = useQuery({ queryKey: ["locks"], queryFn: async () => fetch("/api/auth/admin/locks").then(r => r.json()), refetchInterval: 15000 });
  const registrationLocked = locks?.registrationLocked ?? false;
  const isSuper = user.role === "super_admin";
  const toggleRegistrationLock = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/auth/admin/locks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registrationLocked: !registrationLocked }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error); return j;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locks"] }),
    onError: (e: any) => alert(e.message),
  });

  const createWorker = useMutation({
    mutationFn: async () => { const r = await fetch("/api/auth/workers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, gender, zone, region, division, position, paymentStatus, contact }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workers"] }); setSuccess(`"${name}" registered`); setName(""); setZone(""); setRegion(""); setDivision(""); setGender(""); setPosition(""); setPaymentStatus(""); setContact(""); setError(null); setFieldErrors({}); setTimeout(() => setSuccess(null), 3000); },
    onError: (e: any) => setError(e.message),
  });

  function handleRegister() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Full name is required.";
    if (!gender) errs.gender = "Select the worker's gender.";
    if (!zone) errs.zone = "Select the worker's zone.";
    if (!region) errs.region = "Select the worker's region.";
    if (!division) errs.division = "Select the worker's division.";
    if (!position) errs.position = "Select the worker's position.";
    if (!paymentStatus) errs.paymentStatus = "Select the payment status.";
    if (!contact.trim()) errs.contact = "Contact number is required (10 digits).";
    else if (!/^\d{10}$/.test(contact.trim())) errs.contact = "Contact must be exactly 10 digits (e.g. 0244123456).";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError("Some details are missing. Fill in every highlighted field, then try again.");
      setSuccess(null);
      return;
    }
    setError(null);
    createWorker.mutate();
  }
  const deleteWorker = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch("/api/auth/workers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workerId: id, action: "delete" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Delete failed");
      return j;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workers"] }),
    onError: (e: any) => alert(e.message),
  });
  const toggleVerify = useMutation({ mutationFn: async (id: string) => fetch("/api/auth/workers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workerId: id, action: "toggleVerified" }) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["workers"] }) });
  const updateWorker = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const r = await fetch("/api/auth/workers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workerId: id, patch }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Update failed");
      return j;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workers"] }); setEditSuccess("Updated successfully"); setEditError(null); setTimeout(() => { setEditingWorker(null); setEditSuccess(null); }, 1600); },
    onError: (e: any) => { setEditError(e.message); setEditSuccess(null); },
  });

  const canDelete = isAdmin(user.role as RoleType) || user.role === "super_admin" || user.role === "national_officer";
  const normRegion = (s: any) => String(s || "").trim().toLowerCase().replace(/[\s\-_]+/g, "");
  const canEdit = (w: any) => {
    if (isAdmin(user.role as RoleType) || user.role === "super_admin" || user.role === "national_officer") return true;
    if (user.role === "regional_officer") {
      if (!user.region) return true;
      if (w.region && normRegion(w.region) === normRegion(user.region)) return true;
      return false;
    }
    return false;
  };
  const filteredWorkers = useMemo(() => {
    const list = visibleWorkers;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((w: any) => w.name.toLowerCase().includes(q) || w.zone.toLowerCase().includes(q) || w.region.toLowerCase().includes(q) || w.division.toLowerCase().includes(q) || (POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position).toLowerCase().includes(q) || w.gender.toLowerCase().includes(q));
  }, [visibleWorkers, searchQuery]);
  const missingContactWorkers = useMemo(() => visibleWorkers.filter((w: any) => !w.contact || !/^\d{10}$/.test(String(w.contact).trim())), [visibleWorkers]);
  const [showMissing, setShowMissing] = useState(false);
  const [deletingMissing, setDeletingMissing] = useState(false);

  const handleDeleteMissing = async () => {
    if (!confirm(`Delete all ${missingContactWorkers.length} red-flagged workers with missing/invalid contact? This cannot be undone. You can then re-upload the fixed file.`)) return;
    setDeletingMissing(true);
    try {
      const r = await fetch("/api/auth/workers?missingContact=1", { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Delete failed");
      await qc.invalidateQueries({ queryKey: ["workers"] });
      setShowMissing(false);
      setShowBulk(true);
      setBulkPreview(null); setBulkResult(null); setBulkErrors(null); setBulkFile(null);
    } catch (e: any) { alert(e.message); }
    finally { setDeletingMissing(false); }
  };

  const startEdit = (w: any) => {
    setEditingWorker(w);
    setEditForm({ name: w.name, gender: w.gender, zone: w.zone, region: w.region, division: w.division, position: w.position, paymentStatus: w.paymentStatus, contact: w.contact || "", contact2: w.contact2 || "" });
    setEditError(null);
    setEditSuccess(null);
  };

  function parseCSV(text: string) {
    const lines = text.trim().split(/\r?\n/).filter((l: string) => l.trim() && !l.trim().startsWith("#"));
    if (lines.length < 2) return { headers: [], rows: [] };
    const rawHeaders = lines[0].split(",").map((h: string) => h.trim());
    // Handle duplicate Contact columns (second Contact -> Contact_2)
    const seen: Record<string, number> = {};
    const headers = rawHeaders.map(h => {
      const c = seen[h.toLowerCase()] || 0;
      seen[h.toLowerCase()] = c + 1;
      if (c > 0 && h.toLowerCase() === "contact") return "Contact_2";
      return h;
    });
    const rows = lines.slice(1).map((line: string) => {
      const values = line.split(",").map((v: string) => v.trim());
      const obj: any = {};
      headers.forEach((h: string, i: number) => { obj[h] = values[i] || ""; });
      return obj;
    });
    return { headers, rows };
  }

  async function parseExcelFile(file: File): Promise<{ headers: string[]; rows: any[] }> {
    const ExcelJS = (await import("exceljs")).default;
    const buf = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.worksheets[0];
    if (!ws) return { headers: [], rows: [] };
    // Find header row (headers-only template, row 1, scan for Zone header)
    let headerRowIdx = 1;
    let headers: string[] = [];
    ws.eachRow((row, rowNumber) => {
      const vals = (row.values as any[]).slice(1).map(v => String(v ?? "").trim());
      if (vals.some(v => v.toLowerCase() === "zone") && vals.some(v => v.toLowerCase().includes("full name"))) {
        headerRowIdx = rowNumber;
        // Handle duplicate Contact
        const seen: Record<string, number> = {};
        headers = vals.map(h => {
          const c = seen[h.toLowerCase()] || 0;
          seen[h.toLowerCase()] = c + 1;
          if (c > 0 && h.toLowerCase() === "contact") return "Contact_2";
          return h;
        });
      }
    });
    if (headers.length === 0) return { headers: [], rows: [] };
    const rows: any[] = [];
    ws.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIdx) return;
      const vals = (row.values as any[]).slice(1).map(v => {
        if (v == null) return "";
        if (typeof v === "object" && (v as any).text) return String((v as any).text).trim();
        return String(v).trim();
      });
      // Skip empty rows and example row (first data row is example with John Mensah - only skip if all? Actually include example as detectable)
      const isEmpty = vals.every(v => !v);
      if (isEmpty) return;
      // Skip the example row if it's the immediate row after header and contains John Mensah
      if (rowNumber === headerRowIdx + 1 && vals.some(v => v.toLowerCase().includes("john mensah"))) return;
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
      // Only add rows that have at least one required field filled
      if (Object.values(obj).some(v => String(v).trim())) rows.push(obj);
    });
    return { headers, rows };
  }

  function handleBulkFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);
    setBulkResult(null);
    setBulkErrors(null);
    const isExcel = file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls");
    if (isExcel) {
      parseExcelFile(file).then(parsed => {
        setBulkPreview(parsed);
        if (parsed.headers.length === 0) {
          setBulkErrors([{ row: 0, message: "Could not read the Excel file. Please download the template and fill it correctly." }]);
          return;
        }
        const REQUIRED = ["Zone", "Region", "Division", "Full Name", "Gender", "Position", "Contact", "Payment"];
        const missingHeaders = REQUIRED.filter(h => !parsed.headers.some(ph => ph.toLowerCase() === h.toLowerCase()));
        if (missingHeaders.length > 0) {
          setBulkErrors([{ row: 0, message: `Your file is missing these required columns: ${missingHeaders.join(", ")}. Download the template and use the exact column names.` }]);
        }
      }).catch(() => setBulkErrors([{ row: 0, message: "Failed to read Excel file. Please ensure it is a valid .xlsx file." }]));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setBulkPreview(parsed);
      if (parsed.headers.length === 0) {
        setBulkErrors([{ row: 0, message: "This file is empty or has no header row. Download the template, fill in your workers, then upload it." }]);
        return;
      }
      const REQUIRED = ["Zone", "Region", "Division", "Full Name", "Gender", "Position", "Contact", "Payment"];
      const missingHeaders = REQUIRED.filter(h => !parsed.headers.some(ph => ph.toLowerCase() === h.toLowerCase()));
      if (missingHeaders.length > 0) {
        setBulkErrors([{ row: 0, message: `Your file is missing these required columns: ${missingHeaders.join(", ")}. Download the template and use the exact column names.` }]);
      }
    };
    reader.readAsText(file);
  }

  async function doBulkRequest(payload: any) {
    setBulkUploading(true);
    try {
      const r = await fetch("/api/auth/workers/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (j.needsConfirmation) {
        if (j.confirmationType === "replaceAll") {
          setShowModeDialog(true);
          (window as any).__pendingBulkPayload = payload;
          (window as any).__existingCount = j.existingCount;
          return;
        }
        if (j.confirmationType === "duplicates") {
          setDupInfo(j);
          setShowDupDialog(true);
          (window as any).__pendingBulkPayload = payload;
          return;
        }
      }
      if (!r.ok && !j.created) {
        const perRow = (j.errors || j.rowErrors || []) as any[];
        const errs = perRow.length > 0 ? perRow : [{ row: 0, message: j.error || "Upload failed. Please check your file and try again." }];
        setBulkResult({ created: 0, errors: errs, skipped: j.skipped || 0, skippedDetails: j.skippedDetails || [], total: j.total || 0, error: j.error });
        return;
      }
      if (j.created > 0 || (j.created === 0 && (j.errors?.length || j.skipped))) await qc.invalidateQueries({ queryKey: ["workers"] });
      setBulkResult(j);
      setShowModeDialog(false);
      setShowDupDialog(false);
    } catch {
      setBulkErrors([{ row: 0, message: "Upload failed. Please check your connection and try again." }]);
    } finally {
      setBulkUploading(false);
    }
  }

  function handleBulkUpload() {
    if (!bulkPreview?.rows.length) { setBulkErrors([{ row: 0, message: "Your file has no worker rows. Add at least one row, then upload again." }]); return; }
    const existingCount = data?.workers?.length || 0;
    // Professional UX: if data exists, ask delete-all vs append first
    if (existingCount > 0) {
      setShowModeDialog(true);
      return;
    }
    doBulkRequest({ rows: bulkPreview.rows, mode: "append", onDuplicate: "skip", confirmed: true });
  }

  function handleModeChoice(mode: "replace" | "append") {
    if (mode === "replace") {
      // Second confirm for destructive action
      doBulkRequest({ rows: bulkPreview!.rows, mode, confirmed: true });
    } else {
      doBulkRequest({ rows: bulkPreview!.rows, mode: "append", confirmed: false });
    }
  }

  function handleDuplicateChoice(action: "skip" | "replace") {
    const base = (window as any).__pendingBulkPayload || { rows: bulkPreview!.rows, mode: "append" };
    doBulkRequest({ ...base, onDuplicate: action, confirmed: true });
  }

  return (
    <div className="space-y-4">
      {isRegional && (
        <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-3 flex items-center gap-2.5 shadow-md">
          <div className="h-8 w-8 rounded-lg bg-white/20 grid place-items-center"><Users size={16} className="text-white" /></div>
          <div><p className="text-sm font-bold">Worker Registration — {scopeLabel}</p><p className="text-xs text-white/80">You can register, search, and edit workers only in your assigned region. Use bulk reupload to update within your access level.</p></div>
        </div>
      )}
      {/* Registration lock — super_admin only */}
      {registrationLocked && (
        <div className={`rounded-xl border p-3 flex items-center justify-between ${isSuper ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20" : "bg-red-50 border-red-200 dark:bg-red-950/20"}`}>
          <div className="flex items-center gap-2 text-sm font-medium"><AlertTriangle size={14} className={isSuper ? "text-amber-600" : "text-red-500"} /> Registration is LOCKED by super_admin{!isSuper && " — only super_admin can register now"}</div>
          {isSuper && <Button size="sm" variant="outline" onClick={() => toggleRegistrationLock.mutate()} disabled={toggleRegistrationLock.isPending} className="gap-1.5">{toggleRegistrationLock.isPending ? "..." : "Unlock"}</Button>}
        </div>
      )}
      {!registrationLocked && isSuper && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 flex items-center justify-between">
          <span className="text-xs font-medium flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Registration: OPEN</span>
          <Button size="sm" variant="outline" onClick={() => toggleRegistrationLock.mutate()} disabled={toggleRegistrationLock.isPending} className="gap-1.5">{toggleRegistrationLock.isPending ? "..." : "Lock registration"}</Button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="font-semibold">Registered Workers ({visibleWorkers.length}) {isRegional ? `• ${scopeLabel}` : ""}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {user.role !== "verifier" && (isAdmin(user.role as RoleType) || user.role === "national_officer") && (
            <a href="/api/auth/workers/export" download className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><Download size={14} /> Export CSV</a>
          )}
          {user.role !== "verifier" && (
            <Button variant="outline" size="sm" disabled={registrationLocked && !isSuper} onClick={() => { setShowBulk(!showBulk); setShowForm(false); setBulkPreview(null); setBulkResult(null); setBulkErrors(null); setBulkFile(null); }} className="gap-1.5 disabled:opacity-50"><Upload size={14} /> Bulk Upload</Button>
          )}
          {user.role !== "verifier" && (isAdmin(user.role as RoleType) || user.role === "national_officer") && data?.workers?.some((w: any) => w.registeredByName === "Bulk Import") && (
            <Button variant="outline" size="sm" onClick={() => setShowCleanup(!showCleanup)} className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/20"><AlertTriangle size={14} /> Clean Up</Button>
          )}
          <Button disabled={registrationLocked && !isSuper} onClick={() => { setShowForm(true); setShowBulk(false); setError(null); setSuccess(null); setFieldErrors({}); }} className="gap-1.5 disabled:opacity-50"><UserPlus size={14} /> Register Worker</Button>
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
                      <Input value={name} onChange={e => { setName(e.target.value); if (fieldErrors.name) setFieldErrors(f => ({ ...f, name: "" })); }} placeholder="e.g. John Mensah" className={`h-11 ${fieldErrors.name ? "border-red-400 focus:ring-red-500/20 focus:border-red-400" : ""}`} />
                      {fieldErrors.name && <p className="text-[11px] font-medium text-red-600 mt-1">{fieldErrors.name}</p>}
                    </div>
                    <FormSelect icon={User} label="Gender" value={gender} onChange={e => { setGender(e.target.value); if (fieldErrors.gender) setFieldErrors(f => ({ ...f, gender: "" })); }} placeholder="Select gender..." required error={fieldErrors.gender}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </FormSelect>
                  </div>
                </div>
                {/* ── Contact — compulsory 10-digit ── */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5"><CreditCard size={12} /> Contact Details</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Contact Number *</Label>
                      <Input value={contact} onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 10); setContact(v); if (fieldErrors.contact) setFieldErrors(f => ({ ...f, contact: "" })); }} placeholder="0244123456" inputMode="numeric" maxLength={10} className={`h-11 ${fieldErrors.contact ? "border-red-400 focus:ring-red-500/20 focus:border-red-400" : ""}`} />
                      {fieldErrors.contact ? <p className="text-[11px] font-medium text-red-600 mt-1">{fieldErrors.contact}</p> : <p className="text-[10px] text-slate-400 mt-1">{contact.length}/10 digits</p>}
                    </div>
                  </div>
                </div>
                {/* ── Location ── */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5"><MapPin size={12} /> Location Details</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <FormSelect icon={MapPin} label="Zone" value={zone} onChange={e => { setZone(e.target.value); setRegion(""); setDivision(""); setFieldErrors(f => ({ ...f, zone: "", region: "", division: "" })); }} placeholder="Select zone..." required error={fieldErrors.zone}>
                      {zones.map(z => <option key={z} value={z}>{z}</option>)}
                    </FormSelect>
                    <FormSelect icon={Building2} label="Region" value={region} onChange={e => { setRegion(e.target.value); setDivision(""); setFieldErrors(f => ({ ...f, region: "", division: "" })); }} disabled={!zone} placeholder="Select region..." required error={fieldErrors.region}>
                      {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </FormSelect>
                    <FormSelect icon={Layers} label="Division" value={division} onChange={e => { setDivision(e.target.value); if (fieldErrors.division) setFieldErrors(f => ({ ...f, division: "" })); }} disabled={!region} placeholder="Select division..." required error={fieldErrors.division}>
                      {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                    </FormSelect>
                  </div>
                </div>
                {/* ── Role & Status ── */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5"><Briefcase size={12} /> Role & Payment</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <FormSelect icon={Briefcase} label="Position" value={position} onChange={e => { setPosition(e.target.value); if (fieldErrors.position) setFieldErrors(f => ({ ...f, position: "" })); }} placeholder="Select position..." required error={fieldErrors.position}>
                      {Object.entries(POSITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </FormSelect>
                    <FormSelect icon={CreditCard} label="Payment Status" value={paymentStatus} onChange={e => { setPaymentStatus(e.target.value); if (fieldErrors.paymentStatus) setFieldErrors(f => ({ ...f, paymentStatus: "" })); }} placeholder="Select payment status..." required error={fieldErrors.paymentStatus}>
                      {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </FormSelect>
                  </div>
                </div>
                {/* ── Messages ── */}
                {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 rounded-xl px-4 py-2.5"><AlertTriangle size={14} /> {error}</div>}
                {success && <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl px-4 py-2.5"><CheckCircle2 size={14} /> {success}</div>}
                {/* ── Submit ── */}
                <Button loading={createWorker.isPending} onClick={handleRegister} className="w-full sm:w-auto h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-500/20"><Plus size={16} /> Register Worker</Button>
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
                {/* Download Template - Beautiful Excel */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border border-indigo-200 dark:border-indigo-800 px-4 py-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 grid place-items-center shrink-0 shadow-lg shadow-indigo-500/20"><FileSpreadsheet size={18} className="text-white" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Download Excel Template</p>
                    <p className="text-xs text-slate-500">Beautifully formatted • 9 columns • Verification is done at event day</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {["Zone", "Region", "Division", "Full Name", "Gender", "Position", "Contact", "Payment", "Contact"].map(h => (
                        <span key={h + Math.random()} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">{h}</span>
                      ))}
                    </div>
                  </div>
                  <a href="/api/auth/workers/bulk" download className="shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 text-xs font-semibold hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20 transition-all"><Download size={14} /> Download .xlsx</a>
                </div>
                {/* File Upload Zone */}
                <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${bulkFile ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/10" : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600"}`}>
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={handleBulkFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Upload size={24} className={`mx-auto ${bulkFile ? "text-emerald-500" : "text-slate-400"}`} />
                  {bulkFile ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{bulkFile.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{bulkPreview?.rows.length || 0} rows detected</p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Drop Excel or CSV file here or click to browse</p>
                      <p className="text-xs text-slate-400 mt-1">Accepts .xlsx, .xls and .csv files</p>
                    </div>
                  )}
                </div>
                {/* Client-side file errors */}
                {bulkErrors && !bulkResult && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 space-y-1.5">
                    {bulkErrors.map((e, i) => (
                      <p key={i} className="text-xs text-red-700 dark:text-red-300 flex items-start gap-2"><AlertTriangle size={14} className="shrink-0 mt-0.5" /> {e.message}</p>
                    ))}
                  </div>
                )}
                {/* Preview Table */}
                {bulkPreview && bulkPreview.rows.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Preview (first 10 rows) • {bulkPreview.rows.length} total</p>
                    <div className="table-premium-wrap">
                      <div className="table-scroll overflow-x-auto scrollbar-thin">
                        <table className="table-premium w-full text-xs">
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
                      <div className="table-footer"><span>Showing 10 of {bulkPreview.rows.length} rows</span>{bulkPreview.rows.length > 10 && <span>...and {bulkPreview.rows.length - 10} more</span>}</div>
                    </div>
                  </div>
                )}
                {/* Upload Button */}
                {bulkPreview && bulkPreview.rows.length > 0 && !bulkResult && (
                  <Button loading={bulkUploading} onClick={handleBulkUpload} className="gap-1.5"><Upload size={14} /> Upload {bulkPreview.rows.length} Workers</Button>
                )}
                {/* Result — every skipped/rejected row gets its reason in plain language */}
                {bulkResult && (
                  <div className={`rounded-xl p-4 ${bulkResult.errors?.length > 0 || bulkResult.skipped ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800" : "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200"}`}>
                    <div className="flex items-start gap-2">
                      {bulkResult.errors?.length > 0 || bulkResult.skipped ? <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" /> : <span className="text-emerald-500 text-lg shrink-0">&#10003;</span>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{bulkResult.created} of {bulkResult.total} workers imported successfully{bulkResult.skipped ? ` • ${bulkResult.skipped} skipped` : ""}{bulkResult.errors?.length ? ` • ${bulkResult.errors.length} need fixing` : ""}</p>
                        {bulkResult.error && bulkResult.errors?.length === 0 && bulkResult.skipped === 0 && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{bulkResult.error}</p>}
                        {bulkResult.error && (bulkResult.errors?.length > 0 || bulkResult.skipped) && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{bulkResult.error}</p>}
                      </div>
                    </div>
                    {/* Failed rows — every row lists why it was rejected */}
                    {bulkResult.errors?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1.5">Rows that were NOT imported — fix these and upload again</p>
                        <div className="max-h-64 overflow-y-auto divide-y divide-amber-100 dark:divide-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900">
                          {bulkResult.errors.map((e: any, i: number) => (
                            <div key={i} className="flex gap-2.5 px-3 py-2.5 text-left">
                              <span className="shrink-0 h-6 min-w-[28px] px-1.5 grid place-items-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[11px] font-bold">Row {e.row || "—"}</span>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex-1">{e.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Skipped rows — duplicates, per-row reason */}
                    {(bulkResult.skippedDetails?.length ?? 0) > 0 && (
                      <div className="mt-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Rows skipped (already in your records) — {bulkResult.skipped} row{bulkResult.skipped === 1 ? "" : "s"}</p>
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                          {(bulkResult.skippedDetails ?? []).map((e: any, i: number) => (
                            <div key={i} className="flex gap-2.5 px-3 py-2.5 text-left">
                              <span className="shrink-0 h-6 min-w-[28px] px-1.5 grid place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold">Row {e.row}</span>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex-1">{e.message}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5">Tip: To update a skipped worker with the data in your file, upload again and choose <span className="font-semibold text-indigo-600">Delete &amp; Replace</span> when asked.</p>
                      </div>
                    )}
                    {/* If file was fully rejected (0 created, errors cover every row) */}
                    {bulkResult.created === 0 && bulkResult.total > 0 && bulkResult.errors?.length > 0 && bulkResult.errors.length === bulkResult.total && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">Your file was rejected — none of the {bulkResult.total} rows could be imported. Please fix every row above and upload again. Tip: check that Zone, Region and Division are spelled exactly as in the template (you can ignore upper/lower case).</p>
                    )}
                  </div>
                )}

                {/* ── Mode Choice Dialog (Delete all vs Add new) ── */}
                <AnimatePresence>
                  {showModeDialog && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModeDialog(false)}>
                      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-6 pt-6 pb-4">
                          <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 grid place-items-center mb-4"><AlertTriangle size={22} className="text-amber-600 dark:text-amber-400" /></div>
                          <h3 className="text-lg font-bold tracking-tight">Existing data found</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                            You already have <span className="font-semibold text-slate-900 dark:text-white">{data?.workers?.length || 0} workers</span> in the system. How would you like to handle the new upload of <span className="font-semibold text-slate-900 dark:text-white">{bulkPreview?.rows.length || 0} workers</span>?
                          </p>
                        </div>
                        <div className="px-6 pb-6 space-y-3">
                          <button onClick={() => { setShowModeDialog(false); handleModeChoice("append"); }} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-left group">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500 grid place-items-center shrink-0"><Plus size={18} className="text-white" /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Add / Update — Keep existing</p>
                              <p className="text-xs text-emerald-700 dark:text-emerald-300">Keep all current workers, add new ones. Duplicates will be reviewed next.</p>
                            </div>
                            <ChevronRight size={16} className="text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </button>
                          <button onClick={() => { setShowModeDialog(false); handleModeChoice("replace"); }} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left group">
                            <div className="h-10 w-10 rounded-xl bg-red-500 grid place-items-center shrink-0"><Trash2 size={18} className="text-white" /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-red-900 dark:text-red-100">Replace All — Delete existing</p>
                              <p className="text-xs text-red-700 dark:text-red-300">Delete all {data?.workers?.length || 0} existing workers, then import the new {bulkPreview?.rows.length || 0}.</p>
                            </div>
                            <ChevronRight size={16} className="text-red-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </button>
                          <button onClick={() => setShowModeDialog(false)} className="w-full py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Cancel</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Duplicate Handling Dialog ── */}
                <AnimatePresence>
                  {showDupDialog && dupInfo && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDupDialog(false)}>
                      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 grid place-items-center mb-4"><Users size={22} className="text-indigo-600 dark:text-indigo-400" /></div>
                          <h3 className="text-lg font-bold tracking-tight">Duplicates found</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                            <span className="font-semibold text-amber-600">{dupInfo.duplicateCount} worker(s)</span> in your file already exist (same Full Name + Division + Zone). <span className="font-semibold text-emerald-600">{dupInfo.validCount} new</span> workers are ready to add.
                          </p>
                        </div>
                        <div className="px-6 py-4 max-h-48 overflow-y-auto space-y-1.5 bg-slate-50 dark:bg-slate-800/50">
                          {dupInfo.duplicates.slice(0, 8).map((d: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                              <span className="text-xs font-medium truncate">{d.name || d.existingName}</span>
                              <span className="text-[10px] text-slate-400 shrink-0 ml-2">{d.zone} › {d.division}</span>
                            </div>
                          ))}
                          {dupInfo.duplicateCount > 8 && <p className="text-xs text-slate-400 text-center">…and {dupInfo.duplicateCount - 8} more</p>}
                        </div>
                        <div className="px-6 py-4 space-y-3 bg-white dark:bg-slate-900">
                          <button onClick={() => { setShowDupDialog(false); handleDuplicateChoice("skip"); }} className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left">
                            <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-700 grid place-items-center shrink-0"><X size={16} className="text-slate-600 dark:text-slate-300" /></div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold">Skip duplicates</p>
                              <p className="text-xs text-slate-500">Keep existing records, only add {dupInfo.validCount} new workers</p>
                            </div>
                          </button>
                          <button onClick={() => { setShowDupDialog(false); handleDuplicateChoice("replace"); }} className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition-colors text-left">
                            <div className="h-9 w-9 rounded-lg bg-indigo-600 grid place-items-center shrink-0"><Trash2 size={16} className="text-white" /></div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Delete & Replace</p>
                              <p className="text-xs text-indigo-700 dark:text-indigo-300">Delete {dupInfo.duplicateCount} existing, re-add with new data</p>
                            </div>
                          </button>
                          <button onClick={() => setShowDupDialog(false)} className="w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Red Flag — participants without valid 10-digit contact — 25y experience: surface data quality immediately */}
      {missingContactWorkers.length > 0 && (
        <div className="rounded-2xl border-2 border-red-300 dark:border-red-800 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 overflow-hidden shadow-sm">
          <button onClick={() => setShowMissing(!showMissing)} className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:from-red-100 dark:hover:from-red-900/20 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 grid place-items-center shadow-md shadow-red-500/20 shrink-0"><AlertTriangle size={18} className="text-white" /></div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-red-700 dark:text-red-300 flex items-center gap-2">Red Flag — Missing contact <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-bold">{missingContactWorkers.length}</span></p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 truncate">{missingContactWorkers.length} participant{missingContactWorkers.length===1?" has":"s have"} no valid 10-digit contact — cannot be reached. Tap to {showMissing ? "hide" : "see who and fix"}.</p>
              </div>
            </div>
            <div className={`h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 grid place-items-center shrink-0 transition-transform ${showMissing ? "rotate-180" : ""}`}><ChevronDown size={16} className="text-red-600" /></div>
          </button>
          <AnimatePresence initial={false}>
            {showMissing && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-red-200 dark:border-red-800">
                <div className="p-3 bg-white/70 dark:bg-slate-900/50">
                  <div className="hidden md:block table-premium-wrap border-red-200 dark:border-red-800">
                    <div className="table-scroll overflow-x-auto scrollbar-thin">
                      <table className="table-premium w-full text-xs">
                        <thead className="thead-dark"><tr className="bg-gradient-to-r from-red-700 to-rose-700 text-white"><th className="px-3 py-2.5 text-left">Name</th><th className="px-3 py-2.5 text-left">Region → Division</th><th className="px-3 py-2.5 text-left">Position</th><th className="px-3 py-2.5 text-center">Contact</th><th className="px-3 py-2.5 text-center">Fix</th></tr></thead>
                        <tbody className="divide-y divide-red-100 dark:divide-red-900/30">
                          {missingContactWorkers.slice(0, 50).map((w: any) => (
                            <tr key={w.id} className="bg-red-50/60 dark:bg-red-950/10 hover:bg-red-100 dark:hover:bg-red-900/20">
                              <td className="px-3 py-2.5 font-semibold flex items-center gap-2"><AlertTriangle size={12} className="text-red-500 shrink-0" />{toProperCase(w.name)}</td>
                              <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{w.region} › {w.division} <span className="text-[10px] text-slate-400">({w.zone})</span></td>
                              <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800">{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</span></td>
                              <td className="px-3 py-2.5 text-center"><span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold">Missing ✕</span></td>
                              <td className="px-3 py-2.5 text-center"><button onClick={() => startEdit(w)} className="h-7 px-3 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold">Add contact</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {missingContactWorkers.length > 50 && <div className="table-footer bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300">Showing 50 of {missingContactWorkers.length} — search to filter</div>}
                  </div>
                  <div className="md:hidden space-y-2">
                    {missingContactWorkers.slice(0, 20).map((w: any) => (
                      <div key={w.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800">
                        <div className="min-w-0"><p className="text-sm font-semibold flex items-center gap-1.5"><AlertTriangle size={12} className="text-red-500" />{toProperCase(w.name)}</p><p className="text-[11px] text-slate-500">{w.region} › {w.division}</p></div>
                        <button onClick={() => startEdit(w)} className="shrink-0 h-8 px-3 rounded-full bg-red-600 text-white text-xs font-bold">Fix</button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center">
                    <Button loading={deletingMissing} onClick={handleDeleteMissing} className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"><Trash2 size={14} /> Delete all flagged ({missingContactWorkers.length})</Button>
                    <Button variant="outline" onClick={() => { setShowMissing(false); setShowBulk(true); }} className="gap-1.5"><Upload size={14} /> Re-upload fixed file</Button>
                    <span className="text-[11px] text-slate-400">— deletes only missing-contact rows{isRegional ? ` in ${user.region}` : ""}, then upload corrected Excel</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {/* Search — available to all including regional officers */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search participants by name, zone, region, division, position..." className="pl-9 h-10 rounded-xl" />
        {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
      </div>
      {searchQuery && <p className="text-xs text-slate-500">{filteredWorkers.length} of {visibleWorkers.length} workers match &quot;{searchQuery}&quot; {user.role === "regional_officer" ? "• Editing allowed within your region/zone, delete only via reupload" : ""}</p>}
      {!searchQuery && user.role === "regional_officer" && <p className="text-xs text-slate-500">Regional access: You can search and edit participants within your assigned region/zone. Delete is only available via bulk reupload within your access level. Full delete is reserved for National officers.</p>}
      {isLoading ? <div className="space-y-3"><Skeleton className="h-12 w-full" /></div> : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden space-y-3">
            {filteredWorkers.map((w: any) => {
              const missing = !w.contact || !/^\d{10}$/.test(String(w.contact).trim());
              return (
              <div key={w.id} className={`rounded-xl bg-white dark:bg-slate-900 border p-3.5 space-y-2.5 ${missing ? "border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/10" : "border-slate-200 dark:border-slate-800"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate flex items-center gap-1">{(!w.contact || !/^\d{10}$/.test(String(w.contact).trim())) && <AlertTriangle size={10} className="text-red-500" />}{toProperCase(w.name)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{w.zone} › {w.region} › {w.division}</p>
                    {(w.contact && /^\d{10}$/.test(String(w.contact).trim())) ? <p className="text-[11px] text-slate-500 mt-0.5 truncate">Contact: {w.contact}{w.contact2 ? `, ${w.contact2}` : ""}</p> : <p className="text-[11px] font-bold text-red-600 mt-0.5 flex items-center gap-1"><AlertTriangle size={10} /> Missing contact — tap Fix</p>}
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${w.gender === "male" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600" : "bg-pink-50 dark:bg-pink-900/30 text-pink-600"}`}>{w.gender}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</span>
                  {w.paymentStatus === "paid" ? <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">Paid</span> : <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-600">Unpaid</span>}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {w.paymentStatus !== "paid" && !w.verified ? (
                    <span title="Only PAID workers can be verified" className="flex-1 min-h-[36px] py-1.5 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 border border-amber-200 dark:border-amber-800 grid place-items-center cursor-not-allowed">Unpaid — cannot verify</span>
                  ) : (
                    <button onClick={() => toggleVerify.mutate(w.id)} disabled={!canEdit(w)} className={`flex-1 min-h-[36px] py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${w.verified ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>{w.verified ? "✓ Verified" : "Mark Verified"}</button>
                  )}
                  {canEdit(w) && <button onClick={() => startEdit(w)} className="h-9 w-9 shrink-0 grid place-items-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400"><Settings size={14} /></button>}
                  {canDelete ? (
                    <button aria-label="Delete worker" onClick={() => { if (confirm(`Delete "${toProperCase(w.name)}"? This is reserved for National officers.`)) deleteWorker.mutate(w.id); }} className="h-9 w-9 shrink-0 grid place-items-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                  ) : (
                    <span title="Delete via reupload only for regional officers" className="h-9 w-9 shrink-0 grid place-items-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-300 cursor-not-allowed"><Trash2 size={16} /></span>
                  )}
                </div>
                {!canEdit(w) && user.role === "regional_officer" && <p className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1">View only — outside your region</p>}
              </div>
            )})}
            {filteredWorkers.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-sm text-slate-400">{searchQuery ? `No workers match "${searchQuery}"` : "No workers registered yet."}</div>
            )}
            {searchQuery && filteredWorkers.length > 0 && filteredWorkers.length !== (data?.workers?.length || 0) && <p className="text-xs text-center text-slate-400">{visibleWorkers.length - filteredWorkers.length} workers hidden by search (edit/search is available for regional officers)</p>}
          </div>
          {/* Desktop: table — premium */}
          <div className="hidden md:block table-premium-wrap">
            <div className="table-scroll overflow-x-auto scrollbar-thin">
              <table className="table-premium w-full text-sm min-w-[1000px]">
                <thead className="text-left"><tr><th className="px-4 py-3">Name</th><th>Gender</th><th>Zone</th><th>Region</th><th>Division</th><th className="text-red-600 dark:text-red-400">Contact</th><th>Position</th><th>Payment</th><th>Verified</th><th>Actions</th></tr></thead>
                <tbody className="divide-y">
                  {filteredWorkers.map((w: any) => {
                    const missing = !w.contact || !/^\d{10}$/.test(String(w.contact).trim());
                    return (
                    <tr key={w.id} className={`${missing ? "bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500" : ""} hover:bg-slate-50 dark:hover:bg-slate-800/50`}>
                    <td className="px-4 py-3 font-medium flex items-center gap-1.5">{missing && <AlertTriangle size={12} className="text-red-500 shrink-0" />}{toProperCase(w.name)}</td><td className="capitalize">{w.gender}</td>
                    <td className="text-slate-500 text-xs">{w.zone}</td><td className="text-slate-500 text-xs">{w.region}</td><td className="text-slate-500 text-xs">{w.division}</td>
                    <td className="text-xs">{missing ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse">Missing ✕</span> : <span className="font-mono text-slate-700 dark:text-slate-300">{w.contact}</span>}</td>
                    <td><span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</span></td>
                    <td>{w.paymentStatus === "paid" ? <span className="text-emerald-600 text-xs font-medium">Paid</span> : <span className="text-amber-600 text-xs font-medium">Unpaid</span>}</td>
                    <td>
                      {w.paymentStatus !== "paid" && !w.verified ? (
                        <span title="Only PAID workers can be verified" className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border bg-amber-100 text-amber-700 border-amber-200 cursor-not-allowed">Unpaid</span>
                      ) : (
                        <button onClick={() => toggleVerify.mutate(w.id)} disabled={!canEdit(w)} className={`px-2 py-0.5 rounded-full text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed ${!canEdit(w) ? "opacity-40 cursor-not-allowed" : ""} ${w.verified ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`}>{w.verified ? "Verified" : "Pending"}</button>
                      )}
                    </td>
                    <td><div className="flex items-center gap-1">
                      {canEdit(w) ? <button onClick={() => startEdit(w)} className={`h-7 w-7 grid place-items-center rounded-md ${missing ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" : "bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 text-indigo-600"}`} title={missing ? "Fix missing contact" : "Edit"}><Settings size={14} /></button> : <span className="h-7 w-7 grid place-items-center rounded-md bg-slate-100 text-slate-300 cursor-not-allowed"><Settings size={14} /></span>}
                      {canDelete ? <button onClick={() => { if (confirm(`Delete "${toProperCase(w.name)}"?`)) deleteWorker.mutate(w.id); }} className="h-7 w-7 grid place-items-center rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button> : <span title="Delete via reupload only" className="h-7 w-7 grid place-items-center rounded-md bg-slate-100 text-slate-300 cursor-not-allowed"><Trash2 size={14} /></span>}
                    </div></td>
                  </tr>
                )})}
                {filteredWorkers.length === 0 && <tr><td colSpan={10} className="table-empty"><div className="table-empty-icon"><Users size={16} /></div><p className="text-sm font-medium">{searchQuery ? `No workers match "${searchQuery}"` : "No workers registered yet."}</p></td></tr>}
              </tbody>
            </table>
            </div>
            <div className="table-footer"><span>{filteredWorkers.length} workers • click row to edit • {filteredWorkers.filter((w:any)=>w.verified).length} verified</span><span className="hidden sm:inline">Premium table • sticky header • hover highlight</span></div>
          </div>
          {/* Edit dialog */}
          {editingWorker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditingWorker(null)}>
              <div onClick={e => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900">
                  <div><h3 className="font-semibold">Edit Participant</h3><p className="text-xs text-slate-400">{toProperCase(editingWorker.name)} • {editingWorker.zone} › {editingWorker.region}</p></div>
                  <button onClick={() => setEditingWorker(null)} className="h-8 w-8 grid place-items-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div><Label>Full Name</Label><Input value={editForm.name || ""} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-3"><div><Label>Gender</Label><select value={editForm.gender || ""} onChange={e => setEditForm((f: any) => ({ ...f, gender: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm bg-white dark:bg-slate-900"><option value="male">Male</option><option value="female">Female</option></select></div><div><Label>Position</Label><select value={editForm.position || ""} onChange={e => setEditForm((f: any) => ({ ...f, position: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm bg-white dark:bg-slate-900">{Object.entries(POSITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Zone</Label><select value={editForm.zone || ""} onChange={e => { const z = e.target.value; setEditForm((f: any) => ({ ...f, zone: z, region: "", division: "" })); }} className="w-full h-10 rounded-xl border px-3 text-sm bg-white dark:bg-slate-900">{Object.keys(ZONE_STRUCTURE).map(z => <option key={z} value={z}>{z}</option>)}</select></div>
                    <div><Label>Region</Label><select value={editForm.region || ""} onChange={e => setEditForm((f: any) => ({ ...f, region: e.target.value, division: "" }))} className="w-full h-10 rounded-xl border px-3 text-sm bg-white dark:bg-slate-900">{editForm.zone ? Object.keys(ZONE_STRUCTURE[editForm.zone] || {}).map(r => <option key={r} value={r}>{r}</option>) : <option value="">Select region</option>}</select></div>
                    <div><Label>Division</Label><select value={editForm.division || ""} onChange={e => setEditForm((f: any) => ({ ...f, division: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm bg-white dark:bg-slate-900">{editForm.zone && editForm.region ? (ZONE_STRUCTURE[editForm.zone]?.[editForm.region] || []).map((d: string) => <option key={d} value={d}>{d}</option>) : <option value="">Select division</option>}</select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3"><div><Label>Contact</Label><Input value={editForm.contact || ""} onChange={e => setEditForm((f: any) => ({ ...f, contact: e.target.value }))} placeholder="0244..." /></div><div><Label>Contact 2 (optional)</Label><Input value={editForm.contact2 || ""} onChange={e => setEditForm((f: any) => ({ ...f, contact2: e.target.value }))} placeholder="0200..." /></div></div>
                  <div><Label>Payment</Label><select value={editForm.paymentStatus || ""} onChange={e => setEditForm((f: any) => ({ ...f, paymentStatus: e.target.value }))} className="w-full h-10 rounded-xl border px-3 text-sm bg-white dark:bg-slate-900"><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></div>
                  {editError && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 rounded-xl px-3 py-2">{editError}</p>}
                  {editSuccess && <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl px-3 py-2 font-medium">{editSuccess}</p>}
                  <div className="flex gap-2 justify-end pt-2"><Button variant="outline" onClick={() => setEditingWorker(null)}>Cancel</Button><Button onClick={() => updateWorker.mutate({ id: editingWorker.id, patch: editForm })} disabled={updateWorker.isPending || !!editSuccess}>{updateWorker.isPending ? "Saving..." : "Save Changes"}</Button></div>
                  {!canEdit(editingWorker) && <p className="text-xs text-amber-600">You can only edit workers within your assigned region.</p>}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VERIFICATION
   ══════════════════════════════════════════════════════════════ */
function VerificationSection({ user }: { user: any }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ type: "success" | "error" | "info"; title: string; detail: string; worker?: any } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const qc = useQueryClient();
  const { data: locks } = useQuery({ queryKey: ["locks"], queryFn: async () => fetch("/api/auth/admin/locks").then(r => r.json()), refetchInterval: 15000 });
  const locked = locks?.verificationLocked ?? false;
  const isSuper = user.role === "super_admin";
  const toggleVerificationLock = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/auth/admin/locks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verificationLocked: !locked }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error); return j;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locks"] }),
    onError: (e: any) => alert(e.message),
  });
  const { data: workerData } = useQuery({ queryKey: WORKERS_KEY(user), queryFn: async () => fetch("/api/auth/workers").then(r => r.json()) });
  const rawWorkers: any[] = workerData?.workers || [];
  const isRegional = user.role === "regional_officer";
  const scopeLabel = isRegional ? (user.region ? `Region: ${user.region}` : "Your Region") : null;
  const workers: any[] = useMemo(() => {
    if (!isRegional) return rawWorkers;
    if (!user.region) return rawWorkers;
    const want = user.region.trim().toLowerCase();
    return rawWorkers.filter((w: any) => w.region && w.region.trim().toLowerCase() === want);
  }, [rawWorkers, user.region, isRegional]);

  const suggestions = useMemo(() => {
    if (!code.trim() || code.trim().length < 1) return [];
    const q = code.toLowerCase().trim();
    return workers.filter((w: any) => w.name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q)).slice(0, 8);
  }, [code, workers]);

  const highlightMatch = (name: string, query: string) => {
    const idx = name.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return name;
    return <>{name.slice(0, idx)}<span className="bg-amber-200 dark:bg-amber-800/50 font-bold rounded px-0.5">{name.slice(idx, idx + query.length)}</span>{name.slice(idx + query.length)}</>;
  };

  const selectSuggestion = (w: any) => {
    setCode(w.name);
    setSelectedWorker(w);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setResult(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(prev => (prev + 1) % suggestions.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === "Enter" && selectedIndex >= 0) { e.preventDefault(); selectSuggestion(suggestions[selectedIndex]); }
    else if (e.key === "Escape") { setShowSuggestions(false); setSelectedIndex(-1); }
  };

  const verifyMutation = useMutation({
    mutationFn: async (workerId: string) => {
      const r = await fetch("/api/auth/workers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workerId, action: "toggleVerified" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Verification failed");
      return j.worker;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["workers"] });
      setResult({ type: "success", title: `Verified: ${toProperCase(updated.name)}`, detail: `${updated.zone} › ${updated.region} › ${updated.division} • ${POSITION_LABELS[updated.position as keyof typeof POSITION_LABELS] || updated.position} • ${updated.verified ? "Now Verified ✓" : "Verification removed"}`, worker: updated });
    },
    onError: (e: any) => setResult({ type: "error", title: "Verification failed", detail: e.message }),
  });

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (locked && !isSuper) { setResult({ type: "error", title: "Verification locked", detail: "Verification is locked by super_admin. Only super_admin can verify now." }); return; }
    if (code.trim().length < 1) { setResult({ type: "error", title: "Enter a name", detail: "Type a worker name to verify." }); return; }
    // Prefer selected worker if it matches code, else find best match
    let match: any = selectedWorker && toProperCase(selectedWorker.name).toLowerCase() === code.toLowerCase().trim() ? selectedWorker : null;
    if (!match) match = workers.find((w: any) => w.name.toLowerCase() === code.toLowerCase().trim() || w.id.toLowerCase() === code.toLowerCase().trim());
    if (!match) match = workers.find((w: any) => w.name.toLowerCase().includes(code.toLowerCase().trim()));
    if (match) {
      if (match.paymentStatus !== "paid" && !match.verified) {
        setResult({ type: "error", title: `Cannot verify: ${toProperCase(match.name)}`, detail: `Payment status is "${match.paymentStatus}". Only PAID workers can be verified. Collect payment first.` , worker: match});
        return;
      }
      if (match.verified) {
        setResult({ type: "info", title: `Already Verified: ${toProperCase(match.name)}`, detail: `${match.zone} › ${match.region} › ${match.division} • ${POSITION_LABELS[match.position as keyof typeof POSITION_LABELS] || match.position}`, worker: match });
      } else {
        verifyMutation.mutate(match.id);
      }
    } else {
      setResult({ type: "error", title: `No worker found for "${code}"`, detail: "Check the spelling or select from suggestions. Try typing fewer letters." });
    }
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 flex items-center justify-between ${!locked ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20" : "bg-red-50 border-red-200 dark:bg-red-950/20"}`}>
        <div className="flex items-center gap-2 text-sm font-medium"><span className={`h-2 w-2 rounded-full ${!locked ? "bg-emerald-500" : "bg-red-500"}`} /> Verification: {!locked ? "OPEN" : "LOCKED"}{locked && !isSuper && <span className="text-xs text-red-600 ml-2">— only super_admin can unlock</span>}</div>
        {isSuper && <button onClick={() => toggleVerificationLock.mutate()} disabled={toggleVerificationLock.isPending} className="text-xs rounded-full bg-white dark:bg-slate-800 border px-3 py-1.5 disabled:opacity-50">{toggleVerificationLock.isPending ? "..." : locked ? "Unlock" : "Lock"}</button>}
      </div>
      {isRegional && (
        <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-3 flex items-center gap-2.5 shadow-md">
          <div className="h-8 w-8 rounded-lg bg-white/20 grid place-items-center"><ScanLine size={16} className="text-white" /></div>
          <div><p className="text-sm font-bold">Verification — {scopeLabel}</p><p className="text-xs text-white/80">Search and verify participants limited to your assigned region. Other regions are not accessible.</p></div>
        </div>
      )}
      <Card className="rounded-2xl"><CardHeader><h3 className="font-semibold">Verify Worker</h3><p className="text-xs text-slate-400">Type to see suggestions from {workers.length} registered workers {isRegional ? `• ${scopeLabel}` : ""}</p></CardHeader>
        <CardContent>
          <form onSubmit={verify} className="flex flex-col sm:flex-row gap-2 relative">
            <div className="relative flex-1 max-w-md">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={code} onChange={e => { setCode(e.target.value); setShowSuggestions(true); setSelectedIndex(-1); setResult(null); setSelectedWorker(null); }} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 180)} onKeyDown={handleKeyDown} placeholder="Enter worker name or ID" className="w-full pl-9 pr-8 h-11 rounded-xl" autoComplete="off" />
                {code && <button type="button" onClick={() => { setCode(""); setShowSuggestions(false); setResult(null); setSelectedWorker(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
              </div>
              {/* Autocomplete dropdown — Premium Pro */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="absolute z-20 mt-2 w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                    <div className="px-3 py-2 border-b bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{suggestions.length} match{suggestions.length !== 1 ? "es" : ""} found</span>
                      <span className="text-[10px] text-slate-400">↑↓ navigate • Enter select</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {suggestions.map((w: any, idx: number) => (
                        <button key={w.id} type="button" onClick={() => selectSuggestion(w)} onMouseDown={e => e.preventDefault()} className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors ${idx === selectedIndex ? "bg-indigo-50 dark:bg-indigo-950/30" : ""}`}>
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 grid place-items-center text-white text-xs font-bold shrink-0">{toProperCase(w.name)[0]}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{highlightMatch(toProperCase(w.name), code)}</p>
                            <p className="text-[11px] text-slate-400 truncate">{w.zone} › {w.region} › {w.division} • {POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${w.verified ? "bg-emerald-500 text-white border-emerald-600" : "bg-slate-100 text-slate-500 border-slate-200"}`}>{w.verified ? "Verified" : "Pending"}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${w.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{w.paymentStatus}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {showSuggestions && code.trim().length >= 1 && suggestions.length === 0 && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute z-20 mt-2 w-full rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 shadow-xl p-4 text-center">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No matches for &quot;{code}&quot;</p>
                    <p className="text-xs text-slate-400 mt-1">Try a different spelling or check the registered list</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button type="submit" disabled={verifyMutation.isPending} className="shrink-0 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg">{verifyMutation.isPending ? "Verifying..." : "Verify"}</Button>
          </form>
          {result && (
            <div className={`mt-4 rounded-xl border p-4 flex items-start gap-3 ${result.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" : result.type === "info" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"}`}>
              <div className={`h-8 w-8 rounded-full grid place-items-center shrink-0 ${result.type === "success" ? "bg-emerald-500" : result.type === "info" ? "bg-amber-500" : "bg-red-500"}`}>{result.type === "success" ? <CheckCircle2 size={16} className="text-white" /> : result.type === "info" ? <AlertTriangle size={16} className="text-white" /> : <X size={16} className="text-white" />}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{result.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{result.detail}</p>
                {result.worker && (
                  <div className="mt-3 rounded-xl bg-white dark:bg-slate-900 border p-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 grid place-items-center text-white font-bold shrink-0">{toProperCase(result.worker.name)[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{toProperCase(result.worker.name)}</p>
                      <p className="text-xs text-slate-500 truncate">{result.worker.zone} › {result.worker.region} › {result.worker.division} • {POSITION_LABELS[result.worker.position as keyof typeof POSITION_LABELS] || result.worker.position}</p>
                      <p className="text-[11px] text-slate-400 truncate">Contact: {result.worker.contact || "—"}{result.worker.contact2 ? `, ${result.worker.contact2}` : ""} • {result.worker.gender} • {result.worker.paymentStatus}</p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border ${result.worker.verified ? "bg-emerald-500 text-white border-emerald-600" : "bg-slate-100 text-slate-500 border-slate-200"}`}>{result.worker.verified ? "Verified" : "Pending"}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Premium Verify Table — always visible */}
      <Card className="rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 grid place-items-center shadow-md"><ScanLine size={16} className="text-white" /></div>
            <div><h3 className="font-semibold text-sm">Participants to Verify</h3><p className="text-xs text-slate-400">{code.trim() ? `${suggestions.length > 0 ? suggestions.length : workers.filter(w => w.name.toLowerCase().includes(code.toLowerCase())).length} matching` : `All ${workers.length}`} • Tap Verify in the table</p></div>
          </div>
          <div className="flex items-center gap-2 text-[11px]"><span className="px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-700 font-medium">Verified: {workers.filter((w: any) => w.verified).length}</span><span className="px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-amber-700 font-medium">Pending: {workers.filter((w: any) => !w.verified).length}</span></div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:block table-scroll overflow-x-auto scrollbar-thin">
            <table className="table-premium w-full text-sm">
              <thead className="thead-dark bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white"><tr><th className="text-left px-4 py-3 font-semibold">Name</th><th className="text-left px-3 py-3 font-semibold">Zone → Division</th><th className="text-left px-3 py-3 font-semibold">Position</th><th className="text-center px-3 py-3 font-semibold">Payment</th><th className="text-center px-3 py-3 font-semibold">Status</th><th className="text-center px-3 py-3 font-semibold">Verify</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(code.trim() ? workers.filter((w: any) => w.name.toLowerCase().includes(code.toLowerCase().trim()) || w.id.toLowerCase().includes(code.toLowerCase().trim())) : workers).slice(0, 50).map((w: any) => (
                  <tr key={w.id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 grid place-items-center text-white text-xs font-bold">{toProperCase(w.name)[0]}</div><span className="font-medium">{toProperCase(w.name)}</span></div><p className="text-[11px] text-slate-400 pl-9">{w.contact || ""}</p></td>
                    <td className="px-3 py-3 text-xs text-slate-500">{w.zone}<br /><span className="text-[11px] text-slate-400">{w.region} › {w.division}</span></td>
                    <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700">{POSITION_LABELS[w.position as keyof typeof POSITION_LABELS] || w.position}</span></td>
                    <td className="px-3 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${w.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{w.paymentStatus}</span></td>
                    <td className="px-3 py-3 text-center"><span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold border ${w.verified ? "bg-emerald-500 text-white border-emerald-600 shadow-sm" : "bg-slate-100 text-slate-500 border-slate-200"}`}>{w.verified ? "Verified" : "Pending"}</span></td>
                    <td className="px-3 py-3 text-center">
                      {w.paymentStatus !== "paid" && !w.verified ? (
                        <span title="Only PAID workers can be verified" className="inline-flex h-8 items-center px-3 rounded-full text-xs font-bold border bg-amber-100 dark:bg-amber-900/30 text-amber-700 border-amber-200 cursor-not-allowed">Unpaid</span>
                      ) : (
                        <button onClick={() => { setCode(w.name); setSelectedWorker(w); verifyMutation.mutate(w.id); }} disabled={(locked && !isSuper) || verifyMutation.isPending} className={`h-8 px-3 rounded-full text-xs font-bold border shadow-sm transition-all ${w.verified ? "bg-white dark:bg-slate-800 border-slate-200 text-slate-500 hover:bg-slate-50" : "bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-600 text-white hover:shadow-md"} disabled:opacity-40`}>{w.verified ? "Unverify" : "Verify"}</button>
                      )}
                    </td>
                  </tr>
                ))}
                {workers.length === 0 && <tr><td colSpan={6} className="table-empty"><div className="table-empty-icon"><ScanLine size={16} /></div><p className="text-sm font-medium">No workers registered yet.</p></td></tr>}
                {code.trim() && workers.filter((w: any) => w.name.toLowerCase().includes(code.toLowerCase().trim())).length === 0 && workers.length > 0 && <tr><td colSpan={6} className="table-empty"><p className="text-sm text-slate-400">No matches for &quot;{code}&quot;</p></td></tr>}
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span>{workers.length} participants • sticky header • hover to highlight</span>{workers.length > 50 && !code.trim() && <span>Showing 50 of {workers.length}</span>}</div>
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {(code.trim() ? workers.filter((w: any) => w.name.toLowerCase().includes(code.toLowerCase().trim())) : workers).slice(0, 20).map((w: any) => (
              <div key={w.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-2.5 min-w-0"><div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 grid place-items-center text-white text-xs font-bold shrink-0">{toProperCase(w.name)[0]}</div><div className="min-w-0"><p className="text-sm font-semibold truncate">{toProperCase(w.name)}</p><p className="text-[11px] text-slate-400 truncate">{w.zone} › {w.division} • {w.paymentStatus}</p></div></div>
                {w.paymentStatus !== "paid" && !w.verified ? (
                  <span title="Only PAID workers can be verified" className="shrink-0 h-8 inline-flex items-center px-3 rounded-full text-xs font-bold border bg-amber-100 text-amber-700 border-amber-200">Unpaid</span>
                ) : (
                  <button onClick={() => verifyMutation.mutate(w.id)} disabled={(locked && !isSuper) || verifyMutation.isPending} className={`shrink-0 h-8 px-3 rounded-full text-xs font-bold border ${w.verified ? "bg-white border-slate-200 text-slate-500" : "bg-emerald-500 border-emerald-600 text-white shadow-sm"} disabled:opacity-40`}>{w.verified ? "Unverify" : "Verify"}</button>
                )}
              </div>
            ))}
          </div>
          {workers.length > 50 && !code.trim() && <p className="text-xs text-center text-slate-400 py-3 border-t">Showing 50 of {workers.length} — use search to narrow</p>}
        </CardContent>
      </Card>
      {workers.length === 0 && <p className="text-xs text-center text-slate-400">No workers registered yet — upload or register participants first.</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   APPROVAL — Souvenir Approval by Region (Batch System)
   ══════════════════════════════════════════════════════════════ */
function ApprovalSection({ user }: { user: any }) {
  const qc = useQueryClient();
  const { data: locks } = useQuery({ queryKey: ["locks"], queryFn: async () => fetch("/api/auth/admin/locks").then(r => r.json()), refetchInterval: 15000 });
  const locked = locks?.verificationLocked ?? false;
  const isSuper = user.role === "super_admin";
  const toggleLock = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/auth/admin/locks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verificationLocked: !locked }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error); return j;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locks"] }),
    onError: (e: any) => alert(e.message),
  });
  const { data: workerData, isLoading: workersLoading } = useQuery({ queryKey: WORKERS_KEY(user), queryFn: async () => fetch("/api/auth/workers").then(r => r.json()) });
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
              {isSuper && (
                <button onClick={() => toggleLock.mutate()} disabled={toggleLock.isPending} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors disabled:opacity-50">
                  {toggleLock.isPending ? "..." : locked ? "Unlock" : "Lock"}
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
              {/* Desktop: table — premium */}
              <div className="hidden md:block table-scroll overflow-x-auto scrollbar-thin">
                <table className="table-premium w-full text-sm min-w-[500px]">
                  <thead className="text-left">
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

          {/* ── All Regions — Premium Approve Table (Always Visible) ── */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 grid place-items-center shadow-md"><ClipboardCheck size={16} className="text-white" /></div>
                <div><h3 className="font-semibold text-sm">Approve Souvenirs — All Regions</h3><p className="text-xs text-slate-400">Click <span className="font-bold text-violet-600">Approve</span> in the table to approve verified workers for souvenir distribution</p></div>
              </div>
              <div className="flex items-center gap-2 text-[11px]"><span className="px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/20 border border-violet-200 text-violet-700 font-medium">Total: {totalWorkers}</span><span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-amber-700 font-medium">Pending: {totalCurrentBatch}</span></div>
            </div>
            <div className="hidden md:block table-scroll overflow-x-auto scrollbar-thin">
              <table className="table-premium w-full text-sm">
                <thead className="thead-dark bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white"><tr><th className="text-left px-5 py-3 font-semibold">Region</th><th className="text-center px-3 py-3 font-semibold">Total</th><th className="text-center px-3 py-3 font-semibold">Verified</th><th className="text-center px-3 py-3 font-semibold">Last Approved</th><th className="text-center px-3 py-3 font-semibold">New Batch</th><th className="text-center px-3 py-3 font-semibold">Approve</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {regionStats.length === 0 ? <tr><td colSpan={6} className="table-empty"><div className="table-empty-icon"><ClipboardCheck size={16} /></div><p className="text-sm font-medium">No regions yet — register workers first</p></td></tr> : regionStats.map((r) => (
                    <tr key={r.region} className="hover:bg-violet-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3.5"><div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: r.currentBatch > 0 ? "linear-gradient(135deg, #f59e0b, #f97316)" : "linear-gradient(135deg, #64748b, #475569)" }}>{r.region.charAt(0)}</div><span className="font-semibold">{r.region}</span><span className="text-[11px] text-slate-400">• {r.total} workers</span></div></td>
                      <td className="px-3 py-3.5 text-center font-bold">{r.total}</td>
                      <td className="px-3 py-3.5 text-center"><span className="inline-flex h-6 min-w-[28px] items-center justify-center px-2 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm">{r.verified}</span></td>
                      <td className="px-3 py-3.5 text-center text-xs text-slate-500">{r.lastApproval ? `Batch ${r.lastApproval.batchNumber}` : <span className="text-slate-400">Never</span>}</td>
                      <td className="px-3 py-3.5 text-center">{r.currentBatch > 0 ? <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm">+{r.currentBatch} new</span> : <span className="text-xs text-slate-400">—</span>}</td>
                      <td className="px-3 py-3.5 text-center">
                        {r.currentBatch > 0 ? (
                          <button onClick={() => approveMutation.mutate({ region: r.region, verifiedCount: r.verified })} disabled={locked || approveMutation.isPending} className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-bold text-white shadow-md disabled:opacity-40 hover:shadow-lg transition-all" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}><ClipboardCheck size={12} /> Approve</button>
                        ) : (
                          <span className="inline-flex h-8 items-center px-3 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 border">Nothing to approve</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {regionStats.map((r) => (
                <div key={r.region} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0"><div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: r.currentBatch > 0 ? "linear-gradient(135deg, #f59e0b, #f97316)" : "linear-gradient(135deg, #64748b, #475569)" }}>{r.region.charAt(0)}</div><div className="min-w-0"><p className="text-sm font-bold truncate">{r.region}</p><p className="text-[11px] text-slate-400">{r.verified} verified • {r.currentBatch} new batch</p></div></div>
                  {r.currentBatch > 0 ? <button onClick={() => approveMutation.mutate({ region: r.region, verifiedCount: r.verified })} disabled={locked} className="shrink-0 h-8 px-4 rounded-full text-xs font-bold text-white shadow-md disabled:opacity-40" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}><span className="flex items-center gap-1"><ClipboardCheck size={12} /> Approve</span></button> : <span className="text-xs text-slate-400 shrink-0">—</span>}
                </div>
              ))}
            </div>
            {locked && <p className="text-xs text-center text-red-600 bg-red-50 dark:bg-red-950/20 border-t py-2">Approval is locked by super_admin — unlock to approve</p>}
          </div>

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
              {/* Desktop: table — premium */}
              <div className="hidden md:block table-scroll overflow-x-auto scrollbar-thin">
                <table className="table-premium w-full text-sm min-w-[600px]">
                  <thead className="text-left">
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
            {/* Desktop: table — premium */}
            <div className="hidden md:block table-scroll overflow-x-auto scrollbar-thin">
              <table className="table-premium w-full text-sm min-w-[500px]">
                <thead className="text-left">
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
                <span>{toProperCase(w.name)} <span className="text-xs text-slate-400">({w.region})</span></span>
                {checkedInIds.has(w.id) ? <span className="text-xs text-emerald-600">Checked In</span> : <span className="text-xs text-slate-400">Not in</span>}
              </button>
            ))}
            {filteredWorkers.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">No workers found.</p>}
          </div>
        )}
      </div>
      {selectedWorker && <Card className="rounded-2xl"><CardContent className="pt-6"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="min-w-0"><p className="font-semibold truncate">{toProperCase(selectedWorker.name)}</p><p className="text-sm text-slate-500 truncate">{selectedWorker.zone} / {selectedWorker.region}</p></div><Button onClick={() => checkIn.mutate(selectedWorker)} disabled={checkedInIds.has(selectedWorker.id)} className="shrink-0 self-start sm:self-auto">{checkedInIds.has(selectedWorker.id) ? "Checked In" : "Check In"}</Button></div></CardContent></Card>}
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
          {/* Desktop: table — premium */}
          <div className="hidden md:block table-premium-wrap">
            <div className="table-scroll overflow-x-auto scrollbar-thin">
              <table className="table-premium w-full text-sm min-w-[600px]">
                <thead className="text-left"><tr><th className="px-4 py-3">Worker</th><th>Zone</th><th>Region</th><th>Checked In</th><th>Status</th><th>Action</th></tr></thead>
                <tbody className="divide-y">
                  {(attData?.attendances || []).map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium">{a.workerName}</td><td className="text-xs">{a.zone}</td><td className="text-xs">{a.region}</td><td className="text-xs">{new Date(a.checkedInAt).toLocaleString()}</td>
                    <td>{a.checkedOutAt ? <span className="text-xs text-slate-500">Left</span> : <span className="text-xs text-emerald-600 font-medium">Present</span>}</td>
                    <td>{!a.checkedOutAt && <button onClick={() => checkOut.mutate(a.workerId)} className="text-xs rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 hover:bg-red-50">Check Out</button>}</td>
                  </tr>
                ))}
                {(!attData?.attendances || attData.attendances.length === 0) && <tr><td colSpan={6} className="table-empty"><div className="table-empty-icon"><Activity size={16} /></div><p className="text-sm font-medium">No check-ins yet.</p></td></tr>}
              </tbody>
            </table>
            </div>
            <div className="table-footer"><span>{attData?.attendances?.length || 0} records • sticky header</span><span className="hidden sm:inline">{attData?.attendances?.filter((a:any)=>!a.checkedOutAt).length || 0} present</span></div>
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
