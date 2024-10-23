// app/api/forgot-password/route.ts

import { NextResponse } from 'next/server';
import { FirebaseAuthService } from '../../../lib/infrastructure/services/FirebaseAuthService';
import { IAuthService } from '../../../lib/domain/services/IAuthService';

const authService: IAuthService = new FirebaseAuthService();

export async function POST(req: Request) {
    const { email } = await req.json();

    try {
        await authService.forgotPassword(email);
        return NextResponse.json({ message: 'Password reset link sent.' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
