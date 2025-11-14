/**
 * Vitest Setup File
 * Runs before all tests
 */

import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { setupTestEnv, resetTestEnv } from './setup/test.env.js';

// Import mock helpers
import * as SessionMocks from './setup/shopify-session.mock.js';
import * as APIMocks from './setup/shopify-api.mock.js';
import * as DBHelpers from './setup/db.helper.js';

// Setup environment variables for tests
setupTestEnv();

// Mock console methods to reduce noise in tests (optional)
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   log: vi.fn(),
//   debug: vi.fn(),
//   info: vi.fn(),
//   warn: vi.fn(),
//   error: vi.fn(),
// };

// Setup before all tests
beforeAll(() => {
  // Ensure test environment is ready
  setupTestEnv();
});

// Cleanup after each test
afterEach(async () => {
  // Clear all mocks after each test
  vi.clearAllMocks();
  vi.restoreAllMocks();

  // Clean database tables after each test (optional - uncomment if needed)
  // await DBHelpers.cleanAllTables();
});

// Cleanup after all tests
afterAll(async () => {
  // Reset environment
  resetTestEnv();

  // Disconnect database
  await DBHelpers.disconnectDatabase();
});

// Mock fetch globally if needed
global.fetch = vi.fn();

// Export mock helpers
export const mockFetch = (response) => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => response,
    text: async () => JSON.stringify(response),
    status: 200,
    statusText: 'OK',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  });
};

export const mockFetchError = (error) => {
  global.fetch.mockRejectedValueOnce(error);
};

export const mockFetchWithStatus = (response, status = 200) => {
  global.fetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    json: async () => response,
    text: async () => JSON.stringify(response),
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  });
};

// Re-export Shopify mocks for easy access
export {
  // Session mocks
  SessionMocks,
  // API mocks
  APIMocks,
};

// Export commonly used mocks directly
export const {
  createMockSession,
  createOnlineSession,
  createOfflineSession,
  createMockAdminAPI: createMockAdmin,
  mockAuthenticateAdmin,
  createAuthenticateMock,
} = SessionMocks;

export const {
  mockGraphQLResponse,
  mockProductsQuery,
  mockDiscountAutomaticAppCreate,
  mockDiscountAutomaticAppUpdate,
  mockDiscountAutomaticDelete,
  mockAutomaticDiscountsQuery,
  mockGraphQLError,
  mockAuthenticate,
} = APIMocks;

// Re-export Database helpers
export {
  // Database helpers
  DBHelpers,
};

// Export commonly used DB helpers directly
export const {
  getPrismaClient,
  resetDatabase,
  cleanTable,
  cleanAllTables,
  seedDiscounts,
  seedSessions,
  seedAll,
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getAllSessions,
  getSessionById,
  createSession,
  disconnectDatabase,
  countRecords,
  isDatabaseEmpty,
} = DBHelpers;
