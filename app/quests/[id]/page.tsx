'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Quest } from '@/lib/domain/models/quest';
import { ChevronLeft } from '@carbon/icons-react';
import Image from 'next/image';
import { Category } from '@/lib/domain/models/category';

export default function QuestFormPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [quest, setQuest] = useState<Partial<Quest>>({
        title: '',
        shortDescription: '',
        longDescription: '',
        experience: 0,
        imageUrl: '',
        stepCode: '',
        stepLatitude: 0,
        stepLongitude: 0,
        stepType: 'qr',
        timeInSeconds: 0,
        userId: null,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const router = useRouter();
    const { id } = useParams();


    useEffect(() => {
        const fetchCategories = async () => {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data);
        };
        fetchCategories();
    }, []);
    useEffect(() => {
        if (id !== 'create') {
            setDataLoading(true);
            const fetchQuest = async () => {
                const res = await fetch(`/api/quests/${id}`);
                const data = await res.json();
                setQuest(data);
                setImagePreview(data.imageUrl);
                setDataLoading(false);
            };
            fetchQuest();
        }
    }, [id]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImageLoading(true);
        const file = e.target.files ? e.target.files[0] : null;
        setImageFile(file);

        if (file) {
            const fileReader = new FileReader();
            fileReader.onload = () => {
                setImagePreview(fileReader.result as string);
            };
            fileReader.readAsDataURL(file);
        }
        setImageLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('quest', JSON.stringify(quest));
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const url = id === 'create' ? '/api/quests/create' : `/api/quests/${id}`;
            const method = id === 'create' ? 'POST' : 'PATCH';

            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (res.ok) {
                router.push('/quests');
            } else {
                // Handle errors here if needed
            }
        } finally {
            setLoading(false);
        }
    };

    if (dataLoading) {
        // Show a centered loader when data is being fetched
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container border rounded-lg shadow-lg mx-auto p-5 mt-8 mb-4 max-w-4xl">
            <h1 className="flex items-center text-3xl font-bold mb-6">
                <ChevronLeft
                    onClick={() => router.push('/quests')}
                    width={32}
                    height={32}
                    className="cursor-pointer hover:text-gray-600"
                />
                {id === 'create' ? 'Create Quest' : 'Edit Quest'}
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-2">Title</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="title"
                        value={quest.title}
                        onChange={(e) => setQuest({ ...quest, title: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="shortDescription" className="block text-sm font-medium mb-2">Short Description</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="shortDescription"
                        value={quest.shortDescription}
                        onChange={(e) =>
                            setQuest({ ...quest, shortDescription: e.target.value })
                        }
                        required
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="longDescription" className="block text-sm font-medium mb-2">Long Description</label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="longDescription"
                        rows={3}
                        value={quest.longDescription}
                        onChange={(e) =>
                            setQuest({ ...quest, longDescription: e.target.value })
                        }
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="categories" className="block text-sm font-medium mb-2">Category</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="categories"
                        value={quest.category || ''}
                        onChange={(e) => setQuest({ ...quest, category: e.target.value })}
                        disabled={loading}
                        required
                    >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="experience" className="block text-sm font-medium mb-2">Experience</label>
                    <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="experience"
                        value={quest.experience}
                        onChange={(e) =>
                            setQuest({ ...quest, experience: parseInt(e.target.value) })
                        }
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="hoursToCompleteAgain" className="block text-sm font-medium mb-2">Hours to complete again</label>
                    <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="hoursToCompleteAgain"
                        value={quest.hoursToCompleteAgain}
                        onChange={(e) =>
                            setQuest({ ...quest, hoursToCompleteAgain: parseInt(e.target.value) })
                        }
                        required
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="stepCode" className="block text-sm font-medium mb-2">Step Code</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="stepCode"
                        value={quest.stepCode}
                        onChange={(e) => setQuest({ ...quest, stepCode: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="stepLatitude" className="block text-sm font-medium mb-2">Step Latitude</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="stepLatitude"
                        value={quest.stepLatitude as number}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^-?\d*\.?\d*$/.test(value) || value === '-') {
                                setQuest({ ...quest, stepLatitude: value });
                            }
                        }}
                        onBlur={() => {
                            if (
                                quest.stepLatitude === '-' ||
                                quest.stepLatitude === '' ||
                                isNaN(Number(quest.stepLatitude))
                            ) {
                                setQuest({ ...quest, stepLatitude: 0 });
                            } else {
                                setQuest({
                                    ...quest,
                                    stepLatitude: parseFloat(quest.stepLatitude as string),
                                });
                            }
                        }}
                        required
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="stepLongitude" className="block text-sm font-medium mb-2">Step Longitude</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="stepLongitude"
                        value={quest.stepLongitude as number}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^-?\d*\.?\d*$/.test(value) || value === '-') {
                                setQuest({ ...quest, stepLongitude: value });
                            }
                        }}
                        onBlur={() => {
                            if (
                                quest.stepLongitude === '-' ||
                                quest.stepLongitude === '' ||
                                isNaN(Number(quest.stepLongitude))
                            ) {
                                setQuest({ ...quest, stepLongitude: 0 });
                            } else {
                                setQuest({
                                    ...quest,
                                    stepLongitude: parseFloat(quest.stepLongitude as string),
                                });
                            }
                        }}
                        required
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="distance" className="block text-sm font-medium mb-2">Distance</label>
                    <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="distance"
                        value={(quest.distance || 0) as number}
                        onChange={(e) => setQuest({ ...quest, distance: parseInt(e.target.value) })}
                        required
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="stepType" className="block text-sm font-medium mb-2">Step Type</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="stepType"
                        value={quest.stepType}
                        onChange={(e) => setQuest({ ...quest, stepType: e.target.value })}
                        disabled={loading}
                    >
                        <option value="qr">QR</option>
                        <option value="location">Location</option>
                        <option value="timeLocation">Time & Location</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="timeInSeconds" className="block text-sm font-medium mb-2">Time In Seconds</label>
                    <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="timeInSeconds"
                        value={quest.timeInSeconds}
                        onChange={(e) => setQuest({ ...quest, timeInSeconds: parseInt(e.target.value) })}
                        required
                        disabled={loading}
                    />
                </div>
                <div>
                    {imagePreview && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Current Image Preview:</label>
                            <div>
                                <Image
                                    src={imagePreview}
                                    alt="Quest Image Preview"
                                    width={200}
                                    height={200}
                                    className="object-cover rounded-md"
                                />
                            </div>
                        </div>
                    )}
                    <label htmlFor="image" className="block text-sm font-medium mb-2">Upload New Image</label>
                    <input
                        type="file"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={loading || imageLoading}
                    />
                </div>
                {loading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
                        {id === 'create' ? 'Create Quest' : 'Update Quest'}
                    </button>
                )}
            </form>
        </div>
    );
}
