'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Adventure } from '@/lib/domain/models/adventures';
import { ChevronLeft } from '@carbon/icons-react';

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
        featuredImages: [],
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
            const url = id === 'create' ? '/api/adventures/create' : `/api/adventures/update/${adventure.id}`;
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
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <h1 style={{ display: 'flex', alignItems: 'center' }}>
                <ChevronLeft onClick={() => router.push('/adventures')} width={32} height={32} />
                {id === 'create' ? 'Create Adventure' : 'Edit Adventure'}
            </h1>
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
                        disabled={loading}
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
                        disabled={loading}
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
                        disabled={loading}
                    />
                </div>

                <div className="mb-3">
                    {adventure.featured ? (
                        <>
                            <label htmlFor="featuredImages">Upload Featured Images</label>
                            <input
                                type="file"
                                className="form-control"
                                id="featuredImages"
                                accept="image/*"
                                onChange={handleImageChange}
                                multiple
                                disabled={loading}
                            />
                            <div className="mt-3">
                                {multiImagePreviews.map((preview, index) => (
                                    <div key={index} style={{ position: 'relative', display: 'inline-block', marginRight: '10px' }}>
                                        <img src={preview} alt={`Featured Image ${index + 1}`} className="img-fluid" style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }} />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(index)}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                backgroundColor: 'red',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '20px',
                                                height: '20px',
                                                textAlign: 'center',
                                                padding: '0',
                                                lineHeight: '20px',
                                            }}
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
                            <label htmlFor="image">Upload Main Image</label>
                            <input
                                type="file"
                                className="form-control"
                                id="image"
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={loading}
                            />
                            {imagePreview && (
                                <div className="mt-3">
                                    <label>Current Image Preview:</label>
                                    <div>
                                        <img src={imagePreview} alt="Adventure Image Preview" className="img-fluid" style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }} />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="mb-3">
                    <label htmlFor="latitude" className="form-label">Latitude</label>
                    <input
                        type="text"
                        className="form-control"
                        id="latitude"
                        value={adventure.latitude}
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
                <div className="mb-3">
                    <label htmlFor="longitude" className="form-label">Longitude</label>
                    <input
                        type="text"
                        className="form-control"
                        id="longitude"
                        value={adventure.longitude}
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
                <div className="mb-3">
                    <label htmlFor="experience" className="form-label">Experience</label>
                    <input
                        type="number"
                        className="form-control"
                        id="experience"
                        value={adventure.experience}
                        onChange={(e) => setAdventure({ ...adventure, experience: parseInt(e.target.value) })}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-check mb-3">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="featured"
                        checked={adventure.featured}
                        onChange={(e) => setAdventure({ ...adventure, featured: e.target.checked })}
                        disabled={loading}
                    />
                    <label className="form-check-label" htmlFor="featured">Featured</label>
                </div>
                <div className="d-flex align-items-center">
                    {loading ? (
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    ) : (
                        <>
                            <button type="submit" className="btn btn-primary">
                                {id === 'create' ? 'Create Adventure' : 'Update Adventure'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary mx-2"
                                onClick={() => router.push('/adventures')}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
}
