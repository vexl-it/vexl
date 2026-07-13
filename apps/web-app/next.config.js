const webpack = require('webpack')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  transpilePackages: [
    '@vexl-next/cryptography',
    '@vexl-next/domain',
    '@vexl-next/generic-utils',
    '@vexl-next/rest-api',
  ],
  webpack: (config, {isServer}) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        vm: require.resolve('vm-browserify'),
        zlib: require.resolve('browserify-zlib'),
      }
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      )
    }

    return config
  },
}

module.exports = nextConfig
