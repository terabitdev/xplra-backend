// pages/api/user.ts

import { IDatabaseService } from '@/lib/domain/services/IDatabaseService';
import { ISessionService } from '@/lib/domain/services/ISessionService';
import { FirebaseDatabaseService } from '@/lib/infrastructure/services/FirebaseDatabaseService';
import { FirebaseSessionService } from '@/lib/infrastructure/services/FirebaseSessionService';
import type { NextApiRequest, NextApiResponse } from 'next';

// Dependency Injection (can be replaced in the future)
const databaseService: IDatabaseService = new FirebaseDatabaseService();
const sessionService: ISessionService = new FirebaseSessionService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const token = req.headers.authorization?.split('Bearer ')[1]; // Extract the token from Authorization header

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        try {
            // Validate the session
            const decodedToken = await sessionService.validateSession(token);

            // Access Firestore using the user ID from the decoded token
            const userData = await databaseService.getUserData(decodedToken.uid);

            return res.status(200).json({ user: userData });
        } catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            return res.status(401).json({ error: errorMessage });
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}
