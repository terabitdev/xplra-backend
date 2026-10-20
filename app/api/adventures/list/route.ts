import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Adventure } from '@/lib/domain/models/adventures';
import { verifyAdminRequest } from '@/lib/utils/requireAdmin';

export async function GET(req: Request) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Get all admin adventure documents
    const adminAdventuresSnapshot = await adminDb.collection('adminAdventures').get();

    const allAdventures: Adventure[] = [];

    // Iterate through each admin document and collect all adventures
    adminAdventuresSnapshot.forEach((doc) => {
      const data = doc.data();
      const adventures = data.adventures || [];

      // Add all adventures from this admin
      adventures.forEach((adventure: Adventure) => {
        allAdventures.push(adventure);
      });
    });

    return NextResponse.json(allAdventures);
  } catch (error: any) {
    console.error('Get adventures error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch adventures' },
      { status: 500 }
    );
  }
}
