/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // This disables ESLint during builds
        ignoreDuringBuilds: true,
    },
    images: {
        domains: [
            '*',
            'firebasestorage.googleapis.com',
            'picsum.photos',
        ], // Add your allowed domains here
    },
};

export default nextConfig;
