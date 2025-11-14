/**
 * Shopify Session Mocks
 * Provides mock Shopify session objects for testing
 */

import { vi } from 'vitest';

/**
 * Create a mock Shopify session
 * @param {Object} overrides - Override default session values
 * @returns {Object} Mock session object
 */
export function createMockSession(overrides = {}) {
  return {
    id: overrides.id || 'test_session_id_12345',
    shop: overrides.shop || 'test-shop.myshopify.com',
    state: overrides.state || 'test_state_12345',
    isOnline: overrides.isOnline ?? false,
    scope: overrides.scope || 'write_products,write_discounts',
    expires: overrides.expires || new Date(Date.now() + 86400000), // 24 hours from now
    accessToken: overrides.accessToken || 'test_access_token_12345',
    userId: overrides.userId || '1234567890',
    firstName: overrides.firstName || 'Test',
    lastName: overrides.lastName || 'User',
    email: overrides.email || 'test@example.com',
    accountOwner: overrides.accountOwner ?? true,
    locale: overrides.locale || 'en',
    collaborator: overrides.collaborator ?? false,
    emailVerified: overrides.emailVerified ?? true,
    ...overrides,
  };
}

/**
 * Create an online session (for customer-specific operations)
 */
export function createOnlineSession(overrides = {}) {
  return createMockSession({
    isOnline: true,
    ...overrides,
  });
}

/**
 * Create an offline session (for background jobs)
 */
export function createOfflineSession(overrides = {}) {
  return createMockSession({
    isOnline: false,
    id: `offline_${overrides.shop || 'test-shop.myshopify.com'}`,
    ...overrides,
  });
}

/**
 * Mock authenticate.admin() function
 * @param {Object} options - Configuration options
 * @returns {Object} Mock authentication result
 */
export function mockAuthenticateAdmin(options = {}) {
  const session = options.session || createMockSession();
  const admin = options.admin || createMockAdminAPI();

  return {
    authenticate: {
      admin: vi.fn().mockResolvedValue({
        session,
        admin,
      }),
    },
  };
}

/**
 * Create a mock Admin API object
 * @param {Object} overrides - Override default API methods
 * @returns {Object} Mock Admin API
 */
export function createMockAdminAPI(overrides = {}) {
  return {
    graphql: vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        data: {},
        errors: null,
      }),
    }),
    rest: {
      get: vi.fn().mockResolvedValue({ body: {} }),
      post: vi.fn().mockResolvedValue({ body: {} }),
      put: vi.fn().mockResolvedValue({ body: {} }),
      delete: vi.fn().mockResolvedValue({ body: {} }),
    },
    ...overrides,
  };
}

/**
 * Session storage mock
 */
export const mockSessionStorage = {
  storeSession: vi.fn().mockResolvedValue(true),
  loadSession: vi.fn().mockResolvedValue(createMockSession()),
  deleteSession: vi.fn().mockResolvedValue(true),
  deleteSessions: vi.fn().mockResolvedValue(true),
  findSessionsByShop: vi.fn().mockResolvedValue([createMockSession()]),
};

/**
 * Mock authenticate function for routes
 */
export function createAuthenticateMock() {
  return vi.fn().mockResolvedValue({
    session: createMockSession(),
    admin: createMockAdminAPI(),
  });
}

export default {
  createMockSession,
  createOnlineSession,
  createOfflineSession,
  mockAuthenticateAdmin,
  createMockAdminAPI,
  mockSessionStorage,
  createAuthenticateMock,
};
