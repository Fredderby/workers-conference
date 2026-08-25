import bcrypt from "bcryptjs";

export type RoleType = "super_admin" | "national_officer" | "regional_officer" | "verifier" | "viewer";
export type Permission = string;

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  displayName: string;
  role: RoleType;
  zone?: string;
  region?: string;
  isActive: boolean;
  isTempPassword: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  createdAt: string;
  createdBy?: string;
}

export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: "login_success" | "login_failure" | "logout" | "password_change" | "password_reset" | "mfa_verify" | "session_expire" | "account_lock" | "account_unlock" | "refresh_token" | "user_created" | "user_updated" | "user_deactivated" | "user_activated" | "workers_bulk_import";
  timestamp: string;
  ip: string;
  device: string;
  browser: string;
  os: string;
  detail?: string;
}

export interface LoginAttempt {
  identifier: string;
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

export type Gender = "male" | "female";
export type Position = "adult_leader" | "adult_worker" | "youth_worker" | "youth_leader" | "children_leader" | "children_worker";
export type PaymentStatus = "paid" | "unpaid";

export interface Worker {
  id: string;
  name: string;
  gender: Gender;
  zone: string;
  region: string;
  division: string;
  position: Position;
  paymentStatus: PaymentStatus;
  verified: boolean;
  verifiedAt?: string;
  registeredBy: string;
  registeredByName: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  region: string;
  approvedBy: string;
  approvedByName: string;
  approvedAt: string;
  verifiedCount: number;
  batchNumber: number;
  notes?: string;
}

export interface Attendance {
  id: string;
  workerId: string;
  workerName: string;
  zone: string;
  region: string;
  division: string;
  checkedInBy: string;
  checkedInByName: string;
  checkedInAt: string;
  checkedOutAt?: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  category: "incident" | "general" | "medical";
  zone: string;
  region: string;
  division: string;
  submittedBy: string;
  submittedByName: string;
  createdAt: string;
}

export interface Message {
  id: string;
  title: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: RoleType;
  targetRole: RoleType | "all";
  priority: "normal" | "urgent";
  readBy: string[];
  createdAt: string;
}

export const ZONE_STRUCTURE: Record<string, Record<string, string[]>> = {
  "Central-Western Zone": {
    "Tarkwa": ["Tarkwa div", "Enchi", "Asankragua"],
    "Takoradi": ["Takoradi div", "Axim", "Half Assini"],
    "Cape Coast": ["Cape Coast div", "Swedru", "Assin Fosu", "Mankessim", "Winneba", "Elmina", "Asikuma"],
  },
  "Greater Accra Zone": {
    "Accra Metro": ["Abeka-Lapaz", "Ablekuma", "Accra New Town", "Adabraka", "Dansoman", "Odorkor", "Laterbiokorshie", "Anyaa"],
    "Kasoa": ["Kasoa", "Weija"],
    "Madina": ["Madina div"],
    "Tema": ["Tema div", "Ashaiman", "Teshie-Nungua", "Ada"],
    "Ga Central": ["Ga-Central div", "Nsawam", "Amasaman"],
  },
  "Ashanti Zone A": {
    "Bibiani": ["Bibiani div", "Wiawso", "Essam Debiso"],
    "Kumasi South": ["Kumasi South div", "Bohyen"],
    "Obuasi": ["Obuasi div", "Dunkwa", "Bekwai", "Subin", "New Edubiase"],
    "Nkawie": ["Nkawie div", "Mankranso"],
  },
  "Ashanti Zone B": {
    "Kumasi North": ["Kumasi North div", "Offinso", "Asokore Mampong"],
    "Mampong": ["Mampong div", "Atebubu", "Effiduase", "Ejura"],
    "Konongo": ["Konongo div", "Agogo", "Juaso", "Ejisu"],
  },
  "Middle Belt Zone": {
    "Sunyani": ["Sunyani div", "Dormaa Ahenkro", "Berekum", "Bechem", "Sampa"],
    "Techiman": ["Techiman div", "Kintampo", "Wenchi", "Nkoranza"],
    "Goaso": ["Goaso div", "Mim", "Kenyase", "Tepa"],
  },
  "Eastern-Volta Zone": {
    "Koforidua": ["Koforidua div", "Akropong", "Suhum", "Odumase"],
    "Akim Oda": ["Akim Oda div", "Donkorkrom", "Nkawkaw", "Asamankese"],
    "Ho": ["Ho div", "Akatsi", "Keta", "Aflao"],
    "Hohoe": ["Hohoe div", "Kpando"],
    "Dambai": ["Dambai div", "Nkwanta", "Krachi"],
  },
  "Northern Zone": {
    "Bolga": ["Bolga div", "Bawku", "Navrongo"],
    "Nalerigu": ["Nalerigu div", "Walewale"],
    "Wa": ["Wa div", "Tumu"],
    "Damango": ["Damango div", "Buipe", "Bole"],
    "Tamale": ["Tamale div", "Yendi", "Salaga"],
  },
};

export const POSITION_LABELS: Record<Position, string> = {
  adult_leader: "Adult Leader",
  adult_worker: "Adult Worker",
  youth_worker: "Youth Worker",
  youth_leader: "Youth Leader",
  children_leader: "Children Leader",
  children_worker: "Children Worker",
};

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
};

