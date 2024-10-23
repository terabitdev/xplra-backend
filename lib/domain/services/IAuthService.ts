// lib/domain/services/IAuthService.ts

export interface IAuthService {
    signUp(email: string, password: string): Promise<void>;
    signIn(email: string, password: string): Promise<string>;
    forgotPassword(email: string): Promise<void>;
    signOut(): Promise<void>;
}
