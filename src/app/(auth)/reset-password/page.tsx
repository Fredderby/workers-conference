"use client";
import { Suspense, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { validatePasswordPolicy } from "@/lib/auth/password";
import { CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const router = useRouter();
  const force = useSearchParams().get("force");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    const err = validatePasswordPolicy(next);
    if (err) { setMsg(err); return; }
    if (next !== confirm) { setMsg("Passwords do not match"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: current, newPassword: next }) });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error); setLoading(false); return; }
    setOk(true); setLoading(false);
    setTimeout(()=> router.push("/login"), 1400);
  };

  return (
    <Card className="w-full max-w-md glass rounded-[24px] overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-[#1a237e]" />
      <CardHeader>
        <h1 className="text-xl font-bold">{force ? "Change temporary password" : "Create new password"}</h1>
        <p className="text-sm text-slate-500">{force ? "You must set a new password before continuing. Minimum 12 chars, mixed case, number & symbol." : "Enter a strong password. Token expires quickly."}</p>
      </CardHeader>
      <CardContent>
        {!ok ? (
          <form onSubmit={submit} className="space-y-4">
            {force && <div className="space-y-1.5"><Label>Current (temporary) password</Label><PasswordField value={current} onChange={setCurrent} /></div>}
            <div className="space-y-1.5"><Label>New password</Label><PasswordField value={next} onChange={setNext} placeholder="New strong password" /><PasswordStrength password={next}/></div>
            <div className="space-y-1.5"><Label>Confirm password</Label><PasswordField value={confirm} onChange={setConfirm} placeholder="Confirm password" /></div>
            {msg && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2">{msg}</p>}
            <Button loading={loading} className="w-full">{force ? "Update & Continue" : "Reset password"}</Button>
            {!force && <Link href="/login" className="block text-center text-sm underline text-slate-600">Back to login</Link>}
          </form>
        ) : (
          <div className="text-center py-6 space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 grid place-items-center text-emerald-600"><CheckCircle2/></div>
            <p className="font-semibold">Password updated</p><p className="text-sm text-slate-500">Redirecting to login…</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPage() {
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-[#f6f7ff] dark:bg-[#050a1e]">
      <Suspense fallback={<div className="text-sm text-slate-500">Loading…</div>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
