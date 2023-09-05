const VERSION_CODE = 64
const VERSION = '1.3.1'
const ENV_PRESET = process.env.ENV_PRESET

const presets = {
  stage: {
    enableHiddenFeatures: true,
    apiPreset: 'stageEnv',
    versionCode: VERSION_CODE,
    version: `${VERSION} (${VERSION_CODE})`,
    packageName: 'it.vexl.nextstaging',
    appName: 'Vexl 2.0 (stage)',
    googleServicesInfoPlistFile: './creds/GoogleService-stage-info.plist',
    foregroundImage: './assets/android-front.png',
    backgroundImage: './assets/android-back-stage.png',
    icon: './assets/icon-stage.png',
    hmacPassword: 'VexlVexl',
  },
  prod: {
    enableHiddenFeatures: false,
    apiPreset: 'prodEnv',
    versionCode: VERSION_CODE,
    version: `${VERSION} (${VERSION_CODE})`,
    packageName: 'it.vexl.next',
    appName: 'Vexl 2.0',
    googleServicesInfoPlistFile: './creds/GoogleService-Info.plist',
    foregroundImage: './assets/android-front-next.png',
    backgroundImage: './assets/android-back.png',
    icon: './assets/icon-next.png',
    hmacPassword:
      '9cf02ca3b233f17160e71b0db098f95396e73f27ef672dda482a6566d8e29484',
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
  'splash': {
    'image': './assets/splash.png',
    'resizeMode': 'contain',
    'backgroundColor': '#FCCD6C',
  },
  'updates': {
    'fallbackToCacheTimeout': 0,
    'url': 'https://u.expo.dev/8a2b78bf-b758-42b9-947a-c6201cb7cc59',
  },
  'assetBundlePatterns': ['**/*'],
  'ios': {
    buildNumber: String(VERSION_CODE),
    'supportsTablet': false,
    'bundleIdentifier': extra.packageName,
    'config': {
      'usesNonExemptEncryption': false,
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
      },
    ],
    '@react-native-firebase/app',
    '@react-native-firebase/crashlytics',
    '@react-native-firebase/dynamic-links',
    '@notifee/react-native',
    './expo-plugins/disable-firebase-analytics.js',
    './expo-plugins/setup-headless-background-message-processing-ios.js',
    'react-native-background-fetch',
  ],

  'extra': {
    'eas': {
      'projectId': 'dbcc5b47-6c4a-4faf-a345-e9cd8a680c32',
    },
    ...extra,
  },
}
