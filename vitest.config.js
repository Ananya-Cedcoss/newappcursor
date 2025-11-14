import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Environment configuration
    environment: 'happy-dom',

    // Global test settings
    globals: true,

    // Global setup/teardown (runs once for all test files)
    globalSetup: './vitest.global-setup.js',

    // Setup files to run before each test file
    setupFiles: ['./tests/setup.js', './tests/setup/rtl-setup.js'],

    // Include test files
    include: [
      'app/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'tests/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'extensions/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],

    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      'build',
      '.next',
      'coverage',
      '**/*.config.js',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.js',
        '**/*.config.ts',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/coverage/**',
        '**/*.d.ts',
        '**/types/**',
      ],
      // Coverage thresholds
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
      // Additional coverage options
      clean: true,
      cleanOnRerun: true,
      all: true,
    },

    // Test timeout
    testTimeout: 10000,

    // Hook timeouts
    hookTimeout: 10000,

    // Watch mode settings
    watch: false,

    // Reporter settings
    reporters: ['verbose'],

    // Mock settings
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },

  // Resolve aliases for Remix project structure
  resolve: {
    alias: {
      '~': resolve(__dirname, './app'),
      '@': resolve(__dirname, './app'),
      app: resolve(__dirname, './app'),
      tests: resolve(__dirname, './tests'),
      extensions: resolve(__dirname, './extensions'),
    },
  },

  // Define global variables
  define: {
    'import.meta.vitest': 'undefined',
  },
});
