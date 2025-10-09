'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { Achievement } from '@/lib/domain/models/achievement';

export default function AchivementsPage() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const router = useRouter();

    // Fetch adventures when the page loads
    useEffect(() => {
        const fetchAchievements = async () => {
            const res = await fetch('/api/achievements');
            const data = await res.json();
            setAchievements(data);
        };

        fetchAchievements();
    }, []);

    // Handle delete adventure
    const handleDeleteAdventure = async (id: string) => {
        const res = await fetch(`/api/achivements/delete/${id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            setAchievements(achievements.filter((achievement) => achievement.id !== id));
        }
    };

    // Redirect to create/update page
    const handleEditAchievement = (id: string) => {
        console.log(id);
        router.push(`/achievements/${id}`);
    };

    const handleCreateAchievements = () => {
        router.push('/achievements/create');
    };

    return (
        <DashboardLayout>
            <div className="w-full">
                <h1 className="text-4xl font-bold">Achievements</h1>

                <button className="bg-bootstrap-primary hover:bg-bootstrap-primary-hover text-white font-medium py-2 px-4 rounded mb-4 mt-4" onClick={handleCreateAchievements}>
                    Create New Achievement
                </button>

                <div className="max-h-[calc(100vh-150px)] overflow-y-auto border border-bootstrap-border rounded pb-5">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Id</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {achievements.map((achievement) => (
                                <tr key={achievement.id + achievement.title} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{achievement.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{achievement.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{achievement.icon}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{achievement.trigger}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{achievement.triggerValue}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                                        <button
                                            className="bg-bootstrap-secondary hover:bg-bootstrap-secondary-hover text-white text-sm py-1 px-3 rounded mx-2"
                                            onClick={() => handleEditAchievement(achievement.id)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="bg-bootstrap-danger hover:bg-bootstrap-danger-hover text-white text-sm py-1 px-3 rounded"
                                            onClick={() => handleDeleteAdventure(achievement.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
