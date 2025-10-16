import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Event } from '@/lib/domain/models/event';
import admin from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const eventData = JSON.parse(formData.get('event') as string);
    const imageFile = formData.get('image') as File | null;
    const adminId = eventData.userId; // Admin ID from the form

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    let imageUrl = '';

    // Upload image if provided
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const fileName = `events/${Date.now()}_${imageFile.name}`;
      const file = adminStorage.bucket().file(fileName);

      await file.save(buffer, {
        metadata: { contentType: imageFile.type },
      });

      await file.makePublic();
      imageUrl = `https://storage.googleapis.com/${adminStorage.bucket().name}/${fileName}`;
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
      imageUrl,
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
