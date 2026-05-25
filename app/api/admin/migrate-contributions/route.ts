import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import ngeohash from 'ngeohash';

interface MigrationSummary {
  totalContributions: number;
  alreadyMigrated: number;
  matchedToExistingPlace: number;
  newPlacesCreated: number;
  skipped: number;
  errors: Array<{ contributionId: string; reason: string }>;
}

const COORD_TOLERANCE = 0.0001;

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const execute = searchParams.get('execute') === 'true';

    const contributionsSnap = await adminDb.collection('contributions_places').get();

    const summary: MigrationSummary = {
      totalContributions: contributionsSnap.size,
      alreadyMigrated: 0,
      matchedToExistingPlace: 0,
      newPlacesCreated: 0,
      skipped: 0,
      errors: [],
    };

    for (const conDoc of contributionsSnap.docs) {
      const conData = conDoc.data();
      const contributionId = conDoc.id;
      const placeDraft = conData.placeDraft || {};
      const lat = placeDraft?.geo?.lat;
      const lng = placeDraft?.geo?.lng;
      const conStatus: 'pending' | 'approved' | 'rejected' = conData.status || 'pending';

      try {
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          summary.errors.push({ contributionId, reason: 'Missing or invalid geo coordinates' });
          summary.skipped++;
          continue;
        }

        const existingByLink = await adminDb
          .collection('places')
          .where('originalContributionId', '==', contributionId)
          .limit(1)
          .get();

        if (!existingByLink.empty) {
          summary.alreadyMigrated++;
          continue;
        }

        const candidatesSnap = await adminDb
          .collection('places')
          .where('source', '==', 'user_contribution')
          .where('name', '==', placeDraft.name || '')
          .get();

        let matchedDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
        for (const candidate of candidatesSnap.docs) {
          const cData = candidate.data();
          if (cData?.originalContributionId) continue; // Already linked to a different contribution
          const gp = cData?.geo?.geopoint;
          if (
            gp &&
            Math.abs(gp.latitude - lat) < COORD_TOLERANCE &&
            Math.abs(gp.longitude - lng) < COORD_TOLERANCE
          ) {
            matchedDoc = candidate;
            break;
          }
        }

        if (matchedDoc) {
          const matchedData = matchedDoc.data();
          const updates: Record<string, unknown> = {
            userId: conData.uid || null,
            originalContributionId: contributionId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };
          if (conStatus === 'approved') {
            updates.status = 'approved';
          } else if (conStatus === 'rejected') {
            updates.status = 'rejected';
            updates.rejectionReason = conData.reviewNote || '';
          } else {
            updates.status = 'pending';
          }

          // Backfill missing fields from placeDraft (old flow didn't migrate these)
          const draftImages = Array.isArray(placeDraft.images) ? placeDraft.images : [];
          if ((!matchedData.imageUrls || matchedData.imageUrls.length === 0) && draftImages.length > 0) {
            updates.imageUrls = draftImages;
          }
          if (!matchedData.description && placeDraft.description) {
            updates.description = placeDraft.description;
          }
          if (!matchedData.location && placeDraft.location) {
            updates.location = placeDraft.location;
          }
          if ((!matchedData.categorySelections || matchedData.categorySelections.length === 0) && placeDraft.categorySelections?.length) {
            updates.categorySelections = placeDraft.categorySelections;
            updates.categoryIds = Array.from(
              new Set(
                (placeDraft.categorySelections as Array<{ path: string[] }>).flatMap((cs) => cs.path || []),
              ),
            );
          }

          if (execute) {
            await matchedDoc.ref.update(updates);
          }
          summary.matchedToExistingPlace++;
          continue;
        }

        const placeId = `place_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const geohash = ngeohash.encode(lat, lng, 9);
        const categorySelections = placeDraft.categorySelections || [];
        const categoryIds = Array.from(
          new Set(
            (categorySelections as Array<{ path: string[] }>).flatMap((cs) => cs.path || []),
          ),
        );

        const newPlaceDoc: Record<string, unknown> = {
          placeId,
          name: placeDraft.name || '',
          geo: {
            geohash,
            geopoint: new admin.firestore.GeoPoint(lat, lng),
          },
          categorySelections,
          categoryIds,
          imageUrls: placeDraft.images || [],
          location: placeDraft.location || '',
          description: placeDraft.description || '',
          source: 'user_contribution',
          status: conStatus,
          userId: conData.uid || null,
          originalContributionId: contributionId,
          rejectionReason: conStatus === 'rejected' ? conData.reviewNote || '' : null,
          createdAt: conData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (execute) {
          await adminDb.collection('places').doc(placeId).set(newPlaceDoc);
        }
        summary.newPlacesCreated++;
      } catch (err: unknown) {
        const reason = err instanceof Error ? err.message : 'Unknown error';
        summary.errors.push({ contributionId, reason });
      }
    }

    return NextResponse.json({
      executed: execute,
      summary,
      note: execute
        ? 'Migration executed. Verify in Firestore console before deprecating the contributions_places collection.'
        : 'Dry run — no writes performed. Re-call with ?execute=true to apply.',
    });
  } catch (error: unknown) {
    console.error('Migration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Migration failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
