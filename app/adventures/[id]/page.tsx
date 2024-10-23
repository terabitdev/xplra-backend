'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Adventure } from '@/lib/domain/models/adventures';

export default function AdventureFormPage() {
    const [adventure, setAdventure] = useState<Partial<Adventure>>({
        title: '',
        shortDescription: '',
        longDescription: '',
        imageUrl: '',
        latitude: 0,
        longitude: 0,
        experience: 0,
        featured: false,
        adventureId: '',
        userId: '',
    });
    const router = useRouter();
    const { id } = useParams();

    // Fetch adventure data if we're in update mode
    useEffect(() => {
        if (id !== 'create') {
            const fetchAdventure = async () => {
                const res = await fetch(`/api/adventures/${id}`);
                const data = await res.json();
                setAdventure(data); // Pre-fill the form with adventure data
            };

            fetchAdventure();
        }
    }, [id]);

    // Handle form submission for both creating and updating
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const url = id === 'create' ? '/api/adventures/create' : `/api/adventures/update/${id}`;
        const method = id === 'create' ? 'POST' : 'PATCH';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(adventure),
        });

        if (res.ok) {
            router.push('/adventures');
        }
    };

    return (
        <div className="container mt-5">
            <h1>{id === 'create' ? 'Create Adventure' : 'Edit Adventure'}</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="title" className="form-label">Title</label>
                    <input
                        type="text"
                        className="form-control"
                        id="title"
                        value={adventure.title}
                        onChange={(e) => setAdventure({ ...adventure, title: e.target.value })}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="shortDescription" className="form-label">Short Description</label>
                    <input
                        type="text"
                        className="form-control"
                        id="shortDescription"
                        value={adventure.shortDescription}
                        onChange={(e) => setAdventure({ ...adventure, shortDescription: e.target.value })}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="longDescription" className="form-label">Long Description</label>
                    <textarea
                        className="form-control"
                        id="longDescription"
                        value={adventure.longDescription}
                        onChange={(e) => setAdventure({ ...adventure, longDescription: e.target.value })}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="imageUrl" className="form-label">Image URL</label>
                    <input
                        type="text"
                        className="form-control"
                        id="imageUrl"
                        value={adventure.imageUrl}
                        onChange={(e) => setAdventure({ ...adventure, imageUrl: e.target.value })}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="latitude" className="form-label">Latitude</label>
                    <input
                        type="number"
                        className="form-control"
                        id="latitude"
                        value={adventure.latitude}
                        onChange={(e) => setAdventure({ ...adventure, latitude: parseFloat(e.target.value) })}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="longitude" className="form-label">Longitude</label>
                    <input
                        type="number"
                        className="form-control"
                        id="longitude"
                        value={adventure.longitude}
                        onChange={(e) => setAdventure({ ...adventure, longitude: parseFloat(e.target.value) })}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="experience" className="form-label">Experience</label>
                    <input
                        type="number"
                        className="form-control"
                        id="experience"
                        value={adventure.experience}
                        onChange={(e) => setAdventure({ ...adventure, experience: parseInt(e.target.value) })}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="adventureId" className="form-label">Adventure ID</label>
                    <input
                        type="text"
                        className="form-control"
                        id="adventureId"
                        value={adventure.adventureId}
                        onChange={(e) => setAdventure({ ...adventure, adventureId: e.target.value })}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="userId" className="form-label">User ID</label>
                    <input
                        type="text"
                        className="form-control"
                        id="userId"
                        value={adventure.userId}
                        onChange={(e) => setAdventure({ ...adventure, userId: e.target.value })}
                        required
                    />
                </div>
                <div className="form-check mb-3">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="featured"
                        checked={adventure.featured}
                        onChange={(e) => setAdventure({ ...adventure, featured: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="featured">Featured</label>
                </div>
                <button type="submit" className="btn btn-primary">
                    {id === 'create' ? 'Create Adventure' : 'Update Adventure'}
                </button>
                <button type="button" className="btn btn-secondary mx-2" onClick={() => router.push('/adventures')}>
                    Cancel
                </button>
            </form>
        </div>
    );
}
