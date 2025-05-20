/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts'],
  transform: {
    '^.+\\.tsx?$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-typescript'] }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/out/',
    '\\.d\\.ts$'
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!sanitize-html)'
  ]
}; 