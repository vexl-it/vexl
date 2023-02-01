export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  roots: ['./src'],

  transform: {'\\.[jt]s?$': ['ts-jest', {tsconfig: {allowJs: true}}]},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.[jt]s$': '$1',
  },
}
