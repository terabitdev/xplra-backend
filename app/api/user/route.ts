// pages/api/user.ts

import { IDatabaseService } from '@/lib/domain/services/IDatabaseService';
import { ISessionService } from '@/lib/domain/services/ISessionService';
import { FirebaseDatabaseService } from '@/lib/infrastructure/services/FirebaseDatabaseService';
import { FirebaseSessionService } from '@/lib/infrastructure/services/FirebaseSessionService';
import { NextResponse } from 'next/server';

// Dependency Injection (can be replaced in the future)
const databaseService: IDatabaseService = new FirebaseDatabaseService();
const sessionService: ISessionService = new FirebaseSessionService();

export async function GET(req: Request) {
    const token = req.headers.get('authorization')?.split('Bearer ')[1]; // Extract the token from Authorization header

    if (!token) {
        return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    try {
        // Validate the session
        const decodedToken = await sessionService.validateSession(token);

        // Access Firestore using the user ID from the decoded token
        const userData = await databaseService.getUserData(decodedToken.uid);

        return NextResponse.json({ user: userData }, { status: 200 });
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 401 });
    }
}
