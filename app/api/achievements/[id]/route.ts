import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Achievement } from '@/lib/domain/models/achievement';
import admin from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/utils/requireAdmin';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const achievementId = params.id;

    // Search through all adminAchievements documents to find the achievement
    const adminAchievementsSnapshot = await adminDb.collection('adminAchievements').get();

    for (const doc of adminAchievementsSnapshot.docs) {
      const data = doc.data();
      const achievements = data.achievements || [];
      const achievement = achievements.find((a: Achievement) => a.id === achievementId);

      if (achievement) {
        return NextResponse.json(achievement);
      }
    }

    return NextResponse.json(
      { error: 'Achievement not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Get achievement error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch achievement' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await req.formData();
    const achievementData = JSON.parse(formData.get('achievement') as string);
    const achievementId = params.id;

    // Any admin can edit any achievement from this shared panel, so the
    // owning document is found by searching for the achievement id (same
    // approach as GET/DELETE below) rather than trusting a doc-id/admin-id
    // read from the submitted form.
    const adminAchievementsSnapshot = await adminDb.collection('adminAchievements').get();
    let adminAchievementDocRef: FirebaseFirestore.DocumentReference | null = null;
    let achievements: Achievement[] = [];
    let achievementIndex = -1;

    for (const doc of adminAchievementsSnapshot.docs) {
      const data = doc.data();
      const docAchievements: Achievement[] = data.achievements || [];
      const idx = docAchievements.findIndex((a: Achievement) => a.id === achievementId);
      if (idx !== -1) {
        adminAchievementDocRef = doc.ref;
        achievements = docAchievements;
        achievementIndex = idx;
        break;
      }
    }

    if (!adminAchievementDocRef || achievementIndex === -1) {
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      );
    }

    // Update the achievement (exclude undefined dateAchieved)
    const updatedFields: any = {
      title: achievementData.title,
      description: achievementData.description,
      icon: achievementData.icon,
      trigger: achievementData.trigger,
      triggerValue: achievementData.triggerValue,
    };

    // Only add dateAchieved if it exists
    if (achievementData.dateAchieved) {
      updatedFields.dateAchieved = achievementData.dateAchieved;
    }

    achievements[achievementIndex] = {
      ...achievements[achievementIndex],
      ...updatedFields,
    };

    // Update the document
    await adminAchievementDocRef.update({
      achievements,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      message: 'Achievement updated successfully',
      achievement: achievements[achievementIndex],
    });
  } catch (error: any) {
    console.error('Update achievement error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update achievement' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const achievementId = params.id;

    // Find the admin document containing this achievement
    const adminAchievementsSnapshot = await adminDb.collection('adminAchievements').get();

    for (const doc of adminAchievementsSnapshot.docs) {
      const data = doc.data();
      const achievements = data.achievements || [];
      const achievementToDelete = achievements.find((a: Achievement) => a.id === achievementId);

      if (achievementToDelete) {
        // Remove the achievement from the array
        await doc.ref.update({
          achievements: admin.firestore.FieldValue.arrayRemove(achievementToDelete),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
          message: 'Achievement deleted successfully',
        });
      }
    }

    return NextResponse.json(
      { error: 'Achievement not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Delete achievement error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete achievement' },
      { status: 500 }
    );
  }
}