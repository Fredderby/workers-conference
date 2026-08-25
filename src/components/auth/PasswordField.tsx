"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PasswordField({ value, onChange, placeholder = "Password", id = "password", className }: { value?: string; onChange?: (v: string) => void; placeholder?: string; id?: string; className?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className={cn("relative", className)}>
      <Input id={id} type={show ? "text" : "password"} placeholder={placeholder} value={value} onChange={e => onChange?.(e.target.value)} className="pr-11" />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
