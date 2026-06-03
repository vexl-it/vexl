const {withAppBuildGradle} = require('expo/config-plugins')

module.exports = function withAndroidEasSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents

    contents = contents.replace(
      /(\n\s*release\s*\{[\s\S]*?)\n\s*signingConfig signingConfigs\.debug/,
      '$1'
    )

    if (!contents.includes('eas-build.gradle')) {
      contents += `
def easBuildGradle = file("./eas-build.gradle")
if (easBuildGradle.exists()) {
    apply from: easBuildGradle
}
`
    }

    config.modResults.contents = contents
    return config
  })
}
