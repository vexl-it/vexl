import '@testing-library/jest-native/extend-expect'

jest.mock('./src/utils/localization/I18nProvider', () => ({
  useTranslation: () => ({t: (key:any ) => key}),
}))
