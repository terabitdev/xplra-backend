'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, EarthEuropeAfrica, Logout, ChevronRight, ChevronLeft, Trophy, Tag } from '@carbon/icons-react';
import styles from './SideBar.module.css';

export default function Sidebar() {
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(true);

    useEffect(() => {
        // Retrieve saved state from localStorage when component mounts
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState) {
            setIsCollapsed(JSON.parse(savedState));
        }
    }, []);

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
            } else {
                console.error('Failed to log out');
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const toggleSidebar = () => {
        // Toggle state and save to localStorage
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    };

    return (
        <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsedSideBar : styles.expandedSideBar} flex flex-col h-screen bg-bootstrap-bg fixed top-0 left-0 bottom-0 z-[1000] shadow-[2px_0_5px_rgba(0,0,0,0.1)]`}>
            <div className="flex flex-col items-center pt-4">
                <button onClick={toggleSidebar} className="bg-transparent border-none text-xl cursor-pointer mb-4">
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
                <h2 className={`${styles.logo} text-2xl my-4`}>{isCollapsed ? 'X' : 'Xplra'}</h2>
                <nav className="flex flex-col items-center w-full">
                    <a className={`${styles.navLink} flex items-center my-2 whitespace-nowrap w-full px-2 py-2 text-left gap-2.5 justify-center`} href="/quests">
                        <Home size={20} className="inline-block" />
                        {!isCollapsed && <span>Quests</span>}
                    </a>
                    <a className={`${styles.navLink} flex items-center my-2 whitespace-nowrap w-full px-2 py-2 text-left gap-2.5 justify-center`} href="/adventures">
                        <EarthEuropeAfrica size={20} className="inline-block" />
                        {!isCollapsed && <span>Adventures</span>}
                    </a>
                    <a className={`${styles.navLink} flex items-center my-2 whitespace-nowrap w-full px-2 py-2 text-left gap-2.5 justify-center`} href="/categories">
                        <Tag size={20} className="inline-block" />
                        {!isCollapsed && <span>Categories</span>}
                    </a>
                    <a className={`${styles.navLink} flex items-center my-2 whitespace-nowrap w-full px-2 py-2 text-left gap-2.5 justify-center`} href="/achievements">
                        <Trophy size={20} className="inline-block" />
                        {!isCollapsed && <span>Achievements</span>}
                    </a>

                </nav>
            </div>
            <div className="mt-auto p-4 flex items-center justify-center w-full">
                <button className="w-full bg-bootstrap-danger hover:bg-bootstrap-danger-hover text-white border-none py-3 px-4 text-base rounded flex items-center justify-center gap-2" onClick={handleLogout}>
                    <Logout size={20} className="inline-block" />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
}
