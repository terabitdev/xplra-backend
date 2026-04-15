'use client';

import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Sidebar from './SideBar';
import TopBar from './TopBar';

interface DashboardLayoutProps {
    children: ReactNode;
    hideSearch?: boolean;
}

export default function DashboardLayout({ children, hideSearch = true }: DashboardLayoutProps) {
    const isSidebarOpen = useSelector((state: RootState) => state.ui.isSidebarOpen);

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div
                className={`flex-1 sm:mt-8 transition-all duration-300 ease-in-out ${
                    isSidebarOpen ? 'md:ml-64' : 'md:ml-16'
                }`}
            >
                <TopBar hideSearch={hideSearch} />
                <main className="pt-14 p-3 sm:p-4 lg:p-6 min-h-screen bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