const users: User[] = [];
const sessions: Session[] = [];
const auditLogs: AuditLog[] = [];
const loginAttempts = new Map<string, LoginAttempt>();
const resetTokens = new Map<string, { userId: string; expires: number }>();
const workers: Worker[] = [];
const attendances: Attendance[] = [];
const reports: Report[] = [];
const messages: Message[] = [];

let verificationLocked = false;

const isServer = typeof window === "undefined";
const DATA_FILE = isServer ? require("path").join(process.cwd(), ".db-data.json") : "";

interface DbSnapshot {
  users: User[];
  workers: Worker[];
  attendances: Attendance[];
  reports: Report[];
  messages: Message[];
  auditLogs: AuditLog[];
  verificationLocked: boolean;
}

function save() {
  if (!isServer) return;
  try {
    const fs = require("fs");
    const snapshot: DbSnapshot = { users, workers, attendances, reports, messages, auditLogs, verificationLocked };
    fs.writeFileSync(DATA_FILE, JSON.stringify(snapshot, null, 2), "utf-8");
  } catch { /* ignore write errors in edge cases */ }
}

function load() {
  if (!isServer) return false;
  try {
    const fs = require("fs");
    if (!fs.existsSync(DATA_FILE)) return false;
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    if (!raw.trim()) return false;
    const snap: DbSnapshot = JSON.parse(raw);
    if (snap.users?.length) { users.push(...snap.users); }
    if (snap.workers?.length) { workers.push(...snap.workers); }
    if (snap.attendances?.length) { attendances.push(...snap.attendances); }
    if (snap.reports?.length) { reports.push(...snap.reports); }
    if (snap.messages?.length) { messages.push(...snap.messages); }
    if (snap.auditLogs?.length) { auditLogs.push(...snap.auditLogs); }
    verificationLocked = snap.verificationLocked || false;
    return users.length > 0;
  } catch { return false; }
}

const SUPER_HASH = bcrypt.hashSync("Password123!", 10);
const NATIONAL_HASH = bcrypt.hashSync("Password123!", 10);

function init() {
  const loaded = load();
  if (!loaded) {
    const now = new Date().toISOString();
    users.push(
      { id: "u1", email: "admin@dclm.org", username: "admin", displayName: "Super Administrator", role: "super_admin", isActive: true, isTempPassword: false, mfaEnabled: false, createdAt: now, passwordHash: SUPER_HASH },
      { id: "u2", email: "national@dclm.org", username: "national", displayName: "National Officer", role: "national_officer", isActive: true, isTempPassword: false, mfaEnabled: false, createdAt: now, passwordHash: NATIONAL_HASH }
    );
    save();
  }
}
init();

