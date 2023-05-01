const VERSION_CODE = 2
const VERSION = '0.0.1'

export default {
  'expo': {
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
      buildNumber: VERSION_CODE,
      'supportsTablet': false,
      'bundleIdentifier': 'it.vexl.next',
      'config': {
        'usesNonExemptEncryption': false,
      },
      'infoPlist': {
        'UIBackgroundModes': ['fetch', 'remote-notification'],
      },
      'googleServicesFile': './creds/GoogleService-Info.plist',
    },
    'android': {
      buildNumber: VERSION_CODE,
      'softwareKeyboardLayoutMode': 'resize',
      'adaptiveIcon': {
        'foregroundImage': './assets/android-front.png',
        'backgroundImage': './assets/android-back.png',
      },
      'package': 'it.vexl.next',
      'permissions': ['android.permission.RECORD_AUDIO'],
      'googleServicesFile': './creds/google-services.json',
    },
    'web': {
      'favicon': './assets/favicon.png',
    },
    'extra': {
      'eas': {
        'projectId': 'dbcc5b47-6c4a-4faf-a345-e9cd8a680c32',
      },
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
            'The app accesses your photos to let you share them with your friends.',
          'cameraPermission':
            'The app accesses your camera to let you take photos and videos.',
        },
      ],
      [
        'expo-contacts',
        {
          'contactsPermission':
            'Allow $(PRODUCT_NAME) to access your contacts.',
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
  },
  'extra': {
    enableHiddenFeatures: process.env.ENABLE_HIDDEN_FEATURES === 'true',
    apiPreset: process.env.apiPreset ?? 'stageEnv',
    version: `${VERSION} (${VERSION_CODE})`,
  },
}
