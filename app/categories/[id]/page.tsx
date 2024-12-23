'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft } from '@carbon/icons-react';
import { Category } from '@/lib/domain/models/category';
import Image from 'next/image';

export default function AchievementFormPage() {
    const [imagePreview, setImagePreview] = useState<string | null>(null);

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
        if (file) {
            const fileReader = new FileReader();
            fileReader.onload = () => setImagePreview(fileReader.result as string);
            fileReader.readAsDataURL(file);
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
                <ChevronLeft
                    onClick={() => router.push('/categories')}
                    width={32}
                    height={32}
                />
                {id === 'create' ? 'Create Category' : 'Edit Category'}
            </h1>
            <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                    <label htmlFor="title">Title</label>
                    <input
                        type="text"
                        className="form-control"
                        id="title"
                        value={category.name}
                        onChange={(e) => setCategory({ ...category, name: e.target.value })}
                        required
                        disabled={loading}
                    />
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
                        {category.imageUrl && category.imageUrl.length > 0 && (
                            <div className="mt-3">
                                <label>Current Image Preview:</label>
                                <div>
                                    <img src={category.imageUrl} alt="Category Image" style={{ maxWidth: '100%' }} />
                                </div>
                            </div>
                        )}
                    </>
                </div>

                {loading ? (
                    <div className="d-flex justify-content-center">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <button type="submit" className="btn btn-primary">
                        {id === 'create' ? 'Create Category' : 'Update Category'}
                    </button>
                )}
            </form>
        </div>
    );
}
