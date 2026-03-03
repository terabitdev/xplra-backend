/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // This disables ESLint during builds
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
            { protocol: 'https', hostname: 'storage.googleapis.com' },
            { protocol: 'https', hostname: 'picsum.photos' },
        ],
    },
    reactStrictMode: false, // Disable to reduce console warnings in development
};

export default nextConfig;
