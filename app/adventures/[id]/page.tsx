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
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const router = useRouter();
    const { id } = useParams();

    // Fetch adventure data if in edit mode
    useEffect(() => {
        if (id !== 'create') {
            const fetchAdventure = async () => {
                const res = await fetch(`/api/adventures/${id}`);
                const data = await res.json();
                setAdventure(data);
                setImagePreview(data.imageUrl); // Set existing image URL as preview if available
            };
            fetchAdventure();
        }
    }, [id]);

    // Handle image selection and preview update
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        setImageFile(file);

        if (file) {
            const fileReader = new FileReader();
            fileReader.onload = () => {
                setImagePreview(fileReader.result as string);
            };
            fileReader.readAsDataURL(file);
        }
    };

    // Handle form submission for both creating and updating adventures
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('adventure', JSON.stringify(adventure));
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const url = id === 'create' ? '/api/adventures/create' : `/api/adventures/update/${id}`;
        const method = id === 'create' ? 'POST' : 'PATCH';

        const res = await fetch(url, {
            method,
            body: formData,
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
                {/* Image Preview Section */}
                <div className="mb-3">
                    {imagePreview && (
                        <div className="mb-3">
                            <label>Current Image Preview:</label>
                            <div>
                                <img src={imagePreview} alt="Adventure Image Preview" className="img-fluid" style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }} />
                            </div>
                        </div>
                    )}
                    <label htmlFor="image">Upload New Image</label>
                    <input
                        type="file"
                        className="form-control"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
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
