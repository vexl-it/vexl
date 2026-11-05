/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  agentRules: false,
  poweredByHeader: false,
  output: 'standalone',
  // English is served from the root, other locales from their prefix
  rewrites: async () => [
    {source: '/', destination: '/en'},
    {source: '/:path((?!cs(?:/|$)|_next/|wf/).+)', destination: '/en/:path'},
  ],
  redirects: async () => [
    {source: '/en', destination: '/', permanent: true},
    {source: '/en/:path*', destination: '/:path*', permanent: true},
    // Webflow's paginated CMS lists used query parameters; page 1 needs none
    ...[
      ['blog', '27a9a69d_page'],
      ['community', '534aadfb_page'],
    ].flatMap(([list, key]) =>
      ['', '/cs'].map((prefix) => ({
        source: `${prefix}/${list}`,
        has: [{type: 'query', key, value: '(?<page>[2-9]|[1-9]\\d+)'}],
        destination: `${prefix}/${list}/page/:page`,
        permanent: true,
      }))
    ),
  ],
}

module.exports = nextConfig
