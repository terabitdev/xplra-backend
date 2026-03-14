import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { ValidationConfig } from '@/lib/domain/models/validationConfig';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const configId = params.id;
    const doc = await adminDb.collection('validationConfigs').doc(configId).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Validation config not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    const config: ValidationConfig = {
      ...data,
      id: doc.id,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt || '',
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt || '',
    } as ValidationConfig;

    return NextResponse.json(config);
  } catch (error: unknown) {
    console.error('Get validation config error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch validation config';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const configId = params.id;
    const body = await req.json();

    const docRef = adminDb.collection('validationConfigs').doc(configId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Validation config not found' },
        { status: 404 }
      );
    }

    // Validate timeToValidateSec range if provided
    if (body.timeToValidateSec !== undefined && (body.timeToValidateSec < 5 || body.timeToValidateSec > 20)) {
      return NextResponse.json(
        { error: 'timeToValidateSec must be between 5 and 20 seconds' },
        { status: 400 }
      );
    }

    // Validate checkInRequiredPings >= minAcceptedSamplesToLock
    const checkPings = body.checkInRequiredPings ?? doc.data()?.checkInRequiredPings;
    const minSamples = body.minAcceptedSamplesToLock ?? doc.data()?.minAcceptedSamplesToLock;
    if (checkPings < minSamples) {
      return NextResponse.json(
        { error: 'checkInRequiredPings must be >= minAcceptedSamplesToLock' },
        { status: 400 }
      );
    }

    // Check how many places use this config
    const placesSnapshot = await adminDb.collection('places')
      .where('validationConfigId', '==', configId)
      .get();
    const usageCount = placesSnapshot.size;

    const updateData = {
      ...body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    // Don't allow changing the id
    delete updateData.id;
    delete updateData.createdAt;

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();
    const config: ValidationConfig = {
      ...updatedData,
      id: updatedDoc.id,
      createdAt: updatedData?.createdAt?.toDate?.()?.toISOString() || '',
      updatedAt: updatedData?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as ValidationConfig;

    return NextResponse.json({
      config,
      usageCount,
    });
  } catch (error: unknown) {
    console.error('Update validation config error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update validation config';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const configId = params.id;

    const docRef = adminDb.collection('validationConfigs').doc(configId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Validation config not found' },
        { status: 404 }
      );
    }

    // Check if any places reference this config
    const placesSnapshot = await adminDb.collection('places')
      .where('validationConfigId', '==', configId)
      .get();

    if (!placesSnapshot.empty) {
      const placeNames = placesSnapshot.docs.map(d => d.data().name || d.id);
      return NextResponse.json(
        {
          error: `Cannot delete: this config is used by ${placesSnapshot.size} place(s)`,
          referencedPlaces: placeNames,
        },
        { status: 409 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      message: 'Validation config deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Delete validation config error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete validation config';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
