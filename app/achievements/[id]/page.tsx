'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Achievement } from '@/lib/domain/models/achievement';
import { ChevronLeft } from '@carbon/icons-react';

export default function AchievementFormPage() {
    const [achievement, setAchievement] = useState<Partial<Achievement>>({
        id: '',
        title: '',
        description: '',
        icon: '',
        trigger: 'experience',
        triggerValue: '100',
        dateAchieved: undefined,
        userId: undefined,

    });
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const router = useRouter();
    const { id } = useParams();

    useEffect(() => {
        if (id !== 'create') {
            setDataLoading(true);
            const fetchAchievement = async () => {
                const res = await fetch(`/api/achievements/${id}`);
                const data = await res.json();
                setAchievement(data);
                setDataLoading(false);
            };
            fetchAchievement();
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('achievement', JSON.stringify(achievement));

            const url = id === 'create' ? '/api/achievements' : `/api/achievements/${id}`;
            const method = id === 'create' ? 'POST' : 'PATCH';

            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (res.ok) {
                router.push('/achievements');
            } else {
                // Handle errors here if needed
            }
        } finally {
            setLoading(false);
        }
    };

    if (dataLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-12">
            <h1 className="flex items-center text-4xl font-bold mb-6">
                <ChevronLeft
                    onClick={() => router.push('/achievements')}
                    width={32}
                    height={32}
                    className="cursor-pointer"
                />
                {id === 'create' ? 'Create Achievement' : 'Edit Achievement'}
            </h1>
            <form className='max-w-4xl mx-auto p-5 border rounded-lg shadow-lg' onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="title" className="block mb-2 text-sm font-medium">Title</label>
                    <input
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        id="title"
                        value={achievement.title}
                        onChange={(e) => setAchievement({ ...achievement, title: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="description" className="block mb-2 text-sm font-medium">Description</label>
                    <textarea
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        id="description"
                        value={achievement.description}
                        onChange={(e) => setAchievement({ ...achievement, description: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="icon" className="block mb-2 text-sm font-medium">Icon</label>
                    <input
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        id="icon"
                        value={achievement.icon}
                        onChange={(e) => setAchievement({ ...achievement, icon: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="trigger" className="block mb-2 text-sm font-medium">Trigger</label>
                    <select
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        id="trigger"
                        value={achievement.trigger}
                        onChange={(e) => setAchievement({ ...achievement, trigger: e.target.value as Achievement['trigger'] })}
                        required
                        disabled={loading}
                    >
                        <option value="experience">Experience</option>
                        <option value="level">Level</option>
                        <option value="achievement">Achievement</option>
                        <option value="quest">Quest</option>
                    </select>
                </div>
                <div className="mb-3">
                    <label htmlFor="triggerValue" className="block mb-2 text-sm font-medium">Trigger Value</label>
                    <input
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        id="triggerValue"
                        value={achievement.triggerValue}
                        onChange={(e) => setAchievement({ ...achievement, triggerValue: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>
                {loading ? (
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <button type="submit" className="bg-bootstrap-primary hover:bg-bootstrap-primary-hover text-white font-medium py-2 px-4 rounded">
                        {id === 'create' ? 'Create Achievement' : 'Update Achievement'}
                    </button>
                )}
            </form>
        </div>
    );
}
