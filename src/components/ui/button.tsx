import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#1a237e] text-white hover:bg-[#283593] shadow-lg shadow-indigo-900/20",
        outline: "border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900",
        ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-800",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}
export function Button({ className, variant, size, loading, children, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} disabled={loading || props.disabled} {...props}>
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
      {children}
    </button>
  );
}
