"use client";
import { useState, createContext, useContext } from "react";

type Toast = { id: string; title: string; description?: string };
const Ctx = createContext<{ push: (t: Omit<Toast,"id">)=> void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (t: Omit<Toast,"id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(s=> [...s, { ...t, id }]);
    setTimeout(()=> setToasts(s=> s.filter(x=> x.id!==id)), 3000);
  };
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(t=>(
          <div key={t.id} className="rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl min-w-[280px]">
            <p className="text-sm font-medium">{t.title}</p>{t.description && <p className="text-xs text-slate-300">{t.description}</p>}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export function useToast() { const v = useContext(Ctx); if(!v) throw new Error("no provider"); return v; }
