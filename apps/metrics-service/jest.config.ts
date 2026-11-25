import type {JestConfigWithTsJest} from 'ts-jest'

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  verbose: true,

  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.afterenv.ts'],

  testTimeout: 60_000,
  // hpke and noble ship ESM only
  transformIgnorePatterns: [
    '/node_modules/(?!(hpke|@panva/hpke-noble|@noble)/)',
  ],
  testMatch: ['**/*.test.ts'],
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
