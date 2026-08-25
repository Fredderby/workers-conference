import { Pool } from "pg";
import bcrypt from "bcryptjs";
import type {
  RoleType,
  User,
  Session,
  AuditLog,
  Worker,
  Attendance,
  Report,
  Message,
  LoginAttempt,
} from "./mock";

if (!process.env.DATABASE_URL) {
  throw new Error("FATAL: DATABASE_URL is not set. The application cannot start without a database connection.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

let initPromise: Promise<void> | null = null;

async function init(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL,
      zone TEXT,
      region TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      is_temp_password BOOLEAN DEFAULT FALSE,
      mfa_enabled BOOLEAN DEFAULT FALSE,
      mfa_secret TEXT,
      created_at TEXT,
      created_by TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      refresh_token TEXT,
      device TEXT,
      browser TEXT,
      os TEXT,
      ip TEXT,
      created_at TEXT,
      last_activity TEXT,
      expires_at TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT,
      timestamp TEXT,
      ip TEXT,
      device TEXT,
      browser TEXT,
      os TEXT,
      detail TEXT
    );
    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      name TEXT,
      gender TEXT,
      zone TEXT,
      region TEXT,
      division TEXT,
      position TEXT,
      payment_status TEXT,
      verified BOOLEAN DEFAULT FALSE,
      registered_by TEXT,
      registered_by_name TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS attendances (
      id TEXT PRIMARY KEY,
      worker_id TEXT,
      worker_name TEXT,
      zone TEXT,
      region TEXT,
      division TEXT,
      checked_in_by TEXT,
      checked_in_by_name TEXT,
      checked_in_at TEXT,
      checked_out_at TEXT
    );
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      category TEXT,
      zone TEXT,
      region TEXT,
      division TEXT,
      submitted_by TEXT,
      submitted_by_name TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT,
      sender_id TEXT,
      sender_name TEXT,
      sender_role TEXT,
      target_role TEXT,
      priority TEXT,
      read_by TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS c FROM users");
  if (rows[0].c === 0) {
    const now = new Date().toISOString();
    const hash = bcrypt.hashSync("Password123!", 10);
    await pool.query(
      `INSERT INTO users (id, email, username, password_hash, display_name, role, is_active, is_temp_password, mfa_enabled, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE,FALSE,FALSE,$7),
              ($8,$9,$10,$11,$12,$13,TRUE,FALSE,FALSE,$14)`,
      [
        "u1", "admin@dclm.org", "admin", hash, "Super Administrator", "super_admin", now,
        "u2", "national@dclm.org", "national", hash, "National Officer", "national_officer", now,
      ]
    );
  }
}

export async function ensureInit(): Promise<void> {
  if (!initPromise) initPromise = init();
  return initPromise;
}

// Ephemeral, in-memory state (rate limiting / reset tokens) — not persisted.
export const loginAttempts = new Map<string, LoginAttempt>();
export const resetTokens = new Map<string, { userId: string; expires: number }>();

function rid(prefix: string): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ---------- row mappers ----------
function mapUser(r: any): User {
  return {
    id: r.id, email: r.email, username: r.username, passwordHash: r.password_hash,
    displayName: r.display_name, role: r.role, zone: r.zone ?? undefined, region: r.region ?? undefined,
    isActive: r.is_active, isTempPassword: r.is_temp_password, mfaEnabled: r.mfa_enabled,
    mfaSecret: r.mfa_secret ?? undefined, createdAt: r.created_at, createdBy: r.created_by ?? undefined,
  };
}
function mapSession(r: any): Session {
  return {
    id: r.id, userId: r.user_id, refreshToken: r.refresh_token, device: r.device, browser: r.browser,
    os: r.os, ip: r.ip, createdAt: r.created_at, lastActivity: r.last_activity, expiresAt: r.expires_at,
  };
}
function mapAudit(r: any): AuditLog {
  return {
    id: r.id, userId: r.user_id, action: r.action, timestamp: r.timestamp, ip: r.ip,
    device: r.device, browser: r.browser, os: r.os, detail: r.detail ?? undefined,
  };
}
function mapWorker(r: any): Worker {
  return {
    id: r.id, name: r.name, gender: r.gender, zone: r.zone, region: r.region, division: r.division,
    position: r.position, paymentStatus: r.payment_status, verified: r.verified,
    registeredBy: r.registered_by, registeredByName: r.registered_by_name, createdAt: r.created_at,
  };
}
function mapAttendance(r: any): Attendance {
  return {
    id: r.id, workerId: r.worker_id, workerName: r.worker_name, zone: r.zone, region: r.region,
    division: r.division, checkedInBy: r.checked_in_by, checkedInByName: r.checked_in_by_name,
    checkedInAt: r.checked_in_at, checkedOutAt: r.checked_out_at ?? undefined,
  };
}
function mapReport(r: any): Report {
  return {
    id: r.id, title: r.title, description: r.description, category: r.category, zone: r.zone,
    region: r.region, division: r.division, submittedBy: r.submitted_by,
    submittedByName: r.submitted_by_name, createdAt: r.created_at,
  };
}
function mapMessage(r: any): Message {
  return {
    id: r.id, title: r.title, content: r.content, senderId: r.sender_id, senderName: r.sender_name,
    senderRole: r.sender_role, targetRole: r.target_role, priority: r.priority,
    readBy: r.read_by ? JSON.parse(r.read_by) : [], createdAt: r.created_at,
  };
}

// ---------- users ----------
export const db = {
  async findUserByEmailOrUsername(identifier: string): Promise<User | undefined> {
    await ensureInit();
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE LOWER(email)=LOWER($1) OR LOWER(username)=LOWER($1) LIMIT 1",
      [identifier]
    );
    return rows[0] ? mapUser(rows[0]) : undefined;
  },
  async findUserByEmail(email: string): Promise<User | undefined> {
    await ensureInit();
    const { rows } = await pool.query("SELECT * FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1", [email]);
    return rows[0] ? mapUser(rows[0]) : undefined;
  },
  async findUserById(id: string): Promise<User | undefined> {
    await ensureInit();
    const { rows } = await pool.query("SELECT * FROM users WHERE id=$1 LIMIT 1", [id]);
    return rows[0] ? mapUser(rows[0]) : undefined;
  },
  async createUser(data: Omit<User, "id" | "createdAt">): Promise<User> {
    await ensureInit();
    const id = rid("u");
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO users (id, email, username, password_hash, display_name, role, zone, region, is_active, is_temp_password, mfa_enabled, mfa_secret, created_at, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        id, data.email, data.username, data.passwordHash, data.displayName, data.role, data.zone ?? null,
        data.region ?? null, data.isActive, data.isTempPassword, data.mfaEnabled, data.mfaSecret ?? null,
        now, data.createdBy ?? null,
      ]
    );
    return (await this.findUserById(id))!;
  },
  async updateUser(id: string, patch: Partial<User>): Promise<User | undefined> {
    await ensureInit();
    const fields: string[] = [];
    const vals: any[] = [];
    let i = 1;
    const set = (col: string, val: any) => { fields.push(`${col}=$${i++}`); vals.push(val); };
    if (patch.email !== undefined) set("email", patch.email);
    if (patch.username !== undefined) set("username", patch.username);
    if (patch.passwordHash !== undefined) set("password_hash", patch.passwordHash);
    if (patch.displayName !== undefined) set("display_name", patch.displayName);
    if (patch.role !== undefined) set("role", patch.role);
    if (patch.zone !== undefined) set("zone", patch.zone ?? null);
    if (patch.region !== undefined) set("region", patch.region ?? null);
    if (patch.isActive !== undefined) set("is_active", patch.isActive);
    if (patch.isTempPassword !== undefined) set("is_temp_password", patch.isTempPassword);
    if (patch.mfaEnabled !== undefined) set("mfa_enabled", patch.mfaEnabled);
    if (patch.mfaSecret !== undefined) set("mfa_secret", patch.mfaSecret ?? null);
    if (fields.length === 0) return this.findUserById(id);
    vals.push(id);
    await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id=$${i}`, vals);
    return this.findUserById(id);
  },
  async deactivateUser(id: string): Promise<User | undefined> {
    return this.updateUser(id, { isActive: false });
  },
  async activateUser(id: string): Promise<User | undefined> {
    return this.updateUser(id, { isActive: true });
  },
  async listUsers(): Promise<User[]> {
    await ensureInit();
    const { rows } = await pool.query("SELECT * FROM users ORDER BY created_at ASC");
    return rows.map(mapUser);
  },

  // ---------- audit ----------
  async audit(entry: Omit<AuditLog, "id" | "timestamp">): Promise<AuditLog> {
    await ensureInit();
    const id = rid("a");
    const ts = new Date().toISOString();
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, action, timestamp, ip, device, browser, os, detail)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, entry.userId ?? null, entry.action, ts, entry.ip, entry.device, entry.browser, entry.os, entry.detail ?? null]
    );
    return { id, timestamp: ts, ...entry };
  },
  async listAuditLogs(userId?: string): Promise<AuditLog[]> {
    await ensureInit();
    const { rows } = userId
      ? await pool.query("SELECT * FROM audit_logs WHERE user_id=$1 ORDER BY timestamp DESC", [userId])
      : await pool.query("SELECT * FROM audit_logs ORDER BY timestamp DESC");
    return rows.map(mapAudit);
  },

  // ---------- workers ----------
  async listWorkers(): Promise<Worker[]> {
    await ensureInit();
    const { rows } = await pool.query("SELECT * FROM workers ORDER BY created_at ASC");
    return rows.map(mapWorker);
  },
  async createWorker(data: Omit<Worker, "id" | "createdAt">): Promise<Worker> {
    await ensureInit();
    const id = rid("w");
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO workers (id, name, gender, zone, region, division, position, payment_status, verified, registered_by, registered_by_name, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        id, data.name, data.gender, data.zone, data.region, data.division, data.position,
        data.paymentStatus, data.verified, data.registeredBy, data.registeredByName, now,
      ]
    );
    return (await this.findWorkerById(id))!;
  },
  async updateWorker(id: string, patch: Partial<Worker>): Promise<Worker | undefined> {
    await ensureInit();
    const fields: string[] = [];
    const vals: any[] = [];
    let i = 1;
    const set = (col: string, val: any) => { fields.push(`${col}=$${i++}`); vals.push(val); };
    if (patch.name !== undefined) set("name", patch.name);
    if (patch.gender !== undefined) set("gender", patch.gender);
    if (patch.zone !== undefined) set("zone", patch.zone);
    if (patch.region !== undefined) set("region", patch.region);
    if (patch.division !== undefined) set("division", patch.division);
    if (patch.position !== undefined) set("position", patch.position);
    if (patch.paymentStatus !== undefined) set("payment_status", patch.paymentStatus);
    if (patch.verified !== undefined) set("verified", patch.verified);
    if (patch.registeredBy !== undefined) set("registered_by", patch.registeredBy);
    if (patch.registeredByName !== undefined) set("registered_by_name", patch.registeredByName);
    if (fields.length === 0) return this.findWorkerById(id);
    vals.push(id);
    await pool.query(`UPDATE workers SET ${fields.join(", ")} WHERE id=$${i}`, vals);
    return this.findWorkerById(id);
  },
  async deleteWorker(id: string): Promise<void> {
    await ensureInit();
    await pool.query("DELETE FROM workers WHERE id=$1", [id]);
  },
  async findWorkerByNameOrId(q: string): Promise<Worker[]> {
    await ensureInit();
    const { rows } = await pool.query(
      "SELECT * FROM workers WHERE LOWER(name) LIKE LOWER($1) OR LOWER(id) LIKE LOWER($1)",
      [`%${q}%`]
    );
    return rows.map(mapWorker);
  },
  async findWorkerById(id: string): Promise<Worker | undefined> {
    await ensureInit();
    const { rows } = await pool.query("SELECT * FROM workers WHERE id=$1 LIMIT 1", [id]);
    return rows[0] ? mapWorker(rows[0]) : undefined;
  },

  // ---------- attendances ----------
  async listAttendances(): Promise<Attendance[]> {
    await ensureInit();
    const { rows } = await pool.query("SELECT * FROM attendances ORDER BY checked_in_at DESC");
    return rows.map(mapAttendance);
  },
  async checkIn(data: Omit<Attendance, "id" | "checkedInAt">): Promise<Attendance> {
    await ensureInit();
    const id = rid("att");
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO attendances (id, worker_id, worker_name, zone, region, division, checked_in_by, checked_in_by_name, checked_in_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id, data.workerId, data.workerName, data.zone, data.region, data.division,
        data.checkedInBy, data.checkedInByName, now,
      ]
    );
    return { id, checkedInAt: now, ...data };
  },
  async checkOut(id: string): Promise<Attendance | undefined> {
    await ensureInit();
    const now = new Date().toISOString();
    await pool.query("UPDATE attendances SET checked_out_at=$1 WHERE id=$2", [now, id]);
    const { rows } = await pool.query("SELECT * FROM attendances WHERE id=$1 LIMIT 1", [id]);
    return rows[0] ? mapAttendance(rows[0]) : undefined;
  },

  // ---------- reports ----------
  async listReports(): Promise<Report[]> {
    await ensureInit();
    const { rows } = await pool.query("SELECT * FROM reports ORDER BY created_at DESC");
    return rows.map(mapReport);
  },
  async createReport(data: Omit<Report, "id" | "createdAt">): Promise<Report> {
    await ensureInit();
    const id = rid("r");
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO reports (id, title, description, category, zone, region, division, submitted_by, submitted_by_name, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id, data.title, data.description, data.category, data.zone, data.region, data.division,
        data.submittedBy, data.submittedByName, now,
      ]
    );
    return { id, createdAt: now, ...data };
  },

  // ---------- messages ----------
  async createMessage(data: Omit<Message, "id" | "createdAt" | "readBy">): Promise<Message> {
    await ensureInit();
    const id = rid("m");
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO messages (id, title, content, sender_id, sender_name, sender_role, target_role, priority, read_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id, data.title, data.content, data.senderId, data.senderName, data.senderRole,
        data.targetRole, data.priority, "[]", now,
      ]
    );
    return { id, createdAt: now, readBy: [], ...data };
  },
  async getMessages(userId: string, userRole: RoleType): Promise<Message[]> {
    await ensureInit();
    const { rows } = await pool.query(
      "SELECT * FROM messages WHERE target_role='all' OR target_role=$1 ORDER BY created_at DESC",
      [userRole]
    );
    return rows.map(mapMessage);
  },
  async getUnreadCount(userId: string, userRole: RoleType): Promise<number> {
    const msgs = await this.getMessages(userId, userRole);
    return msgs.filter(m => !m.readBy.includes(userId)).length;
  },
  async markMessageRead(messageId: string, userId: string): Promise<void> {
    await ensureInit();
    const { rows } = await pool.query("SELECT read_by FROM messages WHERE id=$1 LIMIT 1", [messageId]);
    if (!rows[0]) return;
    const readBy: string[] = rows[0].read_by ? JSON.parse(rows[0].read_by) : [];
    if (!readBy.includes(userId)) readBy.push(userId);
    await pool.query("UPDATE messages SET read_by=$1 WHERE id=$2", [JSON.stringify(readBy), messageId]);
  },
  async markAllRead(userId: string, userRole: RoleType): Promise<void> {
    await ensureInit();
    const msgs = await this.getMessages(userId, userRole);
    for (const m of msgs) {
      if (!m.readBy.includes(userId)) await this.markMessageRead(m.id, userId);
    }
  },

  // ---------- sessions ----------
  async addSession(session: Session): Promise<void> {
    await ensureInit();
    await pool.query(
      `INSERT INTO sessions (id, user_id, refresh_token, device, browser, os, ip, created_at, last_activity, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        session.id, session.userId, session.refreshToken, session.device, session.browser,
        session.os, session.ip, session.createdAt, session.lastActivity, session.expiresAt,
      ]
    );
  },
  async findSession(sid: string, userId: string): Promise<Session | undefined> {
    await ensureInit();
    const { rows } = await pool.query(
      "SELECT * FROM sessions WHERE id=$1 AND user_id=$2 LIMIT 1", [sid, userId]
    );
    return rows[0] ? mapSession(rows[0]) : undefined;
  },
  async listSessions(userId: string): Promise<Session[]> {
    await ensureInit();
    const { rows } = await pool.query("SELECT * FROM sessions WHERE user_id=$1 ORDER BY created_at DESC", [userId]);
    return rows.map(mapSession);
  },
  async updateSession(sid: string, patch: Partial<Session>): Promise<void> {
    await ensureInit();
    const fields: string[] = [];
    const vals: any[] = [];
    let i = 1;
    const set = (col: string, val: any) => { fields.push(`${col}=$${i++}`); vals.push(val); };
    if (patch.refreshToken !== undefined) set("refresh_token", patch.refreshToken);
    if (patch.lastActivity !== undefined) set("last_activity", patch.lastActivity);
    if (fields.length === 0) return;
    vals.push(sid);
    await pool.query(`UPDATE sessions SET ${fields.join(", ")} WHERE id=$${i}`, vals);
  },
  async removeSession(sid: string, userId?: string): Promise<void> {
    await ensureInit();
    if (userId) await pool.query("DELETE FROM sessions WHERE id=$1 AND user_id=$2", [sid, userId]);
    else await pool.query("DELETE FROM sessions WHERE id=$1", [sid]);
  },
  async revokeAllSessions(userId: string): Promise<number> {
    await ensureInit();
    const { rowCount } = await pool.query("DELETE FROM sessions WHERE user_id=$1", [userId]);
    return rowCount ?? 0;
  },
  async sessionExists(sid: string): Promise<boolean> {
    await ensureInit();
    const { rows } = await pool.query("SELECT 1 FROM sessions WHERE id=$1 LIMIT 1", [sid]);
    return rows.length > 0;
  },

  // ---------- settings ----------
  async isVerificationLocked(): Promise<boolean> {
    await ensureInit();
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='verification_locked' LIMIT 1");
    return rows[0]?.value === "true";
  },
  async setVerificationLocked(locked: boolean): Promise<void> {
    await ensureInit();
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ('verification_locked', $1)
       ON CONFLICT (key) DO UPDATE SET value=$1`,
      [String(locked)]
    );
  },
};
