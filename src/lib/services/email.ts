// Email Service (stub - production would use Resend/SES)
export async function sendEmail(to: string, subject: string, html: string) {
  console.log(`[EmailService] to=${to} subject=${subject}`);
  // simulate async
  await new Promise(r => setTimeout(r, 300));
  return { id: `email_${Date.now()}`, to, subject };
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  return sendEmail(email, "Reset your Workers Conference password", `<p>Reset link (15 min expiry): <a href="${link}">${link}</a></p>`);
}

export async function sendLoginNotification(email: string, ip: string, device: string) {
  return sendEmail(email, "New login to Workers Conference", `<p>New login from ${ip} • ${device}</p>`);
}

export async function sendOtpEmail(email: string, code: string) {
  return sendEmail(email, "Your DCLM verification code", `<p>OTP: <b>${code}</b> (5 min)</p>`);
}
