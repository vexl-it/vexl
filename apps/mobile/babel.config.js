process.env.TAMAGUI_TARGET = 'native'

module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      'babel-preset-expo',
      [
        '@babel/preset-react',
        {
          importSource: '@welldone-software/why-did-you-render',
          runtime: 'automatic',
          development: process.env.NODE_ENV === 'development' || false,
        },
      ],
    ],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            'crypto': 'react-native-quick-crypto',
            'node:crypto': 'react-native-quick-crypto',
            // 'crypto': 'crypto-browserify',
            // 'node:crypto': 'crypto-browserify',
            'stream': 'stream-browserify',
            'buffer': '@craftzdog/react-native-buffer',
            'node:buffer': '@craftzdog/react-native-buffer',
            'brorand': '@vexl-next/fix-brorand-for-expo',
          },
        },
      ],
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './src/utils/ThemeProvider/tamagui.config.ts',
          logTimings: true,
        },
      ],
      [
        'transform-inline-environment-variables',
        {
          include: 'TAMAGUI_TARGET',
        },
      ],
      'react-native-reanimated/plugin',
    ],
  }
}
