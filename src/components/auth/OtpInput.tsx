"use client";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function OtpInput({ length = 6, value, onChange }: { length?: number; value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const arr = value.split("");
    while (arr.length < length) arr.push("");
    arr[i] = digit;
    const next = arr.join("").slice(0, length);
    onChange(next);
    if (digit && i < length - 1) refs.current[i + 1]?.focus();
  };
  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          value={value[i] || ""}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          inputMode="numeric"
          maxLength={1}
          className={cn("h-12 w-11 text-center text-lg font-semibold rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a237e] dark:bg-zinc-900 dark:border-zinc-700")}
        />
      ))}
    </div>
  );
}
