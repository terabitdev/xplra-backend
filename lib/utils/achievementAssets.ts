import { adminStorage } from '@/lib/firebase-admin';

export const MAX_ACHIEVEMENT_ASSET_BYTES = 4 * 1024 * 1024; // 4MB, matches the Places upload limit

/**
 * Uploads a badge/thumbnail image to Firebase Storage under
 * achievements/{achievementId}/{kind}_..., same pattern as places/create,
 * and returns its public URL.
 */
export async function uploadAchievementAsset(
  file: File,
  achievementId: string,
  kind: 'badge' | 'thumbnail'
): Promise<string> {
  if (file.size > MAX_ACHIEVEMENT_ASSET_BYTES) {
    throw new Error(`"${file.name}" exceeds the 4MB limit`);
  }
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" is not an image`);
  }

  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  const fileName = `${kind}_${timestamp}_${randomStr}_${file.name}`;
  const filePath = `achievements/${achievementId}/${fileName}`;

  const bucket = adminStorage.bucket();
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const fileRef = bucket.file(filePath);

  await fileRef.save(fileBuffer, { metadata: { contentType: file.type } });
  await fileRef.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
}
