"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setSent(true); setLoading(false);
  };
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-[#f6f7ff] dark:bg-[#050a1e]">
      <Card className="w-full max-w-md glass rounded-[24px] overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-[#1a237e] to-[#7c4dff]" />
        <CardHeader>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 hover:underline"><ArrowLeft size={14}/> Back to login</Link>
          <h1 className="text-xl font-bold mt-2">Forgot password?</h1>
          <p className="text-sm text-slate-500">Enter your email to receive a secure reset link. Token expires in 15 minutes.</p>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email address</Label>
                <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/><Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@dclm.workers.conf" className="pl-10" required/></div>
              </div>
              <Button loading={loading} className="w-full">Send reset link</Button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 grid place-items-center text-emerald-600"><CheckCircle2/></div>
              <p className="font-medium">Check your email</p>
              <p className="text-sm text-slate-500">If an account exists for <b>{email}</b>, you’ll receive a link shortly. For demo, proceed to <Link href="/reset-password" className="underline text-[#1a237e]">reset page</Link>.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
