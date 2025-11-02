module.exports = [
  {
    ignores: ['node_modules', '.next', 'out', 'dist', 'playwright-report', 'e2e'],

    files: ['**/*.{js,jsx,ts,tsx,cjs,mjs}'],

    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: { React: 'readonly' },
    },

    env: { browser: true, node: true, es2021: true, jest: true },

    plugins: { '@typescript-eslint': require('@typescript-eslint/eslint-plugin') },

    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],

    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',

      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
