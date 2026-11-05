/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  agentRules: false,
  output: 'standalone',
  // English is served from the root, other locales from their prefix
  rewrites: async () => [
    {source: '/', destination: '/en'},
    {source: '/:path((?!cs(?:/|$)|_next/|wf/).+)', destination: '/en/:path'},
  ],
  redirects: async () => [
    {source: '/en', destination: '/', permanent: true},
    {source: '/en/:path*', destination: '/:path*', permanent: true},
  ],
}

module.exports = nextConfig
