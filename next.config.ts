import type { NextConfig } from 'next';
import path from 'path';

const basePath = process.env.BASE_PATH || '';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  basePath: basePath || undefined,
  reactStrictMode: true,
  devIndicators: false,
  outputFileTracingRoot: path.join(__dirname),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '0.0.0',
  },
};

export default nextConfig;
