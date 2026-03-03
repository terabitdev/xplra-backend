'use client';

import DashboardLayout from '../components/DashboardLayout';

export default function CategoriesPage() {
    return (
        <DashboardLayout hideSearch>
            <div className="w-full mt-5 sm:mt-7 lg:mt-0 p-2 sm:p-4 lg:py-6">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Categories</h1>
                    <p className="text-gray-500 mt-1 text-sm">Category management coming soon</p>
                </div>

                <div className="flex flex-col items-center justify-center py-20">
                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <p className="text-gray-500 font-medium">Categories are managed via seed API</p>
                    <p className="text-gray-400 text-sm mt-1">This page will be updated soon</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
