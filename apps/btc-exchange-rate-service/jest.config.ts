import type {JestConfigWithTsJest} from 'ts-jest'

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  verbose: true,

  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.afterenv.ts'],

  testTimeout: 60_000,
  testMatch: ['**/*.test.ts'], // This line ensures only files with .test.ts suffix are run
  transform: {
    '^.+\\.(ts|js)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          rootDir: '../..',
          allowJs: true,
        },
      },
    ],
  },
}

export default config
