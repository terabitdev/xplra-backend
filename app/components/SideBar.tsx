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
        <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsedSideBar : styles.expandedSideBar}`}>
            <div className={styles.sidebarContent}>
                <button onClick={toggleSidebar} className={styles.toggleButton}>
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
                <h2 className={styles.logo}>{isCollapsed ? 'X' : 'Xplra'}</h2>
                <nav className={styles.nav}>
                    <a className={styles.navLink} href="/quests">
                        <Home size={20} className={styles.icon} />
                        {!isCollapsed && <span>Quests</span>}
                    </a>
                    <a className={styles.navLink} href="/adventures">
                        <EarthEuropeAfrica size={20} className={styles.icon} />
                        {!isCollapsed && <span>Adventures</span>}
                    </a>
                    <a className={styles.navLink} href="/categories">
                        <Tag size={20} className={styles.icon} />
                        {!isCollapsed && <span>Categories</span>}
                    </a>
                    <a className={styles.navLink} href="/achievements">
                        <Trophy size={20} className={styles.icon} />
                        {!isCollapsed && <span>Achievements</span>}
                    </a>

                </nav>
            </div>
            <div className={styles.logoutButton}>
                <button className="btn btn-danger" onClick={handleLogout}>
                    <Logout size={20} className={styles.icon} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
}
