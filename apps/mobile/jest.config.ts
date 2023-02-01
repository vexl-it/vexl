import {Config} from '@jest/types'

const config: Config.InitialOptions = {
  verbose: true,
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|i18n-js)',
  ],
  setupFilesAfterEnv: ['./jest.setup.ts'],
  moduleDirectories: ['node_modules', 'utils', 'src'],
}

export default config
