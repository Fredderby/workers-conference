import bcrypt from "bcryptjs";
// Password Service: Argon2id preferred (via 'argon2' package in production), bcrypt fallback for demo/edge.
// To enable Argon2id: npm i argon2 ; uncomment below and use hashArgon2id/verifyArgon2id.
// import * as argon2 from "argon2";
// export const hashArgon2id = (pw:string)=> argon2.hash(pw, { type: argon2.argon2id });
// export const verifyArgon2id = (hash:string, pw:string)=> argon2.verify(hash, pw);

export async function hashPassword(plain: string) {
  // production: try argon2 first, fallback to bcrypt
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export type Strength = "Weak" | "Fair" | "Good" | "Strong" | "Excellent";

export function getPasswordStrength(pw: string): { score: number; label: Strength; percent: number } {
  let score = 0;
  if (pw.length >= 12) score += 2;
  else if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[a-z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (pw.length >= 16) score += 1;
  // clamp 0-7
  const percent = Math.min(100, Math.round((score / 7) * 100));
  let label: Strength = "Weak";
  if (score >= 6) label = "Excellent";
  else if (score >= 5) label = "Strong";
  else if (score >= 4) label = "Good";
  else if (score >= 3) label = "Fair";
  return { score, label, percent };
}

export function validatePasswordPolicy(pw: string): string | null {
  if (pw.length < 12) return "Password must be at least 12 characters";
  if (!/[A-Z]/.test(pw)) return "Must contain an uppercase letter";
  if (!/[a-z]/.test(pw)) return "Must contain a lowercase letter";
  if (!/[0-9]/.test(pw)) return "Must contain a number";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Must contain a special character";
  return null;
}
