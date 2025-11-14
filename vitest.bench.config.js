/**
 * Vitest Benchmark Configuration
 * Separate config for performance testing
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Benchmark-specific configuration
    benchmark: {
      include: ['tests/benchmarks/**/*.bench.js'],
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

      // Benchmark output configuration
      reporters: ['default', 'verbose'],

      // Benchmark execution configuration
      outputFile: {
        json: './benchmarks/results.json',
        html: './benchmarks/results.html',
      },
    },

    // Test environment
    environment: 'node',

    // Global setup/teardown
    globalSetup: './vitest.global-setup.js',

    // Timeout for benchmarks (longer than regular tests)
    testTimeout: 60000, // 60 seconds

    // Hooks timeout
    hookTimeout: 30000, // 30 seconds
  },
});
