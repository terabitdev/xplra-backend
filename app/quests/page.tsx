'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/SideBar';
import { Quest } from '@/lib/domain/models/quest';

export default function QuestsPage() {
    const [quests, setQuests] = useState<Quest[]>([]);
    const router = useRouter();

    // Fetch quests when the page loads
    useEffect(() => {
        const fetchQuests = async () => {
            const res = await fetch('/api/quests/list');
            const data = await res.json();
            setQuests(data);
        };

        fetchQuests();
    }, []);

    // Handle delete quest
    const handleDeleteQuest = async (id: string) => {
        const res = await fetch(`/api/quests/${id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            setQuests(quests.filter((quest) => quest.id !== id));
        }
    };

    // Redirect to create/update page
    const handleEditQuest = (id: string) => {
        router.push(`/quests/${id}`);
    };

    const handleCreateQuest = () => {
        router.push('/quests/create');
    };

    return (
        <div className="d-flex">
            <Sidebar />
            <div className="container-fluid">
                <h1 className="mt-5">Quests</h1>

                <button className="btn btn-primary mb-4" onClick={handleCreateQuest}>
                    Create New Quest
                </button>

                <div className="table-wrapper">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Short Description</th>
                                <th>Experience</th>
                                <th>Latitude</th>
                                <th>Longitude</th>
                                <th>Image</th>
                                <th>Step Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quests.map((quest) => (
                                <tr key={quest.id}>
                                    <td>{quest.title}</td>
                                    <td>{quest.shortDescription}</td>
                                    <td>{quest.experience}</td>
                                    <td>{quest.stepLatitude}</td>
                                    <td>{quest.stepLongitude}</td>
                                    <td>
                                        <img src={quest.imageUrl} alt={quest.title} width="80" />
                                    </td>
                                    <td>{quest.stepType}</td>
                                    <td>
                                        <button
                                            className="btn btn-secondary btn-sm mx-2"
                                            onClick={() => handleEditQuest(quest.id)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDeleteQuest(quest.id)}
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
