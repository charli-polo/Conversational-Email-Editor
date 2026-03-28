import type { NextConfig } from 'next';
import path from 'path';

const basePath = process.env.BASE_PATH || '';

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  reactStrictMode: true,
  devIndicators: false,
  outputFileTracingRoot: path.join(__dirname),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
