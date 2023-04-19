const {
  AndroidConfig,
  withPlugins,
  withAndroidManifest,
} = require('expo/config-plugins')

const {addMetaDataItemToMainApplication, getMainApplicationOrThrow} =
  AndroidConfig.Manifest

module.exports = function withDisabledFirebaseAnalytics(config) {
  return withPlugins(config, [
    withAnalyticsDisabledInAndroidManifest,
    withAnalyticsDisabledInInfoPlist,
  ])
}

function withAnalyticsDisabledInAndroidManifest(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = addItemToAndroidManifest(config, config.modResults)
    
    return config
  })
}

function withAnalyticsDisabledInInfoPlist(config) {
  if (!config.ios) {
    config.ios = {}
  }
  if (!config.ios.infoPlist) {
    config.ios.infoPlist = {}
  }

  config.ios.infoPlist.FIREBASE_ANALYTICS_COLLECTION_DEACTIVATED = true

  return config
}

function addItemToAndroidManifest(config, androidManifest) {
  const mainApplication = getMainApplicationOrThrow(androidManifest)

  addMetaDataItemToMainApplication(
    mainApplication,
    // value for `android:name`
    'firebase_analytics_collection_deactivated',
    // value for `android:value`
    'true'
  )

  return androidManifest
}
