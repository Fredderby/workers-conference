import { db } from "@/lib/db/pg";

export type Notification = { id: string; userId: string; title: string; body: string; createdAt: string; read: boolean };

const notifications: Notification[] = [];

export const notificationService = {
  async notify(userId: string, title: string, body: string) {
    const n: Notification = { id: `n_${Date.now()}`, userId, title, body, createdAt: new Date().toISOString(), read: false };
    notifications.unshift(n);
    await db.audit({ userId, action: "login_success", ip: "notify", device: title, browser: "notify", os: "notify", detail: body });
    return n;
  },
  list(userId: string) { return notifications.filter(n => n.userId === userId); },
  markRead(id: string) { const n = notifications.find(x => x.id === id); if (n) n.read = true; },
};
