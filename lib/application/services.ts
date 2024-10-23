// lib/application/services.ts

import { IAuthService } from '../domain/services/IAuthService';
import { FirebaseAuthService } from '../infrastructure/services/FirebaseAuthService';

// This is where the dependency injection occurs
export const authService: IAuthService = new FirebaseAuthService();
