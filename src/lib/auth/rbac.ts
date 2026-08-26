import { RoleType } from "@/lib/db/mock";

export const ROLE_LABEL: Record<RoleType, string> = {
  super_admin: "Super Administrator",
  national_officer: "National Officer",
  regional_officer: "Regional Officer",
  verifier: "Verifier",
  viewer: "Viewer",
};

export const ROLE_HOME: Record<RoleType, string> = {
  super_admin: "/dashboard",
  national_officer: "/dashboard",
  regional_officer: "/dashboard",
  verifier: "/dashboard",
  viewer: "/dashboard",
};

// Super Admin + National Officer = same full access
const ADMIN_ROLES: RoleType[] = ["super_admin", "national_officer"];

const ROLE_PERMISSIONS: Record<RoleType, string[]> = {
  super_admin: ["*"],
  national_officer: ["*"],
  regional_officer: ["workers:write", "attendance:write", "reports:write", "verification:read"],
  verifier: ["verification:read", "approval:read", "approval:write"],
  viewer: ["overview:read", "workers:read", "verification:read", "approval:read", "attendance:read", "reports:read", "users:read", "sessions:read", "audit:read"],
};

export function isAdmin(role: RoleType) {
  return ADMIN_ROLES.includes(role);
}

export function hasPermission(role: RoleType, permission: string) {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes(permission);
}

export interface DashboardSection {
  id: string;
  label: string;
  icon: string;
  roles?: RoleType[]; // null/undefined = all roles
}

export const DASHBOARD_SECTIONS: DashboardSection[] = [
  { id: "overview", label: "Dashboard", icon: "LayoutDashboard" },
  { id: "users", label: "User Management", icon: "Users", roles: ["super_admin", "national_officer", "viewer"] },
  { id: "workers", label: "Worker Registration", icon: "UserPlus", roles: ["super_admin", "national_officer", "regional_officer", "verifier", "viewer"] },
  { id: "verification", label: "Verification", icon: "ScanLine" },
  { id: "approval", label: "Approval", icon: "ClipboardCheck", roles: ["super_admin", "national_officer", "verifier", "viewer"] },
  { id: "attendance", label: "Attendance", icon: "ClipboardCheck", roles: ["super_admin", "national_officer", "regional_officer", "viewer"] },
  { id: "broadcast", label: "Broadcast", icon: "Send", roles: ["super_admin", "national_officer", "regional_officer", "viewer"] },
  { id: "sessions", label: "Sessions", icon: "Monitor", roles: ["super_admin", "national_officer", "viewer"] },
  { id: "audit", label: "Audit Trail", icon: "ScrollText", roles: ["super_admin", "national_officer", "viewer"] },
  { id: "reports", label: "Reports", icon: "FileText", roles: ["super_admin", "national_officer", "viewer"] },
  { id: "mfa", label: "Security (MFA)", icon: "ShieldCheck", roles: ["super_admin", "national_officer", "viewer"] },
  { id: "settings", label: "Settings", icon: "Settings" },
];

export function getVisibleSections(role: RoleType): DashboardSection[] {
  return DASHBOARD_SECTIONS.filter(s => !s.roles || s.roles.includes(role));
}
