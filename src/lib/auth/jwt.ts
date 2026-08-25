import * as jose from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dclm-workers-conf-ultra-secret-32chars!!");
const JWT_ISSUER = "dclm-workers-conf";

export interface JWTPayload {
  sub: string;
  role: string;
  email: string;
  username: string;
  displayName: string;
  region?: string;
  sid: string; // session id
}

export async function signAccessToken(payload: JWTPayload, expiresIn = "15m") {
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: { sub: string; sid: string }, expiresIn = "7d") {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, { issuer: JWT_ISSUER });
    return payload as unknown as JWTPayload & jose.JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, { issuer: JWT_ISSUER });
    return payload as unknown as { sub: string; sid: string } & jose.JWTPayload;
  } catch {
    return null;
  }
}
