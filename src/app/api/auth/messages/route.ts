import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db/pg";
import { isAdmin } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const msgs = await db.getMessages(user.id, user.role);
  const unreadCount = await db.getUnreadCount(user.id, user.role);
  return NextResponse.json({ messages: msgs, unreadCount });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sender = await db.findUserById(payload.sub);
  if (!sender || !isAdmin(sender.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, content, targetRole, priority } = await req.json();
  if (!title || !content) return NextResponse.json({ error: "Title and content are required" }, { status: 400 });

  const msg = await db.createMessage({
    title,
    content,
    senderId: sender.id,
    senderName: sender.displayName,
    senderRole: sender.role,
    targetRole: targetRole || "all",
    priority: priority || "normal",
  });

  await db.audit({ userId: sender.id, action: "user_updated", ip: req.headers.get("x-forwarded-for") || "127.0.0.1", device: "admin", browser: "admin", os: "admin", detail: `Broadcast sent: "${title}" to ${targetRole || "all"}` });

  return NextResponse.json({ message: msg }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.findUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, messageId } = await req.json();

  if (action === "mark_read" && messageId) {
    await db.markMessageRead(messageId, user.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "mark_all_read") {
    await db.markAllRead(user.id, user.role);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
