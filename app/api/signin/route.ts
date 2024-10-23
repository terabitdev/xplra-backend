import { NextResponse } from 'next/server';
import { FirebaseAuthService } from '../../../lib/infrastructure/services/FirebaseAuthService';
import { IAuthService } from '../../../lib/domain/services/IAuthService';

const authService: IAuthService = new FirebaseAuthService();

export async function POST(req: Request) {
  const { email, password } = await req.json();

  try {
    const token = await authService.signIn(email, password); // Get the token from FirebaseAuthService
    return NextResponse.json({ token }); // Return the token in the response
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
