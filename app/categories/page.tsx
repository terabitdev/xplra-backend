'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/SideBar';
import Image from 'next/image';
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
        <div className="d-flex">
            <Sidebar />
            <div className="container-fluid">
                <h1 className="mt-5">Category</h1>

                <button className="btn btn-primary mb-4" onClick={handleCreateCategory}>
                    Create New Category
                </button>

                <div className="table-wrapper">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Image</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((category) => (
                                <tr key={category.id}>
                                    <td>{category.name}</td>
                                    <td>
                                        <img src={category.imageUrl} alt={category.name} width={100} height={100} />
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-secondary btn-sm mx-2"
                                            onClick={() => handleEditCategory(category.id)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
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
    );
}
