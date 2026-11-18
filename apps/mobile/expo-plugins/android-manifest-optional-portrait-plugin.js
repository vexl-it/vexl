const {withAndroidManifest} = require('@expo/config-plugins')

const PORTRAIT_FEATURE = 'android.hardware.screen.portrait'

// `orientation: 'portrait'` makes Google Play imply a required portrait screen,
// which blocks installs on devices without one (tablets, desktops, XR).
const withOptionalPortraitFeature = (config) =>
  withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest
    const features = (manifest['uses-feature'] ?? []).filter(
      (feature) => feature.$['android:name'] !== PORTRAIT_FEATURE
    )
    manifest['uses-feature'] = [
      ...features,
      {$: {'android:name': PORTRAIT_FEATURE, 'android:required': 'false'}},
    ]
    return config
  })

module.exports = withOptionalPortraitFeature
