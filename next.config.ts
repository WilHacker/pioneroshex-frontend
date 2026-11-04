import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Genera un servidor mínimo (.next/standalone) para la imagen de Docker.
  output: 'standalone',
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
