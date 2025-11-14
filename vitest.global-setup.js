/**
 * Vitest Global Setup
 * Runs once before all test suites
 * Use for expensive operations like database setup
 */

import { setupTestEnv } from './tests/setup/test.env.js';
import { resetDatabase } from './tests/setup/db.helper.js';

export async function setup() {
  console.log('🔧 Setting up test environment...');

  // Setup test environment variables
  setupTestEnv();

  // Reset test database to clean state
  try {
    await resetDatabase();
    console.log('📊 Test database reset');
  } catch (error) {
    console.warn('⚠️  Database reset skipped (DB may not exist yet):', error.message);
  }

  console.log('✅ Test environment ready');
}

export async function teardown() {
  console.log('🧹 Cleaning up test environment...');

  // Disconnect database
  try {
    const { disconnectDatabase } = await import('./tests/setup/db.helper.js');
    await disconnectDatabase();
  } catch (error) {
    console.warn('⚠️  Database disconnect skipped:', error.message);
  }

  console.log('✅ Test environment cleaned up');
}
