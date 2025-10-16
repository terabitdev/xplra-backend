import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Event } from '@/lib/domain/models/event';
import admin from '@/lib/firebase-admin';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;

    // Search through all adminEvents documents to find the event
    const adminEventsSnapshot = await adminDb.collection('adminEvents').get();

    for (const doc of adminEventsSnapshot.docs) {
      const data = doc.data();
      const events = data.events || [];
      const event = events.find((e: Event) => e.id === eventId);

      if (event) {
        return NextResponse.json(event);
      }
    }

    return NextResponse.json(
      { error: 'Event not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const eventData = JSON.parse(formData.get('event') as string);
    const imageFile = formData.get('image') as File | null;
    const eventId = params.id;
    const adminId = eventData.userId;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    let imageUrl = eventData.imageUrl || '';

    // Upload new image if provided
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

    // Get admin's event document
    const adminEventDocRef = adminDb.collection('adminEvents').doc(adminId);
    const adminEventDoc = await adminEventDocRef.get();

    if (!adminEventDoc.exists) {
      return NextResponse.json(
        { error: 'Admin event document not found' },
        { status: 404 }
      );
    }

    const data = adminEventDoc.data();
    const events = data?.events || [];

    // Find and update the event in the array
    const eventIndex = events.findIndex((e: Event) => e.id === eventId);

    if (eventIndex === -1) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Update the event
    events[eventIndex] = {
      ...events[eventIndex],
      title: eventData.title,
      date: eventData.date,
      latitude: eventData.latitude,
      longitude: eventData.longitude,
      experience: eventData.experience,
      imageUrl,
      isVisible: eventData.isVisible ?? events[eventIndex].isVisible,
      updatedAt: new Date().toISOString(),
    };

    // Update the document
    await adminEventDocRef.update({
      events,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      message: 'Event updated successfully',
      event: events[eventIndex],
    });
  } catch (error: any) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;

    // Find the admin document containing this event
    const adminEventsSnapshot = await adminDb.collection('adminEvents').get();

    for (const doc of adminEventsSnapshot.docs) {
      const data = doc.data();
      const events = data.events || [];
      const eventToDelete = events.find((e: Event) => e.id === eventId);

      if (eventToDelete) {
        // Remove the event from the array
        await doc.ref.update({
          events: admin.firestore.FieldValue.arrayRemove(eventToDelete),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
          message: 'Event deleted successfully',
        });
      }
    }

    return NextResponse.json(
      { error: 'Event not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete event' },
      { status: 500 }
    );
  }
}
