'use client';

import { ReactNode } from 'react';
import Sidebar from './SideBar';
import TopBar from './TopBar';
import CustomScrollbar from './ui/CustomScrollbar';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 sm:mt-8 ml-0 lg:ml-64">
                <TopBar />
                <CustomScrollbar className="h-screen">
                    <main className="pt-16 p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
                        {children}
                    </main>
                </CustomScrollbar>
            </div>
        </div>
    );
}
