"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Sparkles, Globe, Users, Award, ChevronRight, Mail, Lock, Sun, Moon, AlertCircle, CheckCircle2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PasswordField } from "@/components/auth/PasswordField";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  identifier: z.string().min(3, "Enter email or username"),
  password: z.string().min(1, "Password required"),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const identifierRef = useRef<HTMLInputElement>(null);
  const [dark, setDark] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const [quoteIdx, setQuoteIdx] = useState(0);
  const quotes = [
    { text: "Come, let us reason together.", ref: "Isaiah 1:18", type: "verse" },
    { text: "A worker-retreat is not a retreat from work — it is a retreat into the purpose of work.", ref: "DCLM Workers Conference", type: "quote" },
    { text: "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.", ref: "Proverbs 27:17", type: "verse" },
    { text: "When workers pray together, they serve together with greater power and unity.", ref: "Workers Conference", type: "quote" },
    { text: "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.", ref: "Joshua 1:9", type: "verse" },
    { text: "The conference is a time to recharge, reflect, and return to the harvest field renewed.", ref: "DCLM Workers Conference", type: "quote" },
    { text: "And let us not be weary in well doing: for in due season we shall reap, if we faint not.", ref: "Galatians 6:9", type: "verse" },
    { text: "Worker retreats renew the spirit that the work requires.", ref: "Workers Conference", type: "quote" },
    { text: "Behold, how good and how pleasant it is for brethren to dwell together in unity!", ref: "Psalm 133:1", type: "verse" },
    { text: "Together we stand, divided we fall — this conference binds us as one.", ref: "DCLM Workers Conference", type: "quote" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setQuoteIdx(i => (i + 1) % quotes.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "", rememberMe: false },
  });

  useEffect(() => {
    identifierRef.current?.focus();
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true); document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nd = !dark; setDark(nd);
    document.documentElement.classList.toggle("dark", nd);
    localStorage.setItem("theme", nd ? "dark" : "light");
  };

  const onSubmit = async (data: FormData) => {
    setError(null); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: data.identifier, password: data.password, rememberMe: data.rememberMe }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Login failed");
        setAttempts(a => a + 1);
        return;
      }
      if (json.requirePasswordChange) {
        router.push("/reset-password?force=1");
        return;
      }
      setSuccess(true);
      // All roles go to unified /dashboard — role controls what sections you see
      setTimeout(() => router.push("/dashboard"), 600);
    } catch {
      setError("Unable to connect. Please check your connection and try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-[#f6f7ff] dark:bg-[#050a1e] overflow-hidden relative">
      {/* animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob bg-gradient-to-br from-indigo-400 to-violet-400 w-[560px] h-[560px] -top-32 -left-32" />
        <div className="blob bg-gradient-to-br from-blue-400 to-cyan-300 w-[480px] h-[480px] top-1/2 -right-32" style={{ animationDelay: "2s" }} />
        <div className="blob bg-gradient-to-br from-violet-300 to-purple-400 w-[420px] h-[420px] bottom-0 left-1/3" style={{ animationDelay: "4s" }} />
      </div>

      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-10 z-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg">
              <img src="/dclmlogo.JPG" alt="Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-semibold leading-none tracking-tight text-slate-900 dark:text-white">Workers Conference</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Registration & Verification System</p>
            </div>
          </div>

          <div className="mt-16 max-w-[520px]">
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="mt-6 text-[42px] font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white" style={{ fontFamily: "var(--font-display)" }}>
              Secure access to <span className="bg-gradient-to-r from-[#1a237e] to-[#7c4dff] bg-clip-text text-transparent">National Workers</span> Conference
            </motion.h1>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
              Enterprise-grade authentication for thousands of workers nationwide. Role-based portals, real-time verification, and immutable audit trails.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { icon: Users, label: "12k+ Workers", sub: "Registered" },
                { icon: Globe, label: "6 Regions", sub: "Concurrent" },
                { icon: Award, label: "99.9% Uptime", sub: "SLA" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur p-4 border border-white/60 dark:border-white/10">
                  <s.icon size={18} className="text-[#1a237e] dark:text-indigo-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{s.label}</p>
                  <p className="text-xs text-slate-500">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>© 2026 Workers Conference • Deeper Life Bible Church</span>
          <span className="flex items-center gap-2"><Sparkles size={14} /> Enterprise Secure</span>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 z-10">
        <div className="w-full max-w-[440px]">
          {/* mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl overflow-hidden"><img src="/dclmlogo.JPG" alt="Logo" className="h-full w-full object-cover" /></div>
            <div><p className="font-semibold text-sm">Workers Conference</p><p className="text-xs text-slate-500">Registration & Verification</p></div>
            <button onClick={toggleTheme} className="ml-auto h-9 w-9 rounded-full bg-white dark:bg-zinc-800 grid place-items-center border"><Sun className="dark:hidden" size={16} /><Moon className="hidden dark:block" size={16} /></button>
          </div>

          <Card className="glass shadow-[0_20px_60px_-20px_rgba(26,35,126,0.35)] rounded-[24px] overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-[#1a237e] via-[#3949ab] to-[#7c4dff]" />
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">Welcome back</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to your assigned portal</p>
                </div>
                <button onClick={toggleTheme} className="hidden lg:grid h-9 w-9 place-items-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 transition">
                  {dark ? <Moon size={16} /> : <Sun size={16} />}
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="identifier">Email or Username</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input id="identifier" placeholder="e.g. super@dclm.workers.conf" className="pl-10 h-[44px]" {...register("identifier")} ref={e => { register("identifier").ref(e); if (e) (identifierRef as any).current = e; }} />
                  </div>
                  {errors.identifier && <p className="text-xs text-red-500">{errors.identifier.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between"><Label htmlFor="password">Password</Label><a href="/forgot-password" className="text-xs font-medium text-[#1a237e] dark:text-indigo-300 hover:underline">Forgot password?</a></div>
                  <PasswordField value={watch("password")} onChange={v => setValue("password", v)} />
                  {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                </div>

                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input type="checkbox" {...register("rememberMe")} className="h-4 w-4 rounded border-zinc-300 text-[#1a237e] focus:ring-[#1a237e]" />
                  <span className="text-slate-700 dark:text-slate-300">Remember me for 30 days</span>
                  <span className="ml-auto text-xs text-zinc-400">Secure cookie</span>
                </label>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2.5 text-sm text-red-700 dark:text-red-300">
                      <AlertCircle size={16} className="shrink-0" /> {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 size={16} /> Success — redirecting…
                    </motion.div>
                  )}
                </AnimatePresence>

                {attempts >= 2 && (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-200">
                    Multiple failed attempts detected. CAPTCHA and rate limiting would activate here. Account locks after 5 failures for 5 minutes.
                  </div>
                )}

                <Button type="submit" loading={loading} className="w-full h-11 rounded-xl text-[14px] font-semibold tracking-wide">
                  {loading ? "Authenticating…" : "Sign in"} {!loading && <ChevronRight size={16} />}
                </Button>

                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-zinc-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />System Online</div>
                  <div className="text-right text-zinc-400">Enterprise Secure</div>
                </div>
              </form>

              <div className="mt-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/20 border border-indigo-100 dark:border-indigo-900 p-5 overflow-hidden relative min-h-[120px]">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={14} className="text-indigo-500 dark:text-indigo-300" />
                  <p className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-300 uppercase tracking-widest">Workers Conference</p>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={quoteIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                    className="min-h-[60px]"
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed italic">"{quotes[quoteIdx].text}"</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">— {quotes[quoteIdx].ref}</p>
                  </motion.div>
                </AnimatePresence>
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  {quotes.map((_, i) => (
                    <button key={i} onClick={() => setQuoteIdx(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === quoteIdx ? "w-5 bg-indigo-500" : "w-1.5 bg-indigo-300 dark:bg-indigo-700"}`} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-slate-500 mt-4">Protected by enterprise security • CSRF • XSS • Rate limiting • Audit logs</p>
        </div>
      </div>
    </div>
  );
}
