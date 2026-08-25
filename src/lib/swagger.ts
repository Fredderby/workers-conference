export const swaggerSpec = {
  openapi: "3.0.3",
  info: { title: "Workers Conference — Auth API", version: "2.4.1", description: "Enterprise Authentication & Authorization (JWT, RBAC, MFA, Audit)" },
  servers: [{ url: "/api/auth", description: "Auth base" }],
  tags: [{ name: "auth" }],
  paths: {
    "/login": { post: { tags:["auth"], summary:"Login", requestBody:{ required:true, content:{ "application/json":{ schema:{ type:"object", required:["identifier","password"], properties:{ identifier:{type:"string", example:"super@dclm.workers.conf"}, password:{type:"string", example:"Password123!"}, rememberMe:{type:"boolean"} }}}}}, responses:{ "200":{description:"OK - sets httpOnly cookies"}, "401":{description:"Invalid"}, "423":{description:"Locked"}}}},
    "/logout": { post: { tags:["auth"], summary:"Logout & revoke session", responses:{ "200":{description:"Cleared cookies"}}}},
    "/refresh": { post: { tags:["auth"], summary:"Rotate refresh token", responses:{ "200":{description:"New access token"}}}},
    "/me": { get: { tags:["auth"], summary:"Get current user", responses:{ "200":{description:"User"}}}},
    "/change-password": { post: { tags:["auth"], summary:"Change password (policy 12+chars)", requestBody:{ required:true, content:{ "application/json":{ schema:{ type:"object", properties:{ currentPassword:{type:"string"}, newPassword:{type:"string"}}} } }}, responses:{ "200":{description:"Updated"}}}},
    "/sessions": { get:{ tags:["auth"], summary:"List active sessions"}, delete:{ tags:["auth"], summary:"Revoke session(s)", requestBody:{ content:{ "application/json":{ schema:{ type:"object", properties:{ sid:{type:"string"}, all:{type:"boolean"}}}}}}}},
    "/audit": { get:{ tags:["auth"], summary:"Immutable audit logs"}},
    "/mfa": { get:{ tags:["auth"], summary:"MFA status"}, post:{ tags:["auth"], summary:"MFA enable/disable/verify", requestBody:{ content:{ "application/json":{ schema:{ type:"object", properties:{ action:{type:"string", enum:["enable","disable","verify"]}, code:{type:"string"}}}}}}}},
    "/verify-email": { post:{ tags:["auth"], summary:"Send/verify email token (demo verify123)", requestBody:{ content:{ "application/json":{ schema:{ type:"object", properties:{ email:{type:"string"}, token:{type:"string"}}}}}}}},
    "/verify-otp": { post:{ tags:["auth"], summary:"Send/verify OTP (demo 123456)", requestBody:{ content:{ "application/json":{ schema:{ type:"object", properties:{ email:{type:"string"}, code:{type:"string"}, action:{type:"string", enum:["send","verify"]}}}}}}}},
  },
} as const;
