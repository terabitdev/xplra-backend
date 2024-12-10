'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Achievement } from '@/lib/domain/models/achievement';
import { ChevronLeft } from '@carbon/icons-react';

export default function AchievementFormPage() {
    const [achievement, setAchievement] = useState<Partial<Achievement>>({
        id: '',
        title: '',
        description: '',
        icon: '',
        trigger: 'experience',
        triggerValue: '100',
        dateAchieved: undefined,
        userId: undefined,

    });
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const router = useRouter();
    const { id } = useParams();

    useEffect(() => {
        if (id !== 'create') {
            setDataLoading(true);
            const fetchAchievement = async () => {
                const res = await fetch(`/api/achievements/${id}`);
                const data = await res.json();
                setAchievement(data);
                setDataLoading(false);
            };
            fetchAchievement();
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('achievement', JSON.stringify(achievement));

            const url = id === 'create' ? '/api/achievements' : `/api/achievements/${id}`;
            const method = id === 'create' ? 'POST' : 'PATCH';

            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (res.ok) {
                router.push('/achievements');
            } else {
                // Handle errors here if needed
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
                <ChevronLeft
                    onClick={() => router.push('/achievements')}
                    width={32}
                    height={32}
                />
                {id === 'create' ? 'Create Achievement' : 'Edit Achievement'}
            </h1>
            <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                    <label htmlFor="title">Title</label>
                    <input
                        type="text"
                        className="form-control"
                        id="title"
                        value={achievement.title}
                        onChange={(e) => setAchievement({ ...achievement, title: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="description">Description</label>
                    <textarea
                        className="form-control"
                        id="description"
                        value={achievement.description}
                        onChange={(e) => setAchievement({ ...achievement, description: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="icon">Icon</label>
                    <input
                        type="text"
                        className="form-control"
                        id="icon"
                        value={achievement.icon}
                        onChange={(e) => setAchievement({ ...achievement, icon: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="trigger">Trigger</label>
                    <select
                        className="form-control"
                        id="trigger"
                        value={achievement.trigger}
                        onChange={(e) => setAchievement({ ...achievement, trigger: e.target.value as Achievement['trigger'] })}
                        required
                        disabled={loading}
                    >
                        <option value="experience">Experience</option>
                        <option value="level">Level</option>
                        <option value="achievement">Achievement</option>
                        <option value="quest">Quest</option>
                    </select>
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="triggerValue">Trigger Value</label>
                    <input
                        type="text"
                        className="form-control"
                        id="triggerValue"
                        value={achievement.triggerValue}
                        onChange={(e) => setAchievement({ ...achievement, triggerValue: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>
                {loading ? (
                    <div className="d-flex justify-content-center">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <button type="submit" className="btn btn-primary">
                        {id === 'create' ? 'Create Achievement' : 'Update Achievement'}
                    </button>
                )}
            </form>
        </div>
    );
}
