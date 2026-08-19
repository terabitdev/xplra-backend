/** Shared helper for normalizing Firestore Timestamp fields to ISO strings in API responses. */

export function isFirestoreTimestamp(value: unknown): value is { toDate: () => Date } {
  return typeof value === "object" && value !== null && typeof (value as { toDate?: unknown }).toDate === "function";
}

export function toIsoOrNull(value: unknown): string | null {
  if (isFirestoreTimestamp(value)) return value.toDate().toISOString();
  return typeof value === "string" ? value : null;
}
