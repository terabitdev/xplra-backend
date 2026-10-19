/**
 * Client-side helper for attaching the signed-in admin's Firebase ID token
 * to a fetch call, matching the `Authorization: Bearer <token>` convention
 * already used by app/api/user/profile and verified server-side by
 * lib/utils/requireAdmin.ts. Safe to import from client components only
 * (reads localStorage) — returns no Authorization header outside the
 * browser instead of throwing.
 */
export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}