export const db = {
  users,
  sessions,
  auditLogs,
  loginAttempts,
  resetTokens,
  workers,
  attendances,
  reports,
  findUserByEmailOrUsername(identifier: string) {
    return users.find(u => u.email.toLowerCase() === identifier.toLowerCase() || u.username.toLowerCase() === identifier.toLowerCase());
  },
  findUserById(id: string) { return users.find(u => u.id === id); },
  createUser(data: Omit<User, "id" | "createdAt">) {
    const user: User = { id: `u${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString(), ...data };
    users.push(user);
    save();
    return user;
  },
  updateUser(id: string, patch: Partial<User>) {
    const user = users.find(u => u.id === id);
    if (user) Object.assign(user, patch);
    save();
    return user;
  },
  deactivateUser(id: string) {
    const user = users.find(u => u.id === id);
    if (user) { user.isActive = false; }
    save();
    return user;
  },
  activateUser(id: string) {
    const user = users.find(u => u.id === id);
    if (user) { user.isActive = true; }
    save();
    return user;
  },
  audit(entry: Omit<AuditLog, "id" | "timestamp">) {
    const log: AuditLog = { id: `a${Date.now()}${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toISOString(), ...entry };
    auditLogs.unshift(log);
    if (auditLogs.length > 500) auditLogs.pop();
    save();
    return log;
  },
  createWorker(data: Omit<Worker, "id" | "createdAt">) {
    const w: Worker = { id: `w${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString(), ...data };
    workers.push(w);
    save();
    return w;
  },
  updateWorker(id: string, patch: Partial<Worker>) {
    const w = workers.find(x => x.id === id);
    if (w) Object.assign(w, patch);
    save();
    return w;
  },
  deleteWorker(id: string) {
    const idx = workers.findIndex(x => x.id === id);
    if (idx >= 0) workers.splice(idx, 1);
    save();
  },
  findWorkerByNameOrId(q: string) {
    const lower = q.toLowerCase();
    return workers.filter(w => w.name.toLowerCase().includes(lower) || w.id.toLowerCase().includes(lower));
  },
  checkIn(data: Omit<Attendance, "id" | "checkedInAt">) {
    const a: Attendance = { id: `att${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, checkedInAt: new Date().toISOString(), ...data };
    attendances.push(a);
    save();
    return a;
  },
  checkOut(id: string) {
    const a = attendances.find(x => x.id === id);
    if (a) a.checkedOutAt = new Date().toISOString();
    save();
    return a;
  },
  createReport(data: Omit<Report, "id" | "createdAt">) {
    const r: Report = { id: `r${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString(), ...data };
    reports.push(r);
    save();
    return r;
  },
  createMessage(data: Omit<Message, "id" | "createdAt" | "readBy">) {
    const m: Message = { id: `m${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, readBy: [], createdAt: new Date().toISOString(), ...data };
    messages.unshift(m);
    save();
    return m;
  },
  getMessages(userId: string, userRole: RoleType) {
    return messages.filter(m => m.targetRole === "all" || m.targetRole === userRole);
  },
  getUnreadCount(userId: string, userRole: RoleType) {
    return messages.filter(m => (m.targetRole === "all" || m.targetRole === userRole) && !m.readBy.includes(userId)).length;
  },
  markMessageRead(messageId: string, userId: string) {
    const m = messages.find(x => x.id === messageId);
    if (m && !m.readBy.includes(userId)) m.readBy.push(userId);
    save();
    return m;
  },
  markAllRead(userId: string, userRole: RoleType) {
    messages.filter(m => (m.targetRole === "all" || m.targetRole === userRole) && !m.readBy.includes(userId)).forEach(m => m.readBy.push(userId));
    save();
  },
  isVerificationLocked() { return verificationLocked; },
  setVerificationLocked(locked: boolean) { verificationLocked = locked; save(); },
};
