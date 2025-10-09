'use client';

import { ReactNode } from 'react';
import Sidebar from './SideBar';
import TopBar from './TopBar';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <TopBar />
                <main className="pt-16 p-8 min-h-screen bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
