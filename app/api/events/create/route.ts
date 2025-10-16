import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Event } from '@/lib/domain/models/event';
import admin from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const eventData = await req.json();
    const adminId = eventData.userId; // Admin ID from the form

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    // Generate unique event ID
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create event object
    const newEvent: Event = {
      id: eventId,
      title: eventData.title,
      date: eventData.date,
      latitude: eventData.latitude,
      longitude: eventData.longitude,
      experience: eventData.experience,
      isVisible: eventData.isVisible ?? true,
      userId: adminId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Reference to admin's event document
    const adminEventDocRef = adminDb.collection('adminEvents').doc(adminId);
    const adminEventDoc = await adminEventDocRef.get();

    if (adminEventDoc.exists) {
      // Admin document exists, append to events array
      await adminEventDocRef.update({
        events: admin.firestore.FieldValue.arrayUnion(newEvent),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Create new admin document with events array
      await adminEventDocRef.set({
        adminId,
        events: [newEvent],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json(newEvent);
  } catch (error: any) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}
