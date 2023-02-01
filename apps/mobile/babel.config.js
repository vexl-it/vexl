module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
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
    ],
  }
}
