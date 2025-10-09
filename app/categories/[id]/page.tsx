'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft } from '@carbon/icons-react';
import { Category } from '@/lib/domain/models/category';

export default function AchievementFormPage() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [category, setCategory] = useState<Partial<Category>>({
        id: '',
        name: '',
        imageUrl: '',
    });
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const router = useRouter();
    const { id } = useParams();

    useEffect(() => {
        if (id !== 'create') {
            setDataLoading(true);
            const fetchCategory = async () => {
                const res = await fetch(`/api/categories/${id}`);
                const data = await res.json();
                setCategory(data);
                setDataLoading(false);

            };
            fetchCategory();
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('category', JSON.stringify(category));

            if (imageFile) {
                formData.append('image', imageFile);
            }

            const url = id === 'create' ? '/api/categories' : `/api/categories/${id}`;
            const method = id === 'create' ? 'POST' : 'PATCH';

            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (res.ok) {
                router.push('/categories');
            } else {
                // Handle errors here if needed
            }
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        setImageFile(file);
    };

    if (dataLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 mt-8 max-w-4xl">
            <h1 className="flex items-center text-3xl font-bold mb-6">
                <ChevronLeft
                    onClick={() => router.push('/categories')}
                    width={32}
                    height={32}
                    className="cursor-pointer hover:text-gray-600"
                />
                {id === 'create' ? 'Create Category' : 'Edit Category'}
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-2">Title</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="title"
                        value={category.name}
                        onChange={(e) => setCategory({ ...category, name: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="image" className="block text-sm font-medium mb-2">Upload Main Image</label>
                    <input
                        type="file"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={loading}
                    />
                    {category.imageUrl && category.imageUrl.length > 0 && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-2">Current Image Preview:</label>
                            <div>
                                <img src={category.imageUrl} alt="Category Image" className="max-w-full rounded-md" />
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
                        {id === 'create' ? 'Create Category' : 'Update Category'}
                    </button>
                )}
            </form>
        </div>
    );
}
