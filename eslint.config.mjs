////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////

import qubitConfig from '@qubit-ltd/eslint-config';
import babelParser from '@babel/eslint-parser';

export default [
  ...qubitConfig,
  {
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-env'],
          plugins: [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
          ],
        },
      },
      globals: {
        atob: 'readonly',
        btoa: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        FormData: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
  },
];
