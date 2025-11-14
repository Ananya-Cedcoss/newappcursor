/**
 * Test Environment Configuration
 * Mocks environment variables for testing
 */

// Mock environment variables
export const TEST_ENV = {
  // Node Environment
  NODE_ENV: 'test',

  // Shopify App Configuration
  SHOPIFY_API_KEY: 'test_api_key_12345',
  SHOPIFY_API_SECRET: 'test_api_secret_67890',
  SHOPIFY_APP_URL: 'https://test-app.example.com',
  SHOPIFY_SCOPES: 'write_products,write_discounts',

  // Shopify Function
  SHOPIFY_DISCOUNT_FUNCTION_ID: 'test-function-id-12345',

  // Database Configuration
  DATABASE_URL: 'file:./prisma/test.db',
  PRISMA_DATABASE_URL: 'file:./prisma/test.db',

  // Session Configuration
  SESSION_SECRET: 'test-session-secret-key-for-testing-only',

  // API Configuration
  API_VERSION: '2024-10',
  API_DOMAIN: 'test-shop.myshopify.com',

  // App Configuration
  HOST: 'test-app.example.com',
  PORT: '3000',

  // Feature Flags (if needed)
  ENABLE_TESTING: 'true',
  MOCK_SHOPIFY_API: 'true',
};

/**
 * Apply test environment variables to process.env
 */
export function setupTestEnv() {
  Object.entries(TEST_ENV).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

/**
 * Reset environment variables after tests
 */
export function resetTestEnv() {
  Object.keys(TEST_ENV).forEach((key) => {
    delete process.env[key];
  });
}

/**
 * Get a specific test environment variable
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} Environment variable value
 */
export function getTestEnv(key, defaultValue = '') {
  return process.env[key] || TEST_ENV[key] || defaultValue;
}

// Auto-apply on import
setupTestEnv();

export default TEST_ENV;
