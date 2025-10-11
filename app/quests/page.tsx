'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { Category } from '@/lib/domain/models/category';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchQuests, deleteQuest } from '../store/slices/questsSlice';
import QuestFormModal from '../components/modals/QuestFormModal';
import { Quest } from '@/lib/domain/models/quest';

export default function QuestsPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [adminId, setAdminId] = useState<string>('');
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Get quests from Redux store
    const { quests, loading, error } = useAppSelector((state) => state.quests);
    const { uid } = useAppSelector((state) => state.user);

    useEffect(() => {
        const fetchCategories = async () => {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data);
        };

        fetchCategories();
    }, []);

    // Set admin ID from user uid
    useEffect(() => {
        if (uid) {
            setAdminId(uid);
        }
    }, [uid]);

    // Fetch quests using Redux
    useEffect(() => {
        dispatch(fetchQuests());
    }, [dispatch]);

    // Handle delete quest using Redux
    const handleDeleteQuest = async (id: string) => {
        if (confirm('Are you sure you want to delete this quest?')) {
            await dispatch(deleteQuest(id));
        }
    };

    // Open edit modal
    const handleEditQuest = (quest: Quest) => {
        setSelectedQuest(quest);
        setIsModalOpen(true);
    };

    // Open create modal
    const handleCreateQuest = () => {
        setSelectedQuest(null);
        setIsModalOpen(true);
    };

    // Handle form submission
    const handleSubmitQuest = async (quest: Partial<Quest>, imageFile: File | null) => {
        try {
            const formData = new FormData();
            formData.append('quest', JSON.stringify(quest));
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const url = selectedQuest ? `/api/quests/${selectedQuest.id}` : '/api/quests/create';
            const method = selectedQuest ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (res.ok) {
                // Refresh quests list
                dispatch(fetchQuests());
                setIsModalOpen(false);
                setSelectedQuest(null);
            } else {
                const errorData = await res.json();
                alert(`Error: ${errorData.error || 'Failed to save quest'}`);
            }
        } catch (error) {
            console.error('Error submitting quest:', error);
            alert('An error occurred while saving the quest');
        }
    };

    return (
        <DashboardLayout>
            <div className="w-full mt-8">
                <h1 className="text-4xl font-bold">Quests</h1>

                <button
                    className="bg-bootstrap-primary hover:bg-bootstrap-primary-hover text-white font-medium py-2 px-4 rounded mb-4 mt-4"
                    onClick={handleCreateQuest}
                >
                    Create New Quest
                </button>

                {/* Loading State */}
                {loading && <p className="text-gray-600">Loading quests...</p>}

                {/* Error State */}
                {error && <p className="text-red-600">Error: {error}</p>}

                {/* Quests Table */}
                {!loading && !error && (
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
                                                onClick={() => handleEditQuest(quest)}
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
                )}
            </div>

            {/* Quest Form Modal */}
            <QuestFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedQuest(null);
                }}
                onSubmit={handleSubmitQuest}
                quest={selectedQuest}
                categories={categories}
                adminId={adminId}
            />
        </DashboardLayout>
    );
}
