'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuestFormPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to quests page since we now use modal for quest forms
        router.push('/quests');
    }, [router]);

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );
}
