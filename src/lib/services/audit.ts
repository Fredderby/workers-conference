import { db } from "@/lib/db/pg";
// Audit Service — immutable logs per workers.md:253-278
export const auditService = {
  log: (entry: Parameters<typeof db.audit>[0]) => db.audit(entry),
  list: (userId?: string) => db.listAuditLogs(userId),
  listAll: () => db.listAuditLogs(),
};
