"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/auth/OtpInput";
import { ShieldCheck } from "lucide-react";

export default function MfaPage() {
  const [enabled, setEnabled] = useState(false);
  const [code, setCode] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(()=>{ fetch("/api/auth/mfa").then(r=>r.json()).then(j=>{ setEnabled(j.mfaEnabled); setSecret(j.secret||null); }); },[]);

  const enable = async () => {
    const r = await fetch("/api/auth/mfa",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"enable"})});
    const j = await r.json(); setEnabled(true); setSecret(j.secret); setMsg("MFA enabled. Use code 123456 to verify in demo.");
  };
  const verify = async () => {
    const r = await fetch("/api/auth/mfa",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"verify", code})});
    const j = await r.json(); setMsg(r.ok ? "✓ MFA verified successfully" : j.error);
  };

  return (
    <div className="min-h-screen bg-[#f6f7ff] dark:bg-[#020617]">
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Card className="rounded-2xl">
          <CardHeader>
            <h2 className="font-semibold flex items-center gap-2"><ShieldCheck size={18}/> Security • MFA</h2>
            <p className="text-sm text-slate-500">Super Admins can enforce MFA by role. Supports Email OTP, Authenticator App (TOTP), and recovery codes.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border p-4 flex items-center justify-between">
              <div><p className="font-medium text-sm">Authenticator App (TOTP)</p><p className="text-xs text-slate-500">{enabled ? `Enabled • Secret ${secret}` : "Not enabled"}</p></div>
              {!enabled ? <Button onClick={enable} size="sm">Enable MFA</Button> : <Button variant="outline" size="sm" onClick={async()=>{await fetch("/api/auth/mfa",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"disable"})}); setEnabled(false); setMsg("MFA disabled");}}>Disable</Button>}
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm font-medium">Verify code (demo: 123456)</p>
              <div className="mt-3"><OtpInput value={code} onChange={setCode} /></div>
              <Button className="mt-3" onClick={verify} disabled={code.length!==6}>Verify OTP</Button>
              {msg && <p className="text-sm mt-2 text-slate-600 dark:text-slate-300">{msg}</p>}
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border p-3 text-xs text-slate-600 dark:text-slate-300">
              Enterprise: Token rotation, CSRF via SameSite=Lax, XSS via React escaping, SQL injection prevented (no raw SQL), secure headers via middleware, brute-force lockout after 5 fails, IP &amp; device logging.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
