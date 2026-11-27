const {AndroidConfig, withAndroidStyles} = require('@expo/config-plugins')

const TEXT_VIEW_STYLE = 'AppTextView'

// Apps targeting Android 15+ get TextViews that break lines by glyph bounds,
// while React Native measures text by advances. A label sized to its measured
// width then wraps its last word onto a clipped second line, so keep TextViews
// on advances to match React Native's measurement.
const withAndroidTextAdvanceWidth = (config) =>
  withAndroidStyles(config, (config) => {
    const withTextViewStyle = AndroidConfig.Styles.assignStylesValue(
      config.modResults,
      {
        add: true,
        parent: {name: TEXT_VIEW_STYLE, parent: 'Widget.AppCompat.TextView'},
        name: 'android:useBoundsForWidth',
        value: 'false',
        targetApi: '35',
      }
    )
    config.modResults = AndroidConfig.Styles.assignStylesValue(
      withTextViewStyle,
      {
        add: true,
        parent: AndroidConfig.Styles.getAppThemeGroup(),
        name: 'android:textViewStyle',
        value: `@style/${TEXT_VIEW_STYLE}`,
      }
    )
    return config
  })

module.exports = withAndroidTextAdvanceWidth
