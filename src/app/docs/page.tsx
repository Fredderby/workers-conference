import SwaggerClient from "./swagger-client";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#020617]">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="prose dark:prose-invert max-w-none mb-6">
          <h1>Authentication API — OpenAPI 3.0 (Swagger)</h1>
          <p className="text-sm text-slate-500">Base: <code>/api/auth/*</code> • JWT httpOnly • RBAC • Interactive try-it-out below</p>
        </div>
        <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4 overflow-auto">
          <SwaggerClient />
        </div>
        <div className="prose dark:prose-invert mt-8">
          <h2>Unified Platform</h2>
          <p>All roles access the same <code>/dashboard</code>. Sections visible by role:</p>
          <ul>
            <li><b>Super Admin + National Officer</b> — Full access: Overview, User Management, Verification, Sessions, Audit, MFA</li>
            <li><b>Regional Officer</b> — Overview, Verification, Users (read-only)</li>
            <li><b>Verifier</b> — Overview, Verification only</li>
          </ul>
          <p>User Management is admin-only. Admins create all other users with temporary passwords.</p>
        </div>
      </div>
    </div>
  );
}
