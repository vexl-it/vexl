/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // Environment variables accessible in the browser
  env: {
    NEXT_PUBLIC_API_INTERNAL_URL:
      process.env.API_INTERNAL_URL || 'http://localhost:3003',
  },

  // Optional: suppress ESLint during builds (since we run it separately)
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Optional: suppress TypeScript errors during builds (since we run typecheck separately)
  typescript: {
    ignoreBuildErrors: false,
  },

  // Webpack configuration to handle Node.js modules
  webpack: (config, {isServer}) => {
    // For client-side builds, mark Node.js built-ins as external or provide polyfills
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
      }
    }

    return config
  },

  // Transpile monorepo packages
  transpilePackages: [
    '@vexl-next/rest-api',
    '@vexl-next/domain',
    '@vexl-next/cryptography',
  ],
}

module.exports = nextConfig
