/** @type {import('next').NextConfig} */
const nextConfig = {
      eslint: {
    // Warning: This allows production builds to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
