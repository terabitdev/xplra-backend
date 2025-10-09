'use client';

import { useEffect, useState } from 'react';
import { Adventure } from '@/lib/domain/models/adventures';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/SideBar';
import Image from 'next/image';
import { Category } from '@/lib/domain/models/category';

export default function AdventuresPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [adventures, setAdventures] = useState<Adventure[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchCategories = async () => {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data);
        };

        fetchCategories();
    }, []);

    // Fetch adventures when the page loads
    useEffect(() => {
        const fetchAdventures = async () => {
            const res = await fetch('/api/adventures');
            const data = await res.json();
            setAdventures(data);
        };

        fetchAdventures();
    }, []);

    // Handle delete adventure
    const handleDeleteAdventure = async (id: string) => {
        const res = await fetch(`/api/adventures/${id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            setAdventures(adventures.filter((adventure) => adventure.id !== id));
        }
    };

    // Redirect to create/update page
    const handleEditAdventure = (id: string) => {
        console.log(id);
        router.push(`/adventures/${id}`);
    };

    const handleCreateAdventure = () => {
        router.push('/adventures/create');
    };

    return (
        <div className="flex">
            <Sidebar />
            <div className="main-content p-8 min-h-screen box-border overflow-y-auto">
                <h1 className="mt-12 text-4xl font-bold">Adventures</h1>

                <button className="bg-bootstrap-primary hover:bg-bootstrap-primary-hover text-white font-medium py-2 px-4 rounded mb-4 mt-4" onClick={handleCreateAdventure}>
                    Create New Adventure
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In Seconds</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {adventures.map((adventure) => (
                                <tr key={adventure.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{adventure.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{adventure.shortDescription}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{
                                        categories?.find((category: Category) => category.id === adventure.category)?.name || '-'
                                    }</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{adventure.experience}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{adventure.latitude as number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{adventure.longitude as number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                                        <Image src={adventure.imageUrl} alt={adventure.title} width={80} height={80} className="max-w-[80px] h-auto rounded" />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{adventure.featured ? 'Yes' : 'No'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">{adventure.timeInSeconds}</td>
                                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                                        <button
                                            className="bg-bootstrap-secondary hover:bg-bootstrap-secondary-hover text-white text-sm py-1 px-3 rounded mx-2"
                                            onClick={() => handleEditAdventure(adventure.id)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="bg-bootstrap-danger hover:bg-bootstrap-danger-hover text-white text-sm py-1 px-3 rounded"
                                            onClick={() => handleDeleteAdventure(adventure.id)}
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
