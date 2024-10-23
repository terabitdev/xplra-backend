import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { validateSession } from '../session/validateSession';

export default function withAuth(Component: any) {
    return function AuthenticatedComponent(props: any) {
        const [loading, setLoading] = useState(true);
        const [authenticated, setAuthenticated] = useState(false);
        const router = useRouter();

        useEffect(() => {
            const token = localStorage.getItem('token'); // Or from cookies
            if (!token) {
                router.push('/signin');
                return;
            }

            validateSession(token)
                .then(() => {
                    setAuthenticated(true);
                    setLoading(false);
                })
                .catch(() => {
                    router.push('/signin');
                });
        }, [router]);

        if (loading) {
            return <div>Loading...</div>;
        }

        return authenticated ? <Component { ...props } /> : null;
    };
}
