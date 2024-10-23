/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // This disables ESLint during builds
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
