/**
 * iOS Notification Service Extension enriching chat push notifications with
 * decrypted message previews (see apps/mobile/native/VexlNotificationCore).
 *
 * The swift-secp256k1 SPM dependency is linked into this target by the
 * companion config plugin apps/mobile/expo-plugins/with-nse-local-spm.js,
 * which must be registered in app.config.ts BEFORE '@bacons/apple-targets'.
 */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'notification-service',
  name: 'VexlNSE',
  // Dot prefix: appended to the main app bundle identifier
  // (it.vexl.next.nse / it.vexl.nextstaging.nse).
  bundleIdentifier: '.nse',
  // Match the app's iOS deployment target (ios/Podfile default for SDK 57).
  deploymentTarget: '16.4',
  frameworks: ['UserNotifications'],
  entitlements: {
    // The app group doubles as the keychain access group at runtime (iOS
    // accepts app-group ids in kSecAttrAccessGroup without a team prefix).
    'com.apple.security.application-groups': [
      `group.${config.ios.bundleIdentifier}.shared`,
    ],
  },
})
