/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
    '<rootDir>/tests/unit/**/*.test.tsx',
    '<rootDir>/tests/components/**/*.test.tsx',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Stub CSS imports
    '\\.(css|scss)$': '<rootDir>/tests/__mocks__/styleMock.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
