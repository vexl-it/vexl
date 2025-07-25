// import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'

const VERSION_CODE = 510
const VERSION = '1.31.6'
const ENV_PRESET = process.env.ENV_PRESET
const COMMIT_HASH = process.env.EAS_BUILD_GIT_COMMIT_HASH ?? 'local'
const APP_SOURCE = process.env.APP_SOURCE ?? 'local'

// // check if version is valid
// SemverString.parse(VERSION)

const presets = {
  stage: {
    enableHiddenFeatures: true,
    apiPreset: 'stageEnv',
    versionCode: VERSION_CODE,
    semver: VERSION,
    version: `${VERSION} (${VERSION_CODE})`,
    packageName: 'it.vexl.nextstaging',
    appName: 'Vexl (stage)',
    googleServicesInfoPlistFile: './creds/GoogleService-stage-info.plist',
    foregroundImage: './assets/android-front.png',
    backgroundImage: './assets/android-back-stage.png',
    icon: './assets/icon-stage.png',
    hmacPassword:
      'UHQyykWs4nE1Yn8IQi/lsz2QemK3zA+JIWdGll3PEtle9/aMMBvQk6kKgYkjyewTiK0ypuquBSBVJwuSiYs8FQ==',
    commitHash: COMMIT_HASH,
    appSource: APP_SOURCE,
  },
  prod: {
    enableHiddenFeatures: false,
    apiPreset: 'prodEnv',
    versionCode: VERSION_CODE,
    version: `${VERSION} (${VERSION_CODE})`,
    semver: VERSION,
    packageName: 'it.vexl.next',
    appName: 'Vexl',
    googleServicesInfoPlistFile: './creds/GoogleService-Info.plist',
    foregroundImage: './assets/android-front.png',
    backgroundImage: './assets/android-back.png',
    icon: './assets/icon.png',
    hmacPassword:
      'rv5AKXDcED4txmI5Nltz9eZFAHOI1VrLT3JWOpEZefE5uGInq53rfHkQLUIjaMUHv3hicbk/wtSKOfsNZ3aNNw==',
    commitHash: COMMIT_HASH,
    appSource: APP_SOURCE,
  },
}

// @ts-expect-error there is fallback there.
const extra = presets[String(ENV_PRESET)] ?? presets.stage

