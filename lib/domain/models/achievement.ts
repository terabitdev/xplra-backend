export interface Achievement {
    id: string;
    userId?: string;
    title: string;
    description: string;
    icon: string;
    dateAchieved: Date;
    trigger: 'experience' | 'level' | 'achievement' | 'quest';
    triggerValue: string;
}
