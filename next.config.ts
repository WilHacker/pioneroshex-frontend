import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde otros dispositivos de la red de casa.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*'],
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
