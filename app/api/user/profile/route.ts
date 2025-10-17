import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify the token
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;

        // Get form data
        const formData = await req.formData();
        const displayName = formData.get('displayName') as string;
        const photo = formData.get('photo') as File | null;

        let photoURL = null;

        // Upload photo to Firebase Storage if provided
        if (photo) {
            const buffer = Buffer.from(await photo.arrayBuffer());
            const bucket = getStorage().bucket();
            const fileName = `users/${uid}/profile_${Date.now()}.${photo.type.split('/')[1]}`;
            const file = bucket.file(fileName);

            await file.save(buffer, {
                metadata: {
                    contentType: photo.type,
                },
                public: true,
            });

            photoURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        }

        // Update user in Firestore users collection
        const userRef = adminDb.collection('users').doc(uid);
        const userDoc = await userRef.get();

        const updateData: any = {
            updatedAt: new Date().toISOString(),
        };

        if (displayName) {
            updateData.displayName = displayName;
        }

        if (photoURL) {
            updateData.photoURL = photoURL;
        }

        // If user doesn't exist, create with default type
        if (!userDoc.exists) {
            await userRef.set({
                uid,
                email: decodedToken.email,
                displayName: displayName || decodedToken.email?.split('@')[0] || 'User',
                photoURL: photoURL || null,
                type: 'Admin', // Default type
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        } else {
            await userRef.update(updateData);
        }

        // Get updated user data
        const updatedUserDoc = await userRef.get();
        const userData = updatedUserDoc.data();

        return NextResponse.json({
            displayName: userData?.displayName,
            photoURL: userData?.photoURL,
            email: userData?.email,
            type: userData?.type,
        });
    } catch (error: any) {
        console.error('Profile update error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update profile' },
            { status: 400 }
        );
    }
}

// GET endpoint to fetch user profile
export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const userRef = adminDb.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            // Create user document if it doesn't exist
            await userRef.set({
                uid,
                email: decodedToken.email,
                displayName: decodedToken.email?.split('@')[0] || 'User',
                photoURL: null,
                type: 'Admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            return NextResponse.json({
                uid,
                email: decodedToken.email,
                displayName: decodedToken.email?.split('@')[0] || 'User',
                photoURL: null,
                type: 'Admin',
            });
        }

        const userData = userDoc.data();
        return NextResponse.json({
            uid: userData?.uid,
            email: userData?.email,
            displayName: userData?.displayName,
            photoURL: userData?.photoURL,
            type: userData?.type,
        });
    } catch (error: any) {
        console.error('Profile fetch error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch profile' },
            { status: 400 }
        );
    }
}
