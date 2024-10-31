'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Quest } from '@/lib/domain/models/quest';
import { ChevronLeft } from '@carbon/icons-react';

export default function QuestFormPage() {
    const [quest, setQuest] = useState<Partial<Quest>>({
        title: '',
        shortDescription: '',
        longDescription: '',
        experience: 0,
        imageUrl: '',
        stepCode: '',
        stepLatitude: 0,
        stepLongitude: 0,
        stepType: 'qr',
        timeInSeconds: 0,
        userId: null,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const router = useRouter();
    const { id } = useParams();

    useEffect(() => {
        if (id !== 'create') {
            const fetchQuest = async () => {
                const res = await fetch(`/api/quests/${id}`);
                const data = await res.json();
                setQuest(data);
                setImagePreview(data.imageUrl);
            };
            fetchQuest();
        }
    }, [id]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('quest', JSON.stringify(quest));
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const url = id === 'create' ? '/api/quests/create' : `/api/quests/${id}`;
        const method = id === 'create' ? 'POST' : 'PATCH';

        const res = await fetch(url, {
            method,
            body: formData,
        });

        if (res.ok) {
            router.push('/quests');
        }
    };

    return (
        <div className="container mt-5">
            <h1 style={{ display: 'flex', alignItems: 'center' }}>
                <ChevronLeft
                    onClick={() => router.push('/quests')}
                    width={32}
                    height={32} />
                {id === 'create' ? 'Create Quest' : 'Edit Quest'}
            </h1>
            <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                    <label htmlFor="title">Title</label>
                    <input
                        type="text"
                        className="form-control"
                        id="title"
                        value={quest.title}
                        onChange={(e) => setQuest({ ...quest, title: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="shortDescription">Short Description</label>
                    <input
                        type="text"
                        className="form-control"
                        id="shortDescription"
                        value={quest.shortDescription}
                        onChange={(e) => setQuest({ ...quest, shortDescription: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="longDescription">Long Description</label>
                    <textarea
                        className="form-control"
                        id="longDescription"
                        rows={3}
                        value={quest.longDescription}
                        onChange={(e) => setQuest({ ...quest, longDescription: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="experience">Experience</label>
                    <input
                        type="number"
                        className="form-control"
                        id="experience"
                        value={quest.experience}
                        onChange={(e) => setQuest({ ...quest, experience: parseInt(e.target.value) })}
                        required
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="stepCode">Step Code</label>
                    <input
                        type="text"
                        className="form-control"
                        id="stepCode"
                        value={quest.stepCode}
                        onChange={(e) => setQuest({ ...quest, stepCode: e.target.value })}
                        required
                    />
                </div>
                <input
                    type="text" // Keep type as "text" to allow "-" and "."
                    className="form-control"
                    id="stepLatitude"
                    value={quest.stepLatitude}
                    onChange={(e) => {
                        const value = e.target.value;
                        // Allow "-" and "." as part of the input without converting immediately
                        if (/^-?\d*\.?\d*$/.test(value) || value === '-') {
                            setQuest({ ...quest, stepLatitude: value });
                        }
                    }}
                    onBlur={() => {
                        // Convert to number when the input loses focus
                        if (quest.stepLatitude === '-' || quest.stepLatitude === '' || isNaN(Number(quest.stepLatitude))) {
                            setQuest({ ...quest, stepLatitude: 0 });
                        } else {
                            setQuest({ ...quest, stepLatitude: parseFloat(quest.stepLatitude as string) });
                        }
                    }}
                    required
                />
                <div className="form-group mb-3">
                    <label htmlFor="stepLongitude">Step Longitude</label>
                    <input
                        type="text" // Keep type as "text" to allow "-" and "."
                        className="form-control"
                        id="stepLongitude"
                        value={quest.stepLongitude}
                        onChange={(e) => {
                            const value = e.target.value;
                            // Allow "-" and "." as part of the input without converting immediately
                            if (/^-?\d*\.?\d*$/.test(value) || value === '-') {
                                setQuest({ ...quest, stepLongitude: value });
                            }
                        }}
                        onBlur={() => {
                            // Convert to number when the input loses focus
                            if (quest.stepLongitude === '-' || quest.stepLongitude === '' || isNaN(Number(quest.stepLongitude))) {
                                setQuest({ ...quest, stepLongitude: 0 });
                            } else {
                                setQuest({ ...quest, stepLongitude: parseFloat(quest.stepLongitude as string) });
                            }
                        }}
                        required
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="stepType">Step Type</label>
                    <select
                        className="form-control"
                        id="stepType"
                        value={quest.stepType}
                        onChange={(e) => setQuest({ ...quest, stepType: e.target.value })}
                    >
                        <option value="qr">QR</option>
                        <option value="location">Location</option>
                        <option value="timeLocation">Time & Location</option>
                    </select>
                </div>
                <div className="form-group mb-3">
                    {imagePreview && (
                        <div className="mb-3">
                            <label>Current Image Preview:</label>
                            <div>
                                <img src={imagePreview} alt="Quest Image Preview" className="img-fluid" style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }} />
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
                <button type="submit" className="btn btn-primary">
                    {id === 'create' ? 'Create Quest' : 'Update Quest'}
                </button>
            </form>
        </div>
    );
}
