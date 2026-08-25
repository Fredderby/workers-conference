"use client";
import { getPasswordStrength } from "@/lib/auth/password";
import { cn } from "@/lib/utils";

const colors: Record<string, string> = {
  Weak: "bg-red-500",
  Fair: "bg-orange-500",
  Good: "bg-yellow-500",
  Strong: "bg-emerald-500",
  Excellent: "bg-emerald-600",
};

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const { label, percent } = getPasswordStrength(password);
  return (
    <div className="space-y-1.5">
      <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div className={cn("h-full transition-all duration-500", colors[label])} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-zinc-500">Strength: <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span> • {percent}%</p>
    </div>
  );
}
