import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-[#f6f7ff] dark:bg-[#050a1e]">
      <div className="text-center max-w-md">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-red-100 dark:bg-red-950/40 grid place-items-center text-red-600"><ShieldAlert /></div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">403 — Access Denied</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">You don’t have permission to access this portal. Your role does not allow viewing this page.</p>
        <p className="mt-1 text-xs text-slate-500">Attempt logged to immutable audit trail.</p>
        <Link href="/login" className="inline-flex mt-6 rounded-xl bg-[#1a237e] text-white px-6 py-3 text-sm font-medium hover:bg-[#283593]">Back to login</Link>
      </div>
    </div>
  );
}
