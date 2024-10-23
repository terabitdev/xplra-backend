import { ISessionService } from '@/lib/domain/services/ISessionService';
import { FirebaseSessionService } from '@/lib/infrastructure/services/FirebaseSessionService';
import { NextResponse } from 'next/server';

const sessionService: ISessionService = new FirebaseSessionService();

export async function POST(req: Request) {
    const { token } = await req.json();
    if (!token) {
        return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
    }

    try {
        const decodedToken = await sessionService.validateSession(token);
        console.log(decodedToken);
        return NextResponse.json({ decodedToken });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
}
