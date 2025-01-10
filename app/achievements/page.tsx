'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/SideBar';
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
        <div className="d-flex">
            <Sidebar />
            <div className="container-fluid">
                <h1 className="mt-5">Achievements</h1>

                <button className="btn btn-primary mb-4" onClick={handleCreateAchievements}>
                    Create New Achievement
                </button>

                <div className="table-wrapper">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Id</th>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Icon</th>
                                <th>Trigger</th>
                                <th>Trigger Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {achievements.map((achievement) => (
                                <tr key={achievement.id + achievement.title}>
                                    <td>{achievement.title}</td>
                                    <td>{achievement.description}</td>
                                    <td>{achievement.icon}</td>
                                    <td>{achievement.trigger}</td>
                                    <td>{achievement.triggerValue}</td>
                                    <td>
                                        <button
                                            className="btn btn-secondary btn-sm mx-2"
                                            onClick={() => handleEditAchievement(achievement.id)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
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
        </div>
    );
}
