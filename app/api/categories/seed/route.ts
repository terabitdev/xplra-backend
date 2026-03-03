import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { invalidateCategoriesCache } from '@/lib/cache/categoriesCache';

interface SeedCategory {
  name: string;
  interestName?: string;
  children?: SeedCategory[];
}

const CATEGORY_TREE: SeedCategory[] = [
  {
    name: 'Outdoors & Nature',
    children: [
      { name: 'Park' },
      { name: 'Beach' },
      { name: 'Trail' },
      { name: 'Scenic Views' },
      { name: 'Nature Reserve' },
      { name: 'Camping' },
      { name: 'River' },
      { name: 'Lake' },
      { name: 'Picnic' },
    ],
  },
  {
    name: 'Sports & Fitness',
    interestName: 'Sports & Fitness (Activities)',
    children: [
      { name: 'Running' },
      { name: 'Hiking' },
      { name: 'Walking' },
      { name: 'Soccer/Futbol' },
      { name: 'Basketball' },
      { name: 'Tennis' },
      { name: 'Pickleball' },
      { name: 'Skateboarding' },
      { name: 'Cycling' },
      { name: 'Physical Activities' },
      { name: 'Gym' },
      { name: 'Weightlifting' },
      { name: 'Racing' },
    ],
  },
  {
    name: 'Art & Culture',
    children: [
      { name: 'Street Art' },
      { name: 'Landmark' },
      { name: 'Art Markets' },
      { name: 'Fashion' },
    ],
  },
  {
    name: 'Entertainment',
    children: [
      { name: 'Live Music' },
      { name: 'Pop-up' },
      { name: 'Nightlife' },
      { name: 'Event Venue' },
      { name: 'Theater' },
      { name: 'Comedy' },
      { name: 'Poetry' },
    ],
  },
  {
    name: 'Other',
    children: [
      { name: 'Secret Spot' },
      { name: 'Family-Friendly' },
      { name: 'Spiritual Site' },
      { name: 'Public Transport' },
    ],
  },
  {
    name: 'Group Type',
    children: [
      { name: 'Solo' },
      { name: 'Couple' },
      { name: 'Friends' },
      { name: 'Family' },
      { name: 'Groups' },
    ],
  },
  {
    name: 'Cost Range',
    children: [
      { name: 'Free' },
      { name: 'Low' },
      { name: 'Medium' },
      { name: 'Premium' },
    ],
  },
  {
    name: 'Difficulty',
    children: [
      { name: 'Easy' },
      { name: 'Moderate' },
      { name: 'Hard' },
    ],
  },
  {
    name: 'Best Time to Visit',
    children: [
      { name: 'Morning' },
      { name: 'Afternoon' },
      { name: 'Evening' },
      { name: 'Night' },
    ],
  },
  {
    name: 'Vibe',
    interestName: 'Vibe Tag',
    children: [
      { name: 'Chill' },
      { name: 'Social' },
      { name: 'Adventurous' },
      { name: 'High-Energy' },
      { name: 'Romantic' },
      { name: 'Creative' },
      { name: 'Competitive' },
      { name: 'Scenic' },
    ],
  },
  // Partner / business categories (no children yet)
  { name: 'Food & Drink' },
  { name: 'Shopping & Local' },
  { name: 'Relax & Wellness' },
  { name: 'Accommodations' },
  { name: 'Coworking' },
];

function generateId() {
  return `cat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function DELETE() {
  try {
    const snapshot = await adminDb.collection('adminCategories').get();
    if (snapshot.empty) {
      return NextResponse.json({ message: 'No categories to delete' });
    }

    const batchSize = 500;
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = adminDb.batch();
      docs.slice(i, i + batchSize).forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    invalidateCategoriesCache();
    return NextResponse.json({ message: `Deleted ${docs.length} categories` });
  } catch (error: unknown) {
    console.error('Delete categories error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete categories';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Check if categories already exist
    const existing = await adminDb.collection('adminCategories').limit(1).get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: 'Categories already exist. Delete all categories first if you want to re-seed.' },
        { status: 400 }
      );
    }

    const batch = adminDb.batch();
    let totalCreated = 0;

    for (let pi = 0; pi < CATEGORY_TREE.length; pi++) {
      const parent = CATEGORY_TREE[pi];
      const parentId = generateId();

      // Small delay to ensure unique IDs
      await new Promise(r => setTimeout(r, 1));

      const parentDoc = {
        id: parentId,
        name: parent.name,
        icon: '',
        interestName: parent.interestName || parent.name,
        isActive: true,
        isVisibleInInterests: true,
        interestsOrder: (pi + 1) * 10,
        placeOrder: (pi + 1) * 10,
        level: 0,
        parentId: null,
        ancestorIds: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      batch.set(adminDb.collection('adminCategories').doc(parentId), parentDoc);
      totalCreated++;

      if (parent.children) {
        for (let ci = 0; ci < parent.children.length; ci++) {
          const child = parent.children[ci];
          const childId = generateId();

          await new Promise(r => setTimeout(r, 1));

          const childDoc = {
            id: childId,
            name: child.name,
            icon: '',
            interestName: child.interestName || child.name,
            isActive: true,
            isVisibleInInterests: true,
            interestsOrder: (ci + 1) * 10,
            placeOrder: (ci + 1) * 10,
            level: 1,
            parentId: parentId,
            ancestorIds: [parentId],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          batch.set(adminDb.collection('adminCategories').doc(childId), childDoc);
          totalCreated++;
        }
      }
    }

    await batch.commit();
    invalidateCategoriesCache();

    return NextResponse.json({
      message: `Successfully seeded ${totalCreated} categories`,
      count: totalCreated,
    });
  } catch (error: unknown) {
    console.error('Seed categories error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to seed categories';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
