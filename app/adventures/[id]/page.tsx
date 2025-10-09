'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Adventure } from '@/lib/domain/models/adventures';
import { ChevronLeft } from '@carbon/icons-react';
import Image from 'next/image';
import { Category } from '@/lib/domain/models/category';

export default function AdventureFormPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [adventure, setAdventure] = useState<Adventure>({
        id: '',
        title: '',
        shortDescription: '',
        longDescription: '',
        imageUrl: '',
        latitude: 0,
        longitude: 0,
        distance: 0,
        experience: 0,
        featured: false,
        adventureId: '',
        userId: '',
        featuredImages: [],
        timeInSeconds: 0,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [multiImageFiles, setMultiImageFiles] = useState<File[]>([]);
    const [multiImagePreviews, setMultiImagePreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false); // For form submission
    const [dataLoading, setDataLoading] = useState(false); // For data fetching
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
            const fetchAdventure = async () => {
                const res = await fetch(`/api/adventures/${id}`);
                const data = await res.json();
                setAdventure(data);
                setImagePreview(data.imageUrl);
                setMultiImagePreviews(data.featuredImages || []);
                setDataLoading(false);
            };
            fetchAdventure();
        }
    }, [id]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (adventure.featured) {
            const files = e.target.files ? Array.from(e.target.files) : [];
            setMultiImageFiles(prevFiles => [...prevFiles, ...files]);

            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = () => {
                    setMultiImagePreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        } else {
            const file = e.target.files ? e.target.files[0] : null;
            setImageFile(file);
            if (file) {
                const fileReader = new FileReader();
                fileReader.onload = () => setImagePreview(fileReader.result as string);
                fileReader.readAsDataURL(file);
            }
        }
    };

    const handleRemoveImage = (index: number) => {
        setMultiImageFiles(prev => prev.filter((_, i) => i !== index));
        setMultiImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();

        formData.append('adventure', JSON.stringify(adventure));

        if (adventure.featured) {
            multiImageFiles.forEach((file) => {
                formData.append('featuredImages', file);
            });
        } else if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const url = id === 'create' ? '/api/adventures' : `/api/adventures/${id}`;
            const method = id === 'create' ? 'POST' : 'PATCH';

            const response = await fetch(url, {
                method,
                body: formData,
            });

            if (response.ok) {
                router.push('/adventures');
            } else {
                throw new Error('Failed to save adventure');
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    if (dataLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container border rounded-lg shadow-lg mx-auto p-5 mt-8 mb-8 max-w-4xl">
            <h1 className="flex items-center text-3xl font-bold mb-6">
                <ChevronLeft onClick={() => router.push('/adventures')} width={32} height={32} className="cursor-pointer hover:text-gray-600" />
                {id === 'create' ? 'Create Adventure' : 'Edit Adventure'}
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-2">Title</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="title"
                        value={adventure.title}
                        onChange={(e) => setAdventure({ ...adventure, title: e.target.value })}
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
                        value={adventure.shortDescription}
                        onChange={(e) => setAdventure({ ...adventure, shortDescription: e.target.value })}
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
                        value={adventure.longDescription}
                        onChange={(e) => setAdventure({ ...adventure, longDescription: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="categories" className="block text-sm font-medium mb-2">Category</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="categories"
                        value={adventure.category || ''}
                        onChange={(e) => setAdventure({ ...adventure, category: e.target.value })}
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
                    {adventure.featured ? (
                        <>
                            <label htmlFor="featuredImages" className="block text-sm font-medium mb-2">Upload Featured Images</label>
                            <input
                                type="file"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                id="featuredImages"
                                accept="image/*"
                                onChange={handleImageChange}
                                multiple
                                disabled={loading}
                            />
                            <div className="mt-4 flex flex-wrap gap-3">
                                {multiImagePreviews.map((preview, index) => (
                                    <div key={index} className="relative inline-block">
                                        <Image src={preview} alt={`Featured Image ${index + 1}`} width={100} height={100} className="object-cover rounded-md" />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                                            disabled={loading}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <label htmlFor="image" className="block text-sm font-medium mb-2">Upload Main Image</label>
                            <input
                                type="file"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                id="image"
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={loading}
                            />
                            {imagePreview && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium mb-2">Current Image Preview:</label>
                                    <div>
                                        <Image src={imagePreview} alt="Adventure Image Preview" width={200} height={200} className="object-cover rounded-md" />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div>
                    <label htmlFor="latitude" className="block text-sm font-medium mb-2">Latitude</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="latitude"
                        value={adventure.latitude as number}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^-?\d*\.?\d*$/.test(value) || value === '-') {
                                setAdventure({ ...adventure, latitude: value });
                            }
                        }}
                        onBlur={() => {
                            if (adventure.latitude === '-' || adventure.latitude === '' || isNaN(Number(adventure.latitude))) {
                                setAdventure({ ...adventure, latitude: 0 });
                            } else {
                                setAdventure({ ...adventure, latitude: parseFloat(adventure.latitude as string) });
                            }
                        }}
                        required
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="longitude" className="block text-sm font-medium mb-2">Longitude</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="longitude"
                        value={adventure.longitude as number}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^-?\d*\.?\d*$/.test(value) || value === '-') {
                                setAdventure({ ...adventure, longitude: value });
                            }
                        }}
                        onBlur={() => {
                            if (adventure.longitude === '-' || adventure.longitude === '' || isNaN(Number(adventure.longitude))) {
                                setAdventure({ ...adventure, longitude: 0 });
                            } else {
                                setAdventure({ ...adventure, longitude: parseFloat(adventure.longitude as string) });
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
                        value={(adventure.distance || 30) as number}
                        onChange={(e) => setAdventure({ ...adventure, distance: parseFloat(e.target.value) })}
                        required
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="experience" className="block text-sm font-medium mb-2">Experience</label>
                    <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="experience"
                        value={adventure.experience}
                        onChange={(e) => setAdventure({ ...adventure, experience: parseInt(e.target.value) })}
                        required
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="hoursToComplete" className="block text-sm font-medium mb-2">Hours to Complete</label>
                    <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="hoursToComplete"
                        value={adventure.hoursToCompleteAgain || 0}
                        onChange={(e) => setAdventure({ ...adventure, hoursToCompleteAgain: parseInt(e.target.value) })}
                        required
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="timeInSeconds" className="block text-sm font-medium mb-2">Time in Seconds</label>
                    <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        id="timeInSeconds"
                        value={adventure.timeInSeconds}
                        onChange={(e) => setAdventure({ ...adventure, timeInSeconds: parseInt(e.target.value) })}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        id="featured"
                        checked={adventure.featured}
                        onChange={(e) => setAdventure({ ...adventure, featured: e.target.checked })}
                        disabled={loading}
                    />
                    <label className="ml-2 text-sm font-medium" htmlFor="featured">Featured</label>
                </div>

                <div className="flex items-center gap-4">
                    {loading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    ) : (
                        <>
                            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
                                {id === 'create' ? 'Create Adventure' : 'Update Adventure'}
                            </button>
                            <button
                                type="button"
                                className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                                onClick={() => router.push('/adventures')}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </form >
        </div >
    );
}
