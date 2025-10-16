import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Event } from '@/lib/domain/models/event';

export async function GET() {
  try {
    // Get all admin event documents
    const adminEventsSnapshot = await adminDb.collection('adminEvents').get();

    const allEvents: Event[] = [];

    // Iterate through each admin document and collect all events
    adminEventsSnapshot.forEach((doc) => {
      const data = doc.data();
      const events = data.events || [];

      // Add all events from this admin
      events.forEach((event: Event) => {
        allEvents.push(event);
      });
    });

    return NextResponse.json(allEvents);
  } catch (error: any) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
