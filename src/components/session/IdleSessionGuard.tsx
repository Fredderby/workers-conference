"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Clock } from "lucide-react";

const IDLE_MS = 30 * 60 * 1000;        // 30 min inactivity before warning
const COUNTDOWN_S = 60;                 // seconds shown in the countdown ring
const REFRESH_MS = 14 * 60 * 1000;      // refresh access token before its 15-min expiry

export function IdleSessionGuard() {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_S);
  const lastActivity = useRef(Date.now());
  const lastRefresh = useRef(Date.now());
  const warningShownAt = useRef<number | null>(null);

  const resetActivity = useCallback(() => {
    lastActivity.current = Date.now();
    if (showWarning) setShowWarning(false);
  }, [showWarning]);

  const refreshToken = useCallback(async () => {
    try { await fetch("/api/auth/refresh", { method: "POST" }); } catch { /* server unreachable — keep going */ }
  }, []);

  // Track real user activity across the whole document
  useEffect(() => {
    const seen: Record<string, number> = {};
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"] as const;
    const handler = () => {
      const now = Date.now();
      // Throttle: even heavy scrolling counts as a single activity burst
      if (now - (seen._all || 0) < 1000) return;
      seen._all = now;
      resetActivity();
    };
    events.forEach(ev => window.addEventListener(ev, handler, { passive: true }));
    return () => events.forEach(ev => window.removeEventListener(ev, handler));
  }, [resetActivity]);

  // Idle monitor: warn after 30 min, count down, then log out
  useEffect(() => {
    const tick = setInterval(() => {
      const idleMs = Date.now() - lastActivity.current;
      if (!showWarning && idleMs >= IDLE_MS) {
        warningShownAt.current = Date.now();
        setSecondsLeft(COUNTDOWN_S);
        setShowWarning(true);
        return;
      }
      if (showWarning && warningShownAt.current !== null) {
        const elapsed = Math.floor((Date.now() - warningShownAt.current) / 1000);
        const left = Math.max(0, COUNTDOWN_S - elapsed);
        setSecondsLeft(left);
        if (left <= 0) {
          clearInterval(tick);
          fetch("/api/auth/logout", { method: "POST" }).finally(() => window.location.assign("/login"));
          return;
        }
      }
    }, 1000);

    // Proactive refresh: keep the 15-min access token alive while the session is in use
    const ref = setInterval(async () => {
      if (Date.now() - lastRefresh.current >= REFRESH_MS && Date.now() - lastActivity.current < IDLE_MS) {
        lastRefresh.current = Date.now();
        await refreshToken();
      }
    }, 30_000);

    return () => { clearInterval(tick); clearInterval(ref); };
  }, [showWarning, refreshToken]);

  const staySignedIn = useCallback(async () => {
    lastRefresh.current = Date.now();
    await refreshToken();
    setShowWarning(false);
    lastActivity.current = Date.now();
  }, [refreshToken]);

  const signOutNow = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST" }).finally(() => window.location.assign("/login"));
  }, []);

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          key="idle-guard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] grid place-items-center bg-slate-950/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.92, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-950/30 ring-1 ring-black/5 dark:ring-white/10"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
            <div className="p-6 sm:p-7 text-center">
              <div className="relative mx-auto h-28 w-28">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="7" className="stroke-slate-100 dark:stroke-slate-800" />
                  <motion.circle
                    cx="50" cy="50" r="42" fill="none" strokeWidth="7" strokeLinecap="round"
                    className="stroke-indigo-500"
                    strokeDasharray={2 * Math.PI * 42}
                    animate={{ strokeDashoffset: (2 * Math.PI * 42) * (1 - secondsLeft / COUNTDOWN_S) }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{secondsLeft}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">seconds</p>
                  </div>
                </div>
              </div>

              <h3 className="mt-4 flex items-center justify-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <Clock size={18} className="text-indigo-500" /> Ending Session
              </h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                You've been inactive for 30 minutes. Your session will end when the countdown reaches zero.
              </p>

              <div className="mt-6 grid gap-2.5">
                <button
                  onClick={staySignedIn}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:scale-[0.98]"
                >
                  Stay signed in
                </button>
                <button
                  onClick={signOutNow}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98]"
                >
                  <LogOut size={14} /> Sign out now
                </button>
              </div>
              <p className="mt-4 text-[11px] text-slate-400">Any mouse or keyboard activity dismisses this automatically.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}