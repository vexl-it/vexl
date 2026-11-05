const path = require('path')
const webpack = require('webpack')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  agentRules: false,
  output: 'standalone',
  transpilePackages: [
    '@vexl-next/ui',
    'react-native-web',
    'react-native-svg',
    'react-native-reanimated',
    'react-native-worklets',
    'react-native-gesture-handler',
    'react-native-keyboard-controller',
    'react-native-safe-area-context',
    'react-native-calendars',
    'react-native-qrcode-svg',
    'react-native-autolink',
    'react-native-swipe-gestures',
  ],
  // English is served from the root, other locales from their prefix
  rewrites: async () => [
    {source: '/', destination: '/en'},
    {source: '/:path((?!cs(?:/|$)).+)', destination: '/en/:path'},
  ],
  redirects: async () => [
    {source: '/en', destination: '/', permanent: true},
    {source: '/en/:path*', destination: '/:path*', permanent: true},
    {source: '/download-old2', destination: '/download', permanent: true},
    {source: '/cs/download-old2', destination: '/cs/download', permanent: true},
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
    }
    config.resolve.extensions = [
      '.web.tsx',
      '.web.ts',
      '.web.js',
      ...config.resolve.extensions,
    ]
    config.plugins.push(
      new webpack.DefinePlugin({
        // react-native libraries (reanimated, worklets) read the Node-style `global`
        global: 'globalThis',
        __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
        'process.env.TAMAGUI_TARGET': JSON.stringify('web'),
      })
    )
    // Reanimated worklets need their Babel transform; the rest stays on SWC
    config.module.rules.push({
      test: /\.tsx?$/,
      include: path.resolve(__dirname, '../../packages/ui/src'),
      enforce: 'pre',
      use: {
        loader: 'babel-loader',
        options: {
          babelrc: false,
          configFile: false,
          plugins: [
            ['@babel/plugin-syntax-typescript', {isTSX: true}],
            'react-native-worklets/plugin',
          ],
        },
      },
    })
    // Reanimated's web build calls require() inside ES modules
    config.module.rules.push({
      test: /react-native-reanimated[\\/]lib[\\/]module[\\/].*\.js$/,
      type: 'javascript/auto',
    })
    config.module.rules.push({
      test: /\.(ttf|otf)$/,
      type: 'asset/resource',
    })
    return config
  },
}

module.exports = nextConfig
