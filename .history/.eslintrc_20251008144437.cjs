/**
 * This is intended to be a basic starting point for linting in your app.
 * It relies on recommended configs out of the box for simplicity, but you can
 * and should modify this configuration to best suit your team's needs.
 */

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    '@shopify/eslint-plugin/react'
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    'react', 
    'react-hooks', 
    '@typescript-eslint', 
    'import', 
    '@shopify'
  ],
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      typescript: {}
    }
  },
  rules: {
    // Customize rules as needed
    'react/prop-types': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'import/no-unresolved': 'error',
    'import/order': ['error', {
      'groups': [
        'builtin', 
        'external', 
        'internal', 
        'parent', 
        'sibling', 
        'index'
      ],
      'newlines-between': 'always'
    }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'react/react-in-jsx-scope': 'off'
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  ignorePatterns: [
    'node_modules/', 
    'build/', 
    'dist/', 
    'coverage/',
    '.eslintrc.cjs'
  ]
};
