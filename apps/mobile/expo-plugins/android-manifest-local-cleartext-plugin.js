const {withAndroidManifest} = require('@expo/config-plugins')

const withAndroidManifestLocalCleartext = (config) =>
  withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults

    if (
      androidManifest.manifest &&
      androidManifest.manifest.application &&
      androidManifest.manifest.application[0]
    ) {
      const mainApplication = androidManifest.manifest.application[0]
      mainApplication.$ = mainApplication.$ ?? {}
      mainApplication.$['android:usesCleartextTraffic'] = 'true'
    }

    return config
  })

module.exports = withAndroidManifestLocalCleartext
