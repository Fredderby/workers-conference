"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, X, AlertTriangle, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  title: string;
  content: string;
  senderName: string;
  senderRole: string;
  targetRole: string;
  priority: "normal" | "urgent";
  readBy: string[];
  createdAt: string;
}

interface NotificationBellProps {
  userId: string;
  onNavigateToBroadcast: () => void;
}

export function NotificationBell({ userId, onNavigateToBroadcast }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prevUnread, setPrevUnread] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState<Message | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/messages");
      if (!res.ok) return;
      const data = await res.json();
      const newCount = data.unreadCount || 0;
      const msgs = data.messages || [];

      // Detect new messages
      if (prevCountRef.current > 0 && newCount > prevCountRef.current) {
        const newest = msgs.find((m: Message) => !m.readBy?.includes(userId));
        if (newest) {
          setToastMsg(newest);
          setShowToast(true);
          // Play sound for urgent
          if (newest.priority === "urgent") {
            try { new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgip2Ono1hLjqHsL2Te2E3S5i3wZl0VjxLj7O4mHlbPU2WtLmYeFs+TZa1uZd3XD9OlrW4l3hcQE+YtreUdVxCT5m2t5R0XUNQmba2k3JdRFGatbWScF5GUZq0tJFvX0hSm7Ozj25gS1SbsbCNa2NNU5uxr4tpZE9VnK+uh2dmUlabr6uFZWhWWJ2tqINkampbnp2lgGBrbGKcmZl4XW1waJ6amYZad31qoZqXhlt7hW6mmZaGXH6IcqWYlIZdgox1pZeThl6Ej3imlpGGX4aSe6eUkIZgiJR9qZKOhmGKln6qkY2FYouXf6uQjIVki5mAroyLhGSMm4KviouDZY2ega6IiYJmj5+EsIWIgWeRo4ixgYeAaZOli7B/hn5ql6qOsn2FfWyarI+xe4R8bZ2tkrF6gntun66UsniAe3Cgr5Wwdn16caKwla91fHl0o7GWrnR7eXWlspeuc3p4dqazl69yeHd3p7SYr3F3d3eoq6aFdkUBAKyYi3pbV2B1iJ+OdVREYIqfpH9eSmB8lqSSfF9Ra4WiqIhwU01qiqavg2dNV3CQp6F8YlVme5impHplWWl9nKal...") } catch {}
          }
        }
      }
      prevCountRef.current = newCount;
      setPrevUnread(newCount);
      setUnreadCount(newCount);
      setMessages(msgs.slice(0, 10));
    } catch {}
  }, [userId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showToast]);

  const markRead = async (id: string) => {
    await fetch("/api/auth/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", messageId: id }),
    });
    fetchMessages();
  };

  const markAllRead = async () => {
    await fetch("/api/auth/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    fetchMessages();
  };

  const unread = messages.filter((m) => !m.readBy?.includes(userId));

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => { setOpen(!open); }}
          className="relative h-9 w-9 grid place-items-center rounded-full border bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 hover:shadow-md active:scale-95"
          aria-label="Notifications"
        >
          <motion.div
            animate={unreadCount > 0 ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
            transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 4 }}
          >
            <Bell size={16} className="text-slate-600 dark:text-slate-300" />
          </motion.div>
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white text-[9px] font-bold shadow-lg shadow-red-500/30 ring-2 ring-white dark:ring-slate-900"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-[360px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/10 dark:shadow-black/30 overflow-hidden z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                    >
                      <CheckCheck size={12} /> Mark all read
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="h-6 w-6 grid place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <X size={12} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="max-h-[400px] overflow-y-auto">
                {unread.length > 0 && (
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Unread</p>
                  </div>
                )}
                {unread.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-800/50"
                    onClick={() => { markRead(m.id); setOpen(false); onNavigateToBroadcast(); }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.priority === "urgent" ? "bg-red-100 dark:bg-red-900/30" : "bg-indigo-100 dark:bg-indigo-900/30"}`}>
                        {m.priority === "urgent" ? (
                          <AlertTriangle size={14} className="text-red-600 dark:text-red-400" />
                        ) : (
                          <MessageSquare size={14} className="text-indigo-600 dark:text-indigo-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{m.title}</p>
                          {m.priority === "urgent" && <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600">URGENT</span>}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{m.content}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{m.senderName} &middot; {timeAgo(m.createdAt)}</p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
                    </div>
                  </motion.div>
                ))}

                {unread.length === 0 && messages.length > 0 && (
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Recent</p>
                    {messages.slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        className="py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-colors"
                        onClick={() => { setOpen(false); onNavigateToBroadcast(); }}
                      >
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">{m.title}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{m.senderName} &middot; {timeAgo(m.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {messages.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <Bell size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs text-slate-400">No notifications yet</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => { setOpen(false); onNavigateToBroadcast(); }}
                  className="w-full text-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  View all broadcasts
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {showToast && toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[100] w-[calc(100vw-2rem)] max-w-[340px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/15 dark:shadow-black/40 overflow-hidden"
          >
            <div className={`h-1 w-full ${toastMsg.priority === "urgent" ? "bg-gradient-to-r from-red-500 to-rose-600" : "bg-gradient-to-r from-indigo-500 to-violet-600"}`} />
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${toastMsg.priority === "urgent" ? "bg-red-100 dark:bg-red-900/30" : "bg-indigo-100 dark:bg-indigo-900/30"}`}>
                  {toastMsg.priority === "urgent" ? (
                    <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                  ) : (
                    <Bell size={16} className="text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{toastMsg.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{toastMsg.content}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">From {toastMsg.senderName}</p>
                </div>
                <button onClick={() => setShowToast(false)} className="h-6 w-6 grid place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 transition-colors">
                  <X size={12} className="text-slate-400" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
