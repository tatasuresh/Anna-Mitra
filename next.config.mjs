/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default { ...nextConfig, ...(process.env.NEXEN_DIST_DIR ? { distDir: process.env.NEXEN_DIST_DIR } : {}) };
