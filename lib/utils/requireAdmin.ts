import { adminAuth, adminDb } from "@/lib/firebase-admin";

export type AdminAuthResult =
  | { ok: true; uid: string; email: string | null; token: string }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Verifies that an incoming request carries a valid Firebase ID token
 * (Authorization: Bearer <token>) AND that the token's uid belongs to a
 * users/{uid} doc with type === "Admin" (case-insensitive, matching the
 * same check used at sign-in in app/api/signin/route.ts).
 *
 * R01 (P0): economic/admin-mutation routes previously trusted a plain
 * caller-supplied `adminUid`/`created_by` body field for both authorization
 * AND audit attribution — a forgeable value, not a verified identity. Every
 * route using this helper should use the returned `uid` for audit fields
 * instead of anything read from the request body.
 */
export async function verifyAdminRequest(req: Request): Promise<AdminAuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.split("Bearer ")[1];
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return { ok: false, status: 401, error: "Invalid or expired session. Please sign in again." };
  }

  const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
  const userType = userDoc.data()?.type;
  if (typeof userType !== "string" || userType.toLowerCase() !== "admin") {
    return { ok: false, status: 403, error: "This account does not have admin access." };
  }

  return { ok: true, uid: decoded.uid, email: decoded.email ?? null, token };
}
