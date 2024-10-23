'use client';

import { useRouter } from 'next/navigation';

export default function Sidebar() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (res.ok) {
                // Clear token and redirect to sign-in page
                localStorage.removeItem('token');
                router.push('/signin');
            } else {
                console.error('Failed to log out');
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <div className="sidebar">
            <div>
                <h2>Xplra</h2> {/* Logo */}
                <nav className="nav flex-column">
                    <a className="nav-link" href="#">Quests</a>
                    <a className="nav-link" href="#">Adventures</a>
                    <a className="nav-link" href="#">Featured Adventures</a>
                </nav>
            </div>
            <div className="logout-button">
                <button className="btn btn-danger" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </div>
    );
}
