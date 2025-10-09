'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/SideBar';
import { Quest } from '@/lib/domain/models/quest';
import { Category } from '@/lib/domain/models/category';

export default function QuestsPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [quests, setQuests] = useState<Quest[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchCategories = async () => {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data);
        };

        fetchCategories();
    }, []);

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
        <div className="flex">
            <Sidebar />
            <div className="main-content p-8 min-h-screen box-border overflow-y-auto">
                <h1 className="mt-12 text-4xl font-bold">Quests</h1>

                <button className="bg-bootstrap-primary hover:bg-bootstrap-primary-hover text-white font-medium py-2 px-4 rounded mb-4 mt-4" onClick={handleCreateQuest}>
                    Create New Quest
                </button>

                <div className="max-h-[calc(100vh-150px)] overflow-y-auto border border-bootstrap-border rounded pb-5">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Short Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latitude</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Longitude</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Step Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {quests.map((quest) => (
                                <tr key={quest.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{quest.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{quest.shortDescription}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{
                                        categories?.find((category: Category) => category.id === quest.category)?.name || '-'
                                    }</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{quest.experience}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{quest.stepLatitude as number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{quest.stepLongitude as number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                                        <img src={quest.imageUrl} alt={quest.title} width="80" className="max-w-[80px] h-auto rounded" />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{quest.stepType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                                        <button
                                            className="bg-bootstrap-secondary hover:bg-bootstrap-secondary-hover text-white text-sm py-1 px-3 rounded mx-2"
                                            onClick={() => handleEditQuest(quest.id)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="bg-bootstrap-danger hover:bg-bootstrap-danger-hover text-white text-sm py-1 px-3 rounded"
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
