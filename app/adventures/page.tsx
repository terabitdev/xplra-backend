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
        <div className="d-flex">
            <Sidebar />
            <div className="container-fluid">
                <h1 className="mt-5">Adventures</h1>

                <button className="btn btn-primary mb-4" onClick={handleCreateAdventure}>
                    Create New Adventure
                </button>

                <div className="table-wrapper">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Short Description</th>
                                <th>Category</th>
                                <th>Experience</th>
                                <th>Latitude</th>
                                <th>Longitude</th>
                                <th>Image</th>
                                <th>Featured</th>
                                <th>Time In Seconds</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adventures.map((adventure) => (
                                <tr key={adventure.id}>
                                    <td>{adventure.title}</td>
                                    <td>{adventure.shortDescription}</td>
                                    <td>{
                                        categories?.find((category: Category) => category.id === adventure.category)?.name || '-'
                                    }</td>
                                    <td>{adventure.experience}</td>
                                    <td>{adventure.latitude as number}</td>
                                    <td>{adventure.longitude as number}</td>
                                    <td>
                                        <Image src={adventure.imageUrl} alt={adventure.title} width={80} height={80} />
                                    </td>
                                    <td>{adventure.featured ? 'Yes' : 'No'}</td>
                                    <td>{adventure.timeInSeconds}</td>
                                    <td>
                                        <button
                                            className="btn btn-secondary btn-sm mx-2"
                                            onClick={() => handleEditAdventure(adventure.id)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
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
