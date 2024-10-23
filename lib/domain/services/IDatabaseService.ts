export interface IDatabaseService {
    getUserData(userId: string): Promise<any>;
}
