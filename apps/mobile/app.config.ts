const VERSION_CODE = 3
const VERSION = '1.0.4'
const ENV_PRESET = process.env.ENV_PRESET

const extra =
  ENV_PRESET === 'stage'
    ? {
        enableHiddenFeatures: true,
        apiPreset: 'stageEnv',
        version: `${VERSION} (${VERSION_CODE})`,
        packageName: 'it.vexl.next',
        appName: 'Vexl Next (stage)',
        googleServicesInfoPlistFile: './creds/GoogleService-stage-Info.plist',
      }
    : {
        enableHiddenFeatures: false,
        apiPreset: 'prodEnv',
        version: `${VERSION} (${VERSION_CODE})`,
        packageName: 'it.vexl.next',
        appName: 'Vexl Next',
        googleServicesInfoPlistFile: './creds/GoogleService-Info.plist',
      }

export default {
  'name': 'Vexl next',
  'slug': 'vexl',
  'version': VERSION,
  'orientation': 'portrait',
  'icon': './assets/icon.png',
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
      'UIBackgroundModes': ['fetch', 'remote-notification'],
    },
    'googleServicesFile': extra.googleServicesInfoPlistFile,
  },
  'android': {
    versionCode: VERSION_CODE,
    'softwareKeyboardLayoutMode': 'resize',
    'adaptiveIcon': {
      'foregroundImage': './assets/android-front.png',
      'backgroundImage': './assets/android-back.png',
    },
    'package': extra.packageName,
    'googleServicesFile': './creds/google-services.json',
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
          'Vexl needs access to your contacts to make your offers visible for them in a secure way.',
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
    '@notifee/react-native',
    './expo-plugins/disable-firebase-analytics.js',
    './expo-plugins/setup-headless-background-message-processing-ios.js',
  ],

  'extra': {
    'eas': {
      'projectId': 'dbcc5b47-6c4a-4faf-a345-e9cd8a680c32',
    },
    ...extra,
  },
}
