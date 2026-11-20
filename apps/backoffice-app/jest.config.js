const nextJest = require('next/jest')

const createJestConfig = nextJest({dir: './'})

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {'^@/(.*)$': '<rootDir>/$1'},
  testTimeout: 60_000,
}

module.exports = createJestConfig(config)
