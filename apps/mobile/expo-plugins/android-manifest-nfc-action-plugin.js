const {withAndroidManifest} = require('@expo/config-plugins')

const modifyAndroidManifest = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults

    if (
      androidManifest.manifest &&
      androidManifest.manifest.application &&
      androidManifest.manifest.application[0]?.activity
    ) {
      const activities = androidManifest.manifest.application[0].activity

      activities.forEach((activity) => {
        if (activity['intent-filter']) {
          activity['intent-filter'].forEach((intent) => {
            const actions = intent?.action
            if (Array.isArray(actions)) {
              actions.forEach((action) => {
                if (
                  action['$'] &&
                  action['$']['android:name'] ===
                    'android.intent.action.NDEF_DISCOVERED'
                ) {
                  action['$']['android:name'] =
                    'android.nfc.action.NDEF_DISCOVERED'
                }
              })
            }
          })
        }
      })
    }

    return config
  })
}

module.exports = modifyAndroidManifest
