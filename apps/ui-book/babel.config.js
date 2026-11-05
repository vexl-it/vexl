process.env.TAMAGUI_TARGET = 'native'

module.exports = function (api) {
  // @tamagui/babel-plugin only extracts for native
  const isWeb = api.caller((caller) => caller?.platform === 'web')
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ...(isWeb
        ? []
        : [
            [
              '@tamagui/babel-plugin',
              {
                components: ['@vexl-next/ui', 'tamagui'],
                config: './tamagui.config.ts',
                logTimings: true,
              },
            ],
          ]),
      'react-native-reanimated/plugin',
    ],
  }
}
