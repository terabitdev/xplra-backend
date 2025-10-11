import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Achievement } from '@/lib/domain/models/achievement';
import admin from '@/lib/firebase-admin';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
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
    const formData = await req.formData();
    const achievementData = JSON.parse(formData.get('achievement') as string);
    const achievementId = params.id;
    const adminId = achievementData.userId;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    // Get admin's achievement document
    const adminAchievementDocRef = adminDb.collection('adminAchievements').doc(adminId);
    const adminAchievementDoc = await adminAchievementDocRef.get();

    if (!adminAchievementDoc.exists) {
      return NextResponse.json(
        { error: 'Admin achievement document not found' },
        { status: 404 }
      );
    }

    const data = adminAchievementDoc.data();
    const achievements = data?.achievements || [];

    // Find and update the achievement in the array
    const achievementIndex = achievements.findIndex((a: Achievement) => a.id === achievementId);

    if (achievementIndex === -1) {
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

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
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