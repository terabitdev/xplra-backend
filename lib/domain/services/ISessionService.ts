export interface ISessionService {
    validateSession(token: string): Promise<any>;
}
