const fs = require('fs')
const path = require('path')
const {withDangerousMod} = require('expo/config-plugins')
const generateCode = require('@expo/config-plugins/build/utils/generateCode')

// https://github.com/react-native-maps/react-native-maps/issues/4793#issuecomment-1671269814
const googleMapsIosSiliconWorkaroundPodCode = `pod 'Google-Maps-iOS-Utils', :git => 'https://github.com/Simon-TechForm/google-maps-ios-utils.git', :branch => 'feat/support-apple-silicon'`

/** @type { import('expo/config-plugins').ConfigPlugin } */
const withPlugin = (expoConfig) => {
  return withDangerousMod(expoConfig, [
    'ios',
    async (config) => {
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      )

      const contents = fs.readFileSync(filePath, 'utf-8')

      const addCode = generateCode.mergeContents({
        newSrc: googleMapsIosSiliconWorkaroundPodCode,
        tag: 'withGoogleMapsIOSWorkaroundPlugin',
        anchor: /\s*get_default_flags\(\)/i,
        src: contents,
        comment: '#',
        offset: 2,
      })

      if (!addCode.didMerge) {
        console.warn(
          "WARNING: Couldn't add custom plugin Podfile code from app.plugin.js to the project's ios/Podfile."
        )
        return config
      }

      fs.writeFileSync(filePath, addCode.contents)

      return config
    },
  ])
}

module.exports = withPlugin
