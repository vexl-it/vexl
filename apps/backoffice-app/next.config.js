const {builtinModules} = require('node:module')

// Match a webpack request that points at a Node built-in module, including
// `node:`-prefixed forms and built-in subpaths such as `util/types` or
// `fs/promises`.
const isNodeBuiltinRequest = (request) => {
  if (!request) return false
  const name = request.startsWith('node:') ? request.slice(5) : request
  return (
    builtinModules.includes(name) || builtinModules.includes(name.split('/')[0])
  )
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // Environment variables accessible in the browser
  env: {
    // NEXT_PUBLIC_API_INTERNAL_URL:
    //   process.env.API_INTERNAL_URL || 'http://localhost:3002',
  },

  // Keep the Postgres driver stack (used server-side only, via @effect/sql-pg in
  // instrumentation/migrations) out of the *production* bundle so it is traced
  // into the standalone output and loaded from node_modules at runtime.
  // NOTE: `next dev` does not honour this for the instrumentation entry — see
  // the webpack externals below, which cover that case.
  serverExternalPackages: [
    'pg',
    'pg-cursor',
    'pg-native',
    'pg-connection-string',
    'pg-pool',
    'pg-types',
  ],

  // Suppress TypeScript errors during builds (we run typecheck separately)
  typescript: {
    ignoreBuildErrors: false,
  },

  webpack: (config, {isServer}) => {
    if (isServer) {
      // The slideshow migrations pull in the `pg` driver stack (via
      // @effect/sql-pg) from `instrumentation.ts`. `next dev` bundles that stack
      // into the server instead of honouring `serverExternalPackages`, so
      // webpack tries to resolve the Node built-ins those packages require
      // (`util/types` in pg, `fs` in pg-connection-string, `path` in pgpass, …)
      // and the optional `pg-native` binding. Keep them external so they resolve
      // natively at runtime. This block existed before the pnpm migration; it is
      // restored here and made robust against built-in subpaths.
      const existingExternals = Array.isArray(config.externals)
        ? config.externals
        : config.externals
          ? [config.externals]
          : []

      config.externals = [
        ...existingExternals,
        ({request}, callback) => {
          if (isNodeBuiltinRequest(request) || request === 'pg-native') {
            return callback(null, `commonjs ${request}`)
          }
          return callback()
        },
      ]
    } else {
      // For client-side builds, drop Node.js built-ins referenced by shared packages
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
