// app/api/signup/route.ts

import { NextResponse } from 'next/server';
import { FirebaseAuthService } from '../../../lib/infrastructure/services/FirebaseAuthService';
import { IAuthService } from '../../../lib/domain/services/IAuthService';

const authService: IAuthService = new FirebaseAuthService();

export async function POST(req: Request) {
    const { email, password } = await req.json();

    try {
        const user = await authService.signUp(email, password);
        return NextResponse.json({ user });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