export default {
  'name': extra.appName,
  'slug': 'vexl',
  'version': VERSION,
  'orientation': 'portrait',
  'icon': extra.icon,
  'userInterfaceStyle': 'light',
  'jsEngine': 'hermes',
  'newArchEnabled': false,
  'scheme': 'app.vexl.it',
  'platforms': ['ios', 'android'],
  'splash': {
    'image': './assets/splash.png',
    'resizeMode': 'contain',
    'backgroundColor': '#FCCD6C',
  },
  'updates': {
    'fallbackToCacheTimeout': 0,
    'url': 'https://u.expo.dev/dbcc5b47-6c4a-4faf-a345-e9cd8a680c32',
  },
  'assetBundlePatterns': ['**/*'],
  'ios': {
    buildNumber: String(VERSION_CODE),
    'supportsTablet': false,
    'bundleIdentifier': extra.packageName,
    'config': {
      'usesNonExemptEncryption': false,
      'googleMapsApiKey': process.env.IOS_MAP_API_KEY,
    },
    'infoPlist': {
      'UIBackgroundModes': ['fetch', 'remote-notification', 'processing'],
      'LSApplicationQueriesSchemes': ['itms-apps'],
      'BGTaskSchedulerPermittedIdentifiers': ['com.transistorsoft.fetch'],
      'CFBundleAllowMixedLocalizations': true,
      'NSLocationWhenInUseUsageDescription':
        'Vexl needs access to you location to show your position on the map. Location will never be share with anyone (even ourselves).',
      // 'NSAppTransportSecurity': {'NSAllowsArbitraryLoads': true},
    },
    'googleServicesFile': extra.googleServicesInfoPlistFile,
    'associatedDomains': [
      'applinks:vexl.it',
      'applinks:app.vexl.it',
      'applinks:link.vexl.it',
      'applinks:nextlink.vexl.it',
    ],
    'privacyManifests': {
      'NSPrivacyAccessedAPITypes': [
        {
          'NSPrivacyAccessedAPIType':
            'NSPrivacyAccessedAPICategoryUserDefaults',
          'NSPrivacyAccessedAPITypeReasons': ['CA92.1'],
        },
      ],
    },
    'entitlements': {
      'aps-environment':
        process.env.NODE_ENV === 'development' ? 'development' : 'production',
    },
  },
  'android': {
    'versionCode': VERSION_CODE,
    'softwareKeyboardLayoutMode': 'resize',
    'adaptiveIcon': {
      'foregroundImage': extra.foregroundImage,
      'backgroundImage': extra.backgroundImage,
    },
    'config': {
      'googleMaps': {
        'apiKey': process.env.ANDROID_MAP_API_KEY,
      },
    },
    'package': extra.packageName,
    'googleServicesFile': './creds/google-services.json',
    'intentFilters': [
      {
        // NDEF_DISCOVERED nfc action is not supported by expo app config
        // wee need to change it in expo-plugin after
        // from android.intent.action.NDEF_DISCOVERED -> android.nfc.action.NDEF_DISCOVERED
        // see: expo-plugins/android-manifest-nfc-action-plugin.js
        'action': 'NDEF_DISCOVERED',
        'autoVerify': true,
        'data': [
          {
            'scheme': 'https',
            'host': 'app.vexl.it',
            'pathPattern': '/link/.*',
          },
        ],
        'category': ['DEFAULT'],
      },
      {
        'action': 'VIEW',
        'autoVerify': true,
        'data': [
          {
            'scheme': 'https',
            'host': 'vexl.it',
            'pathPattern': '.*',
          },
          {
            'scheme': 'https',
            'host': 'link.vexl.it',
            'pathPattern': '.*',
          },
          {
            'scheme': 'https',
            'host': 'nextlink.vexl.it',
            'pathPattern': '.*',
          },
          {
            'scheme': 'https',
            'host': 'app.vexl.it',
            'pathPattern': '.*',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
    permissions: ['READ_CONTACTS', 'READ_CALENDAR', 'WRITE_CALENDAR', 'NFC'],
    blockedPermissions: [
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
    ],
  },
  'locales': {
    'bg': '../../packages/localization/bg-infoPlist.json',
    'cs': '../../packages/localization/cs-infoPlist.json',
    'de': '../../packages/localization/de-infoPlist.json',
    'en': '../../packages/localization/en-infoPlist.json',
    'es': '../../packages/localization/es-infoPlist.json',
    'fr': '../../packages/localization/fr-infoPlist.json',
    'it': '../../packages/localization/it-infoPlist.json',
    'ja': '../../packages/localization/ja-infoPlist.json',
    'pl': '../../packages/localization/pl-infoPlist.json',
    'pt': '../../packages/localization/pt-infoPlist.json',
    'sk': '../../packages/localization/sk-infoPlist.json',
  },
  'owner': 'vexlit',
  'runtimeVersion': {
    'policy': 'sdkVersion',
  },
  'plugins': [
    ['expo-notifications', {enableBackgroundRemoteNotifications: true}],
    'expo-localization',
    [
      'expo-image-picker',
      {
        'photosPermission':
          'Vexl wants to access your photos in order to select a picture for your avatar.',
        'cameraPermission':
          'Vexl wants to access your camera in order to take a photo for your avatar or scan QR code to add other users to your Vexl network.',
        'microphonePermission': false,
      },
    ],
    [
      'expo-contacts',
      {
        'contactsPermission':
          'Vexl needs access to your contacts to make your offers visible for them in a secure way. Phone number of contacts you select will be encrypted and uploaded to the server.',
      },
    ],
    [
      'expo-calendar',
      {
        'calendarPermission':
          'Vexl needs access to your calendar for scheduling trade meetings. Your data is kept private and only used for coordinating trades.',
      },
    ],
    [
      'expo-build-properties',
      {
        'ios': {
          'useFrameworks': 'static',
        },
        'android': {
          // Notifee workaround: https://github.com/invertase/notifee/issues/808
          'extraMavenRepos': [
            '../../node_modules/@notifee/react-native/android/libs',
          ],
          'packagingOptions': {
            'pickFirst': [
              'lib/x86/libcrypto.so',
              'lib/x86_64/libcrypto.so',
              'lib/armeabi-v7a/libcrypto.so',
              'lib/arm64-v8a/libcrypto.so',
            ],
          },
        },
      },
    ],
    [
      '@sentry/react-native/expo',
      {
        'url': 'https://sentry.io/',
        'project': 'vexl-app',
        'organization': 'vexl',
      },
    ],
    '@react-native-firebase/app',
    './expo-plugins/disable-firebase-analytics.js',
    './expo-plugins/android-manifest-nfc-action-plugin.js',
    'expo-font',
    'expo-secure-store',
    'expo-camera',
    [
      'react-native-capture-protection',
      {
        'captureType': 'fullMediaCapture',
      },
    ],
  ],

  'extra': {
    'eas': {
      'projectId': 'dbcc5b47-6c4a-4faf-a345-e9cd8a680c32',
    },
    ...extra,
  },
}
