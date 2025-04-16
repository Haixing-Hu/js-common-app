////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2023.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////

module.exports = {
  verbose: true,
  testMatch: ['**/test/**/*.test.js'],
  testEnvironment: 'jest-environment-jsdom-global',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
    resources: 'usable',
    runScripts: 'dangerously',
  },
  moduleFileExtensions: ['js'],
  transform: {
    '\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@qubit-ltd)',
  ],
  setupFilesAfterEnv: [
    'jest-extended/all',
  ],
  collectCoverage: true,
  coverageDirectory: './coverage',
  collectCoverageFrom: ['**/src/**/*.js'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/index\\.js$'
  ],
};
