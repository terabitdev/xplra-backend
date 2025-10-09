'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/SideBar';
import { Category } from '@/lib/domain/models/category';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const router = useRouter();

    // Fetch adventures when the page loads
    useEffect(() => {
        const fetchCategories = async () => {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data);
        };

        fetchCategories();
    }, []);

    // Handle delete adventure
    const handleDeleteCategories = async (id: string) => {
        const res = await fetch(`/api/categories/delete/${id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            setCategories(categories.filter((category) => category.id !== id));
        }
    };

    // Redirect to create/update page
    const handleEditCategory = (id: string) => {
        console.log(id);
        router.push(`/categories/${id}`);
    };

    const handleCreateCategory = () => {
        router.push('/categories/create');
    };

    return (
        <div className="flex">
            <Sidebar />
            <div className="main-content p-8 min-h-screen box-border overflow-y-auto w-full">
                <div className="max-w-7xl mx-auto">
                    <h1 className="mt-12 text-4xl font-bold">Category</h1>

                    <button className="bg-bootstrap-primary hover:bg-bootstrap-primary-hover text-white font-medium py-2 px-4 rounded mb-4 mt-4" onClick={handleCreateCategory}>
                        Create New Category
                    </button>

                    <div className="max-h-[calc(100vh-150px)] overflow-y-auto border border-bootstrap-border rounded pb-5">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap align-middle">{category.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                                            <img src={category.imageUrl} alt={category.name} width={100} height={100} className="max-w-[80px] h-auto rounded" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                                            <button
                                                className="bg-bootstrap-secondary hover:bg-bootstrap-secondary-hover text-white text-sm py-1 px-3 rounded mx-2"
                                                onClick={() => handleEditCategory(category.id)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="bg-bootstrap-danger hover:bg-bootstrap-danger-hover text-white text-sm py-1 px-3 rounded"
                                                onClick={() => handleDeleteCategories(category.id)}
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
        </div>
    );
}
