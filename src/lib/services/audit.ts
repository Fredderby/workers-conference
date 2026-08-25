import { db } from "@/lib/db/mock";
// Audit Service — immutable logs per workers.md:253-278
export const auditService = {
  log: db.audit,
  list: (userId?: string) => userId ? db.auditLogs.filter(l=> l.userId===userId) : db.auditLogs,
  listAll: () => db.auditLogs,
};
