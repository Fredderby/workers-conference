import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a237e] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";
