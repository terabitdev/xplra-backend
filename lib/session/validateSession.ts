// lib/session/validateSession.ts

export async function validateSession(token: string) {
    const res = await fetch('/api/session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
    });

    const data = await res.json();

    if (res.ok) {
        return data.user;
    } else {
        throw new Error(data.error);
    }
}
