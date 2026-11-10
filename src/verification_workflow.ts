import { createHash, randomBytes } from "node:crypto";
import { infrai } from "./infrai_email.js";
import { decideMarketplaceAccess, type SignupRequest } from "./signup_policy.js";

type PendingSignup = { signup: SignupRequest; tokenHash: string; verified: boolean };

const pending = new Map<string, PendingSignup>();

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  })[character] as string);
}

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function beginSignup(signup: SignupRequest) {
  const publicUrl = process.env.PUBLIC_BASE_URL ?? "http://localhost:3000";
  const token = randomBytes(32).toString("base64url");
  pending.set(signup.signup_id, { signup, tokenHash: hash(token), verified: false });
  const verificationUrl = `${publicUrl}/marketplace/verify?signup_id=${encodeURIComponent(signup.signup_id)}&token=${encodeURIComponent(token)}`;
  const delivery = await infrai.email.send({
    to: signup.email,
    subject: "Verify your marketplace email",
    html: `<p>Confirm this email before marketplace access is released.</p><p><a href="${escapeHtml(verificationUrl)}">Verify email</a></p>`,
  }, `marketplace-signup-${signup.signup_id}`);
  return {
    signup_id: signup.signup_id,
    verification: "pending" as const,
    message_id: delivery.message_id,
    access: decideMarketplaceAccess(signup, false),
  };
}

export function verifySignup(signupId: string, token: string) {
  const record = pending.get(signupId);
  if (!record || record.tokenHash !== hash(token)) return undefined;
  record.verified = true;
  return {
    signup_id: signupId,
    verification: "verified" as const,
    access: decideMarketplaceAccess(record.signup, true),
  };
}
