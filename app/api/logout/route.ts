import { IAuthService } from '@/lib/domain/services/IAuthService';
import { FirebaseAuthService } from '@/lib/infrastructure/services/FirebaseAuthService';
import { NextResponse } from 'next/server';
const authService: IAuthService = new FirebaseAuthService();
export async function POST() {
    // Clear the token or session cookies here (if using cookies)
    const token = await authService.signOut();
    return NextResponse.json({ message: 'Logged out successfully' });
}
