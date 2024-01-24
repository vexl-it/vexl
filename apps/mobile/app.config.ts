// import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'

const VERSION_CODE = 108
const VERSION = '1.13.0'
const ENV_PRESET = process.env.ENV_PRESET
const COMMIT_HASH = process.env.EAS_BUILD_GIT_COMMIT_HASH ?? 'local'

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
    appName: 'Vexl 2.0 (stage)',
    googleServicesInfoPlistFile: './creds/GoogleService-stage-info.plist',
    foregroundImage: './assets/android-front.png',
    backgroundImage: './assets/android-back-stage.png',
    icon: './assets/icon-stage.png',
    hmacPassword:
      'UHQyykWs4nE1Yn8IQi/lsz2QemK3zA+JIWdGll3PEtle9/aMMBvQk6kKgYkjyewTiK0ypuquBSBVJwuSiYs8FQ==',
    commitHash: COMMIT_HASH,
  },
  prod: {
    enableHiddenFeatures: false,
    apiPreset: 'prodEnv',
    versionCode: VERSION_CODE,
    version: `${VERSION} (${VERSION_CODE})`,
    semver: VERSION,
    packageName: 'it.vexl.next',
    appName: 'Vexl 2.0',
    googleServicesInfoPlistFile: './creds/GoogleService-Info.plist',
    foregroundImage: './assets/android-front-next.png',
    backgroundImage: './assets/android-back.png',
    icon: './assets/icon-next.png',
    hmacPassword:
      'rv5AKXDcED4txmI5Nltz9eZFAHOI1VrLT3JWOpEZefE5uGInq53rfHkQLUIjaMUHv3hicbk/wtSKOfsNZ3aNNw==',
    commitHash: COMMIT_HASH,
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
      'FirebaseDynamicLinksCustomDomains': [
        'https://link.vexl.it',
        'https://nextlink.vexl.it',
      ],
      'BGTaskSchedulerPermittedIdentifiers': ['com.transistorsoft.fetch'],
    },
    'googleServicesFile': extra.googleServicesInfoPlistFile,
    'associatedDomains': ['applinks:link.vexl.it', 'applinks:nextlink.vexl.it'],
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
        'action': 'VIEW',
        'autoVerify': true,
        'data': [
          {
            'scheme': 'https',
            'host': 'vexl.it',
            'pathPrefix': '/',
          },
          {
            'scheme': 'https',
            'host': 'link.vexl.it',
            'pathPrefix': '/',
          },
          {
            'scheme': 'https',
            'host': 'nextlink.vexl.it',
            'pathPrefix': '/',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  'web': {
    'favicon': './assets/favicon.png',
  },
  'owner': 'vexlit',
  'runtimeVersion': {
    'policy': 'sdkVersion',
  },
  'plugins': [
    [
      'expo-barcode-scanner',
      {
        'cameraPermission':
          'Vexl needs access to your camera to add contact via scanning qrcode',
      },
    ],
    'expo-localization',
    [
      'expo-image-picker',
      {
        'photosPermission':
          'Vexl wants to access your camera in order to select a photo for your avatar.',
        'cameraPermission':
          'Vexl wants to access your camera in order to take a photo for your avatar.',
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
        'authToken': process.env.SENTRY_AUTH_TOKEN,
        'project': 'vexl-app',
        'organization': 'vexl',
      },
    ],
    '@react-native-firebase/app',
    '@react-native-firebase/dynamic-links',
    './expo-plugins/disable-firebase-analytics.js',
    './expo-plugins/setup-headless-background-message-processing-ios.js',
    'expo-font',
    'expo-secure-store',
  ],

  'extra': {
    'eas': {
      'projectId': 'dbcc5b47-6c4a-4faf-a345-e9cd8a680c32',
    },
    ...extra,
  },
}
