/**
 * Integration Tests for Discount API Endpoints
 * Tests actual HTTP endpoints with Supertest + Vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import * as discountService from '../../app/models/discount.server.js';
import { loader, action } from '../../app/routes/api.discounts.jsx';
import * as shopifyServer from '../../app/shopify.server.js';
import { cleanAllTables } from '../setup/db.helper.js';

// Mock Shopify authentication
vi.mock('../../app/shopify.server.js', () => ({
  authenticate: {
    admin: vi.fn().mockResolvedValue({
      session: {
        shop: 'test-shop.myshopify.com',
        accessToken: 'test_token',
      },
      admin: {
        graphql: vi.fn(),
      },
    }),
  },
}));

// Helper function to create a mock Remix Request
function createMockRequest(url, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
  } = options;

  const requestUrl = url.startsWith('http') ? url : `http://localhost${url}`;

  const requestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  return new Request(requestUrl, requestInit);
}

// Helper function to parse Response
async function parseResponse(response) {
  const data = await response.json();
  return {
    status: response.status,
    data,
  };
}

describe('Discount API Integration Tests', () => {
  beforeEach(async () => {
    await cleanAllTables();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanAllTables();
  });

  describe('GET /api/discounts', () => {
    it('should return empty array when no discounts exist', async () => {
      const mockRequest = createMockRequest('/api/discounts');
      const response = await loader({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.discounts).toEqual([]);
      expect(data.count).toBe(0);
    });

    it('should return all discounts', async () => {
      // Create test data
      await discountService.createDiscount({
        name: 'Summer Sale',
        type: 'percentage',
        value: 20,
        productIds: ['prod_1', 'prod_2'],
      });
      await discountService.createDiscount({
        name: 'Winter Discount',
        type: 'fixed',
        value: 10,
        productIds: ['prod_3'],
      });

      const mockRequest = createMockRequest('/api/discounts');
      const response = await loader({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.discounts).toHaveLength(2);
      expect(data.count).toBe(2);
      expect(data.discounts[0]).toHaveProperty('id');
      expect(data.discounts[0]).toHaveProperty('name');
      expect(data.discounts[0]).toHaveProperty('type');
      expect(data.discounts[0]).toHaveProperty('value');
      expect(data.discounts[0]).toHaveProperty('productIds');
    });

    it('should return specific discount by ID', async () => {
      const created = await discountService.createDiscount({
        name: 'Test Discount',
        type: 'percentage',
        value: 15,
        productIds: ['prod_123'],
      });

      const mockRequest = createMockRequest(`/api/discounts?id=${created.id}`);
      const response = await loader({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.discount).toBeDefined();
      expect(data.discount.id).toBe(created.id);
      expect(data.discount.name).toBe('Test Discount');
      expect(data.discount.value).toBe(15);
    });

    it('should return 404 for non-existent discount ID', async () => {
      const mockRequest = createMockRequest('/api/discounts?id=non_existent_id');
      const response = await loader({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.error).toBe('Discount not found');
    });

    it('should require authentication', async () => {
      const mockRequest = createMockRequest('/api/discounts');
      await loader({ request: mockRequest });

      expect(shopifyServer.authenticate.admin).toHaveBeenCalledWith(mockRequest);
    });

    it('should handle database errors gracefully', async () => {
      vi.spyOn(discountService, 'getAllDiscounts').mockRejectedValue(
        new Error('Database connection failed')
      );

      const mockRequest = createMockRequest('/api/discounts');
      const response = await loader({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch discounts');
      expect(data.message).toBe('Database connection failed');
    });
  });

  describe('POST /api/discounts', () => {
    it('should create a new discount with valid data', async () => {
      const discountData = {
        name: 'Black Friday Sale',
        type: 'percentage',
        value: 25,
        productIds: ['prod_100', 'prod_200'],
      };

      const mockRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        body: discountData,
      });
      const response = await action({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Discount created successfully');
      expect(data.discount).toBeDefined();
      expect(data.discount.name).toBe('Black Friday Sale');
      expect(data.discount.type).toBe('percentage');
      expect(data.discount.value).toBe(25);
      expect(data.discount.id).toBeDefined();

      // Verify it was actually created in database
      const discounts = await discountService.getAllDiscounts();
      expect(discounts).toHaveLength(1);
    });

    it('should create a fixed discount', async () => {
      const discountData = {
        name: '$5 Off',
        type: 'fixed',
        value: 5,
        productIds: ['prod_999'],
      };

      const mockRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        body: discountData,
      });
      const response = await action({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.discount.type).toBe('fixed');
      expect(data.discount.value).toBe(5);
    });

    it('should return 400 when name is missing', async () => {
      const discountData = {
        type: 'percentage',
        value: 20,
        productIds: [],
      };

      const mockRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        body: discountData,
      });
      const response = await action({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required fields');
      expect(data.required).toContain('name');
    });

    it('should return 400 when type is invalid', async () => {
      const discountData = {
        name: 'Invalid Type Discount',
        type: 'invalid_type',
        value: 20,
        productIds: [],
      };

      const mockRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        body: discountData,
      });
      const response = await action({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid discount type');
      expect(data.allowed).toEqual(['percentage', 'fixed']);
    });

    it('should return 400 when productIds is missing', async () => {
      const discountData = {
        name: 'No Products',
        type: 'percentage',
        value: 20,
      };

      const mockRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        body: discountData,
      });
      const response = await action({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should require authentication', async () => {
      const mockRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        body: { name: 'Test', type: 'percentage', value: 10, productIds: [] },
      });
      await action({ request: mockRequest });

      expect(shopifyServer.authenticate.admin).toHaveBeenCalledWith(mockRequest);
    });

    it('should accept decimal values', async () => {
      const discountData = {
        name: 'Precise Discount',
        type: 'percentage',
        value: 12.5,
        productIds: [],
      };

      const mockRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        body: discountData,
      });
      const response = await action({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.discount.value).toBe(12.5);
    });
  });

  describe('PATCH /api/discounts', () => {
    it('should update an existing discount', async () => {
      const created = await discountService.createDiscount({
        name: 'Original Name',
        type: 'percentage',
        value: 10,
        productIds: ['prod_1'],
      });

      const updateData = {
        id: created.id,
        name: 'Updated Name',
        value: 20,
      };

      const mockRequest = createMockRequest('/api/discounts', {
        method: 'PATCH',
        body: updateData,
      });
      const response = await action({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Discount updated successfully');
      expect(data.discount.name).toBe('Updated Name');
      expect(data.discount.value).toBe(20);

      // Verify in database
      const updated = await discountService.getDiscountById(created.id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.value).toBe(20);
    });

    it('should return 400 when ID is missing', async () => {
      const mockRequest = createMockRequest('/api/discounts', {
        method: 'PATCH',
        body: { name: 'Updated' },
      });
      const response = await action({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe('Discount ID is required');
    });
  });

  describe('DELETE /api/discounts', () => {
    it('should delete an existing discount', async () => {
      const created = await discountService.createDiscount({
        name: 'To Delete',
        type: 'percentage',
        value: 15,
        productIds: [],
      });

      const mockRequest = createMockRequest('/api/discounts', {
        method: 'DELETE',
        body: { id: created.id },
      });
      const response = await action({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Discount deleted successfully');

      // Verify it's deleted
      const found = await discountService.getDiscountById(created.id);
      expect(found).toBeNull();
    });

    it('should return 400 when ID is missing', async () => {
      const mockRequest = createMockRequest('/api/discounts', {
        method: 'DELETE',
        body: {},
      });
      const response = await action({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe('Discount ID is required');
    });
  });

  describe('Unsupported Methods', () => {
    it('should return 405 for PUT method', async () => {
      const mockRequest = createMockRequest('/api/discounts', {
        method: 'PUT',
        body: {},
      });
      const response = await action({ request: mockRequest });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(405);
      expect(data.error).toBe('Method not allowed');
      expect(data.allowed).toEqual(['GET', 'POST', 'PATCH', 'DELETE']);
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should handle complete CRUD lifecycle', async () => {
      // CREATE
      const createRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        body: {
          name: 'Lifecycle Test',
          type: 'percentage',
          value: 15,
          productIds: ['prod_1'],
        },
      });
      const createResponse = await action({ request: createRequest });
      const { data: createData } = await parseResponse(createResponse);
      const discountId = createData.discount.id;

      // READ (Single)
      const readRequest = createMockRequest(`/api/discounts?id=${discountId}`);
      const readResponse = await loader({ request: readRequest });
      const { data: readData } = await parseResponse(readResponse);
      expect(readData.discount.name).toBe('Lifecycle Test');

      // UPDATE
      const updateRequest = createMockRequest('/api/discounts', {
        method: 'PATCH',
        body: {
          id: discountId,
          name: 'Updated Lifecycle',
          value: 25,
        },
      });
      const updateResponse = await action({ request: updateRequest });
      const { data: updateData } = await parseResponse(updateResponse);
      expect(updateData.discount.name).toBe('Updated Lifecycle');
      expect(updateData.discount.value).toBe(25);

      // READ (All)
      const listRequest = createMockRequest('/api/discounts');
      const listResponse = await loader({ request: listRequest });
      const { data: listData } = await parseResponse(listResponse);
      expect(listData.discounts).toHaveLength(1);

      // DELETE
      const deleteRequest = createMockRequest('/api/discounts', {
        method: 'DELETE',
        body: { id: discountId },
      });
      const deleteResponse = await action({ request: deleteRequest });
      const { status: deleteStatus } = await parseResponse(deleteResponse);
      expect(deleteStatus).toBe(200);

      // VERIFY DELETED
      const verifyRequest = createMockRequest(`/api/discounts?id=${discountId}`);
      const verifyResponse = await loader({ request: verifyRequest });
      const { status: verifyStatus } = await parseResponse(verifyResponse);
      expect(verifyStatus).toBe(404);
    });

    it('should handle multiple discounts with different types', async () => {
      // Create percentage discount
      const percentageRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        body: {
          name: '20% Off',
          type: 'percentage',
          value: 20,
          productIds: ['prod_1'],
        },
      });
      await action({ request: percentageRequest });

      // Create fixed discount
      const fixedRequest = createMockRequest('/api/discounts', {
        method: 'POST',
        body: {
          name: '$10 Off',
          type: 'fixed',
          value: 10,
          productIds: ['prod_2'],
        },
      });
      await action({ request: fixedRequest });

      // Retrieve all
      const listRequest = createMockRequest('/api/discounts');
      const listResponse = await loader({ request: listRequest });
      const { data } = await parseResponse(listResponse);

      expect(data.discounts).toHaveLength(2);
      const types = data.discounts.map((d) => d.type);
      expect(types).toContain('percentage');
      expect(types).toContain('fixed');
    });
  });
});
