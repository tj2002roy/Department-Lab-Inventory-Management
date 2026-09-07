import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const AUTH_SECRET = process.env.AUTH_SECRET || "uem-jaipur-lab-ims-jwt-secret-key-2026-production";
const COOKIE_NAME = "lab_auth_token";

export interface SessionPayload {
  userId: string;
  username: string;
  name: string;
  role: "ADMIN" | "TEACHER" | "AUDITOR";
  exp: number;
}

const PBKDF2_ITERATIONS = 100000;

/**
 * Hashes a plaintext password using PBKDF2 with 100,000 iterations and random per-user salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored salt:hash string using timing-safe comparison.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  // 100,000 iterations standard (v1.0.0)
  const hash100k = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
  if (crypto.timingSafeEqual(Buffer.from(hash100k), Buffer.from(originalHash))) {
    return true;
  }
  // Legacy fallback support for 10,000 iterations
  const hash10k = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash10k), Buffer.from(originalHash));
}

/**
 * Creates a signed session token.
 */
export function createSessionToken(payload: Omit<SessionPayload, "exp">): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const data: SessionPayload = { ...payload, exp };
  const base64Data = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(base64Data)
    .digest("base64url");
  return `${base64Data}.${signature}`;
}

/**
 * Verifies and decodes a signed session token.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [base64Data, signature] = token.split(".");
    if (!base64Data || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(base64Data)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(
      Buffer.from(base64Data, "base64url").toString("utf8")
    );

    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Reads and verifies the current authenticated user from Next.js request cookies.
 * Also fetches their currently assigned lab IDs.
 */
export async function getAuthenticatedUser() {
  try {
    const cookieStore = cookies();
    let token = cookieStore.get(COOKIE_NAME)?.value || cookieStore.get("Lab_auth_token")?.value;

    if (!token) {
      const { headers } = await import("next/headers");
      const reqHeaders = headers();
      const authHeader = reqHeaders.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      } else {
        token = reqHeaders.get("x-auth-token") || undefined;
      }
    }

    if (!token) return null;

    const session = verifySessionToken(token);
    if (!session) return null;

    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: {
        labAssignments: {
          select: { labId: true },
        },
      },
    });

    if (!user) return null;

    const assignedLabIds = user.labAssignments.map((a) => a.labId);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role as "ADMIN" | "TEACHER" | "AUDITOR",
      assignedLabIds,
    };
  } catch {
    return null;
  }
}

/**
 * Helper to check whether a user is authorized to perform modifications in a lab:
 * - Admin (HOD): Always authorized across all labs.
 * - Teacher: Authorized ONLY if assigned to that specific labId.
 */
export function canModifyLab(
  user: { role: string; assignedLabIds?: string[] } | null | undefined,
  labId: string
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return !!user.assignedLabIds?.includes(labId);
}
