import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Achievement } from '@/lib/domain/models/achievement';
import admin from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Get all admin achievement documents
    const adminAchievementsSnapshot = await adminDb.collection('adminAchievements').get();

    const allAchievements: Achievement[] = [];

    // Iterate through each admin document and collect all achievements
    adminAchievementsSnapshot.forEach((doc) => {
      const data = doc.data();
      const achievements = data.achievements || [];

      // Add all achievements from this admin
      achievements.forEach((achievement: Achievement) => {
        allAchievements.push(achievement);
      });
    });

    return NextResponse.json(allAchievements);
  } catch (error: any) {
    console.error('Get achievements error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const achievementData = JSON.parse(formData.get('achievement') as string);
    const adminId = achievementData.userId; // Admin ID from the form

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    // Generate unique achievement ID
    const achievementId = `achievement_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create achievement object (exclude undefined dateAchieved)
    const newAchievement: any = {
      id: achievementId,
      userId: adminId,
      title: achievementData.title,
      description: achievementData.description,
      icon: achievementData.icon,
      trigger: achievementData.trigger,
      triggerValue: achievementData.triggerValue,
    };

    // Only add dateAchieved if it exists
    if (achievementData.dateAchieved) {
      newAchievement.dateAchieved = achievementData.dateAchieved;
    }

    // Reference to admin's achievement document
    const adminAchievementDocRef = adminDb.collection('adminAchievements').doc(adminId);
    const adminAchievementDoc = await adminAchievementDocRef.get();

    if (adminAchievementDoc.exists) {
      // Admin document exists, append to achievements array
      await adminAchievementDocRef.update({
        achievements: admin.firestore.FieldValue.arrayUnion(newAchievement),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Create new admin document with achievements array
      await adminAchievementDocRef.set({
        adminId,
        achievements: [newAchievement],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json(newAchievement);
  } catch (error: any) {
    console.error('Create achievement error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create achievement' },
      { status: 500 }
    );
  }
}