'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UserAvatar, ChevronDown, Logout, Edit } from '@carbon/icons-react';

export default function TopBar() {
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [userPhotoURL, setUserPhotoURL] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Edit profile form states
    const [editName, setEditName] = useState('');
    const [editPhoto, setEditPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const token = localStorage.getItem('token');

                if (token) {
                    const res = await fetch('/api/user/profile', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setUserEmail(data.email);
                        setUserName(data.displayName || data.email?.split('@')[0] || 'User');
                        setUserPhotoURL(data.photoURL || null);
                        setEditName(data.displayName || data.email?.split('@')[0] || '');
                    } else {
                        // If session is invalid, redirect to signin
                        router.push('/signin');
                    }
                }
            } catch (error) {
                console.error('Error fetching user details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserDetails();

        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [router]);

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (res.ok) {
                localStorage.removeItem('token');
                router.push('/signin');
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const handleOpenEditModal = () => {
        setIsDropdownOpen(false);
        setIsEditModalOpen(true);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('displayName', editName);
            if (editPhoto) {
                formData.append('photo', editPhoto);
            }

            const token = localStorage.getItem('token');
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setUserName(data.displayName);
                setUserPhotoURL(data.photoURL);
                setIsEditModalOpen(false);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-[4.7rem] bg-white border-b border-gray-200 fixed top-0 left-64 right-0 z-50 flex items-center justify-between px-6 shadow-sm">
            {/* Logo */}
            <div className="flex items-center">
                <Image
                    src="/assets/xplralogo2.jpg"
                    alt="Xplra Logo"
                    width={120}
                    height={40}
                    className="object-contain"
                />
            </div>

            {/* User Profile Section */}
            <div className="relative" ref={dropdownRef}>
                {loading ? (
                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="hidden md:block">
                            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {userPhotoURL ? (
                            <img
                                src={userPhotoURL}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-semibold">
                                {userName?.charAt(0)?.toUpperCase() || userEmail?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-semibold text-gray-800">
                                {userName || 'User'}
                            </p>
                            <p className="text-xs text-gray-500">{userEmail || 'user@example.com'}</p>
                        </div>
                        <ChevronDown
                            size={20}
                            className={`text-gray-600 transition-transform ${
                                isDropdownOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </button>
                )}

                {/* Dropdown Menu */}
                {isDropdownOpen && !loading && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                        <div className="px-4 py-3 border-b border-gray-200">
                            <p className="text-sm font-semibold text-gray-800">
                                {userName || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                        </div>

                        <button
                            onClick={handleOpenEditModal}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            <Edit size={18} />
                            Edit Profile
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <Logout size={18} />
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>

                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>

                        <div className="space-y-6">
                            {/* Profile Photo */}
                            <div className="flex flex-col items-center">
                                <div className="relative">
                                    {photoPreview || userPhotoURL ? (
                                        <img
                                            src={photoPreview || userPhotoURL || ''}
                                            alt="Profile"
                                            className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-100">
                                            {editName?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                    <label
                                        htmlFor="photo-upload"
                                        className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors"
                                    >
                                        <Edit size={16} />
                                        <input
                                            id="photo-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Click icon to upload photo</p>
                            </div>

                            {/* Display Name */}
                            <div>
                                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    id="displayName"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                                    placeholder="Enter your name"
                                />
                            </div>

                            {/* Email (Read-only) */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={userEmail || ''}
                                    disabled
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
