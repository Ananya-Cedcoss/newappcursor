/**
 * Mock Usage Examples
 * Demonstrates how to use the various mocks
 */

import { describe, it, expect, vi } from 'vitest';
import {
  // Session mocks
  createMockSession,
  createOnlineSession,
  createOfflineSession,

  // API mocks
  createMockAdmin,
  mockAuthenticate,
  mockGraphQLResponse,
  mockDiscountAutomaticAppCreate,
  mockProductsQuery,

  // Fetch mocks
  mockFetch,
  mockFetchError,
  mockFetchWithStatus,
} from '../setup.js';

describe('Mock Usage Examples', () => {
  describe('Session Mocks', () => {
    it('Example: Create default session', () => {
      const session = createMockSession();

      console.log('Session:', session);
      expect(session.shop).toBe('test-shop.myshopify.com');
    });

    it('Example: Create custom session', () => {
      const session = createMockSession({
        shop: 'my-store.myshopify.com',
        email: 'admin@mystore.com',
      });

      expect(session.shop).toBe('my-store.myshopify.com');
      expect(session.email).toBe('admin@mystore.com');
    });

    it('Example: Create online session', () => {
      const session = createOnlineSession();

      expect(session.isOnline).toBe(true);
    });

    it('Example: Create offline session', () => {
      const session = createOfflineSession({ shop: 'my-store.myshopify.com' });

      expect(session.isOnline).toBe(false);
      expect(session.id).toContain('offline_');
    });
  });

  describe('Admin API Mocks', () => {
    it('Example: Create mock admin API', async () => {
      const admin = createMockAdmin();

      const response = await admin.graphql('query Test');
      const data = await response.json();

      expect(admin.graphql).toHaveBeenCalled();
      expect(data).toBeDefined();
    });

    it('Example: Mock products query', async () => {
      const admin = createMockAdmin();

      const products = [
        { id: 'gid://shopify/Product/1', title: 'T-Shirt' },
        { id: 'gid://shopify/Product/2', title: 'Jeans' },
      ];

      admin.graphql.mockResolvedValueOnce(mockProductsQuery(products));

      const response = await admin.graphql('query { products }');
      const data = await response.json();

      expect(data.data.products.edges).toHaveLength(2);
      expect(data.data.products.edges[0].node.title).toBe('T-Shirt');
    });

    it('Example: Mock discount creation', async () => {
      const admin = createMockAdmin();

      admin.graphql.mockResolvedValueOnce(
        mockDiscountAutomaticAppCreate({
          title: 'Summer Sale',
          status: 'ACTIVE',
        })
      );

      const response = await admin.graphql('mutation CreateDiscount');
      const data = await response.json();

      expect(data.data.discountAutomaticAppCreate.automaticAppDiscount.title).toBe('Summer Sale');
    });
  });

  describe('Authenticate Mock', () => {
    it('Example: Mock authenticate function', async () => {
      const authenticate = mockAuthenticate();

      const { session, admin } = await authenticate();

      expect(session).toBeDefined();
      expect(admin).toBeDefined();
      expect(session.shop).toBe('test-shop.myshopify.com');
    });

    it('Example: Mock authenticate with custom data', async () => {
      const customSession = createMockSession({ shop: 'custom.myshopify.com' });
      const authenticate = mockAuthenticate({ session: customSession });

      const { session } = await authenticate();

      expect(session.shop).toBe('custom.myshopify.com');
    });
  });

  describe('Fetch Mocks', () => {
    it('Example: Mock successful fetch', async () => {
      mockFetch({ success: true, data: 'test' });

      const response = await fetch('/api/test');
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toBe('test');
    });

    it('Example: Mock fetch error', async () => {
      mockFetchError(new Error('Network error'));

      await expect(fetch('/api/test')).rejects.toThrow('Network error');
    });

    it('Example: Mock fetch with specific status', async () => {
      mockFetchWithStatus({ error: 'Not found' }, 404);

      const response = await fetch('/api/test');

      expect(response.status).toBe(404);
      expect(response.ok).toBe(false);

      const data = await response.json();
      expect(data.error).toBe('Not found');
    });
  });

  describe('Complete Example: Testing API Route', () => {
    it('Example: Full API route test', async () => {
      // Setup
      const authenticate = mockAuthenticate();
      const { admin } = await authenticate();

      // Mock the discount creation
      admin.graphql.mockResolvedValueOnce(
        mockDiscountAutomaticAppCreate({
          id: 'gid://shopify/DiscountAutomaticApp/123',
          title: 'Test Discount',
          status: 'ACTIVE',
        })
      );

      // Simulate API call
      mockFetch({
        success: true,
        discount: {
          id: '123',
          name: 'Test Discount',
        },
      });

      const response = await fetch('/api/discounts', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Discount',
          type: 'percentage',
          value: 20,
          productIds: ['123'],
        }),
      });

      const result = await response.json();

      // Assertions
      expect(result.success).toBe(true);
      expect(result.discount).toBeDefined();
    });
  });

  describe('Testing Best Practices', () => {
    it('Example: Using vi.fn() for custom mocks', () => {
      const mockCallback = vi.fn();
      mockCallback('test');

      expect(mockCallback).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith('test');
    });

    it('Example: Mocking return values', () => {
      const mockFunction = vi.fn();
      mockFunction.mockReturnValue('mocked value');

      const result = mockFunction();

      expect(result).toBe('mocked value');
    });

    it('Example: Mocking async functions', async () => {
      const mockAsync = vi.fn();
      mockAsync.mockResolvedValue('async result');

      const result = await mockAsync();

      expect(result).toBe('async result');
    });

    it('Example: Checking call counts', () => {
      const mockFunction = vi.fn();

      mockFunction('first');
      mockFunction('second');
      mockFunction('third');

      expect(mockFunction).toHaveBeenCalledTimes(3);
    });
  });
});
