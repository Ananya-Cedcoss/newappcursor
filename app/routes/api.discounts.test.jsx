/**
 * Unit Tests for Discount API Routes
 * Tests Remix loaders and actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loader, action } from './api.discounts.jsx';
import * as discountService from '../models/discount.server.js';
import * as shopifyServer from '../shopify.server.js';
import { cleanAllTables } from '../../tests/setup/db.helper.js';

// Mock Shopify authentication
vi.mock('../shopify.server.js', () => ({
  authenticate: {
    admin: vi.fn().mockResolvedValue({
      session: {
        shop: 'test-shop.myshopify.com',
        accessToken: 'test_token',
      },
    }),
  },
}));

describe('Discount API Routes', () => {
  beforeEach(async () => {
    await cleanAllTables();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanAllTables();
  });

  describe('loader (GET)', () => {
    describe('Fetch all discounts', () => {
      it('should fetch all discounts successfully', async () => {
        // Create test discounts
        const discount1 = await discountService.createDiscount({
          name: 'Discount 1',
          type: 'percentage',
          value: 10,
          productIds: ['prod_1'],
        });
        const discount2 = await discountService.createDiscount({
          name: 'Discount 2',
          type: 'fixed',
          value: 5,
          productIds: ['prod_2'],
        });

        const request = new Request('http://localhost/api/discounts');
        const response = await loader({ request });

        expect(response).toBeInstanceOf(Response);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.discounts).toHaveLength(2);
        expect(data.count).toBe(2);
      });

      it('should return empty array when no discounts exist', async () => {
        const request = new Request('http://localhost/api/discounts');
        const response = await loader({ request });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.discounts).toEqual([]);
        expect(data.count).toBe(0);
      });

      it('should call authenticate.admin', async () => {
        const request = new Request('http://localhost/api/discounts');
        await loader({ request });

        expect(shopifyServer.authenticate.admin).toHaveBeenCalledWith(request);
      });
    });

    describe('Fetch specific discount by ID', () => {
      it('should fetch a discount by ID', async () => {
        const created = await discountService.createDiscount({
          name: 'Test Discount',
          type: 'percentage',
          value: 20,
          productIds: ['prod_123'],
        });

        const request = new Request(
          `http://localhost/api/discounts?id=${created.id}`
        );
        const response = await loader({ request });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.discount).toBeDefined();
        expect(data.discount.id).toBe(created.id);
        expect(data.discount.name).toBe('Test Discount');
      });

      it('should return 404 for non-existent discount ID', async () => {
        const request = new Request(
          'http://localhost/api/discounts?id=non_existent_id'
        );
        const response = await loader({ request });

        expect(response.status).toBe(404);

        const data = await response.json();
        expect(data.error).toBe('Discount not found');
      });
    });

    describe('Error handling', () => {
      it('should handle database errors gracefully', async () => {
        // Mock getAllDiscounts to throw error
        vi.spyOn(discountService, 'getAllDiscounts').mockRejectedValue(
          new Error('Database error')
        );

        const request = new Request('http://localhost/api/discounts');
        const response = await loader({ request });

        expect(response.status).toBe(500);

        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch discounts');
        expect(data.message).toBe('Database error');
      });
    });
  });

  describe('action (POST)', () => {
    describe('Create discount', () => {
      it('should create a discount with valid data', async () => {
        const requestBody = {
          name: 'New Discount',
          type: 'percentage',
          value: 15,
          productIds: ['prod_1', 'prod_2'],
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await action({ request });

        expect(response.status).toBe(201);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toBe('Discount created successfully');
        expect(data.discount).toBeDefined();
        expect(data.discount.name).toBe('New Discount');
        expect(data.discount.type).toBe('percentage');
        expect(data.discount.value).toBe(15);
      });

      it('should create a fixed discount', async () => {
        const requestBody = {
          name: 'Fixed Discount',
          type: 'fixed',
          value: 10,
          productIds: ['prod_1'],
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(201);

        const data = await response.json();
        expect(data.discount.type).toBe('fixed');
        expect(data.discount.value).toBe(10);
      });

      it('should parse string value to float', async () => {
        const requestBody = {
          name: 'String Value',
          type: 'percentage',
          value: '25.5',
          productIds: [],
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(201);

        const data = await response.json();
        expect(data.discount.value).toBe(25.5);
      });

      it('should handle empty productIds array', async () => {
        const requestBody = {
          name: 'No Products',
          type: 'percentage',
          value: 10,
          productIds: [],
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(201);

        const data = await response.json();
        expect(data.discount.productIds).toBeDefined();
      });
    });

    describe('Validation', () => {
      it('should return 400 when name is missing', async () => {
        const requestBody = {
          type: 'percentage',
          value: 10,
          productIds: [],
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBe('Missing required fields');
      });

      it('should return 400 when type is missing', async () => {
        const requestBody = {
          name: 'Test',
          value: 10,
          productIds: [],
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toBe('Missing required fields');
      });

      it('should return 400 when value is missing', async () => {
        const requestBody = {
          name: 'Test',
          type: 'percentage',
          productIds: [],
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toBe('Missing required fields');
      });

      it('should return 400 when productIds is missing', async () => {
        const requestBody = {
          name: 'Test',
          type: 'percentage',
          value: 10,
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toBe('Missing required fields');
      });

      it('should return 400 for invalid discount type', async () => {
        const requestBody = {
          name: 'Test',
          type: 'invalid_type',
          value: 10,
          productIds: [],
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid discount type');
        expect(data.allowed).toEqual(['percentage', 'fixed']);
      });

      it('should accept value of 0', async () => {
        const requestBody = {
          name: 'Zero Discount',
          type: 'percentage',
          value: 0,
          productIds: [],
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(201);
      });
    });
  });

  describe('action (PATCH)', () => {
    describe('Update discount', () => {
      it('should update discount name', async () => {
        const created = await discountService.createDiscount({
          name: 'Original Name',
          type: 'percentage',
          value: 10,
          productIds: [],
        });

        const requestBody = {
          id: created.id,
          name: 'Updated Name',
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'PATCH',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toBe('Discount updated successfully');
        expect(data.discount.name).toBe('Updated Name');
      });

      it('should update discount type', async () => {
        const created = await discountService.createDiscount({
          name: 'Test',
          type: 'percentage',
          value: 10,
          productIds: [],
        });

        const requestBody = {
          id: created.id,
          type: 'fixed',
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'PATCH',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.discount.type).toBe('fixed');
      });

      it('should update discount value', async () => {
        const created = await discountService.createDiscount({
          name: 'Test',
          type: 'percentage',
          value: 10,
          productIds: [],
        });

        const requestBody = {
          id: created.id,
          value: 25,
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'PATCH',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.discount.value).toBe(25);
      });

      it('should update productIds', async () => {
        const created = await discountService.createDiscount({
          name: 'Test',
          type: 'percentage',
          value: 10,
          productIds: ['prod_1'],
        });

        const requestBody = {
          id: created.id,
          productIds: ['prod_2', 'prod_3'],
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'PATCH',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.discount.productIds).toEqual(['prod_2', 'prod_3']);
      });

      it('should update multiple fields at once', async () => {
        const created = await discountService.createDiscount({
          name: 'Original',
          type: 'percentage',
          value: 10,
          productIds: ['prod_1'],
        });

        const requestBody = {
          id: created.id,
          name: 'Updated',
          type: 'fixed',
          value: 20,
          productIds: ['prod_2', 'prod_3'],
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'PATCH',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.discount.name).toBe('Updated');
        expect(data.discount.type).toBe('fixed');
        expect(data.discount.value).toBe(20);
        expect(data.discount.productIds).toEqual(['prod_2', 'prod_3']);
      });

      it('should parse string value to float', async () => {
        const created = await discountService.createDiscount({
          name: 'Test',
          type: 'percentage',
          value: 10,
          productIds: [],
        });

        const requestBody = {
          id: created.id,
          value: '15.5',
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'PATCH',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.discount.value).toBe(15.5);
      });
    });

    describe('Validation', () => {
      it('should return 400 when id is missing', async () => {
        const requestBody = {
          name: 'Updated Name',
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'PATCH',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBe('Discount ID is required');
      });

      it('should return 400 for invalid type in update', async () => {
        const created = await discountService.createDiscount({
          name: 'Test',
          type: 'percentage',
          value: 10,
          productIds: [],
        });

        const requestBody = {
          id: created.id,
          type: 'invalid_type',
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'PATCH',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toBe('Invalid discount type');
        expect(data.allowed).toEqual(['percentage', 'fixed']);
      });

      it('should handle non-existent discount ID', async () => {
        const requestBody = {
          id: 'non_existent_id',
          name: 'Updated',
        };

        const request = new Request('http://localhost/api/discounts', {
          method: 'PATCH',
          body: JSON.stringify(requestBody),
        });

        const response = await action({ request });

        expect(response.status).toBe(500);

        const data = await response.json();
        expect(data.success).toBe(false);
      });
    });
  });

  describe('action (DELETE)', () => {
    it('should delete a discount successfully', async () => {
      const created = await discountService.createDiscount({
        name: 'To Delete',
        type: 'percentage',
        value: 10,
        productIds: [],
      });

      const requestBody = {
        id: created.id,
      };

      const request = new Request('http://localhost/api/discounts', {
        method: 'DELETE',
        body: JSON.stringify(requestBody),
      });

      const response = await action({ request });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Discount deleted successfully');

      // Verify discount was deleted
      const found = await discountService.getDiscountById(created.id);
      expect(found).toBeNull();
    });

    it('should return 400 when id is missing', async () => {
      const requestBody = {};

      const request = new Request('http://localhost/api/discounts', {
        method: 'DELETE',
        body: JSON.stringify(requestBody),
      });

      const response = await action({ request });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Discount ID is required');
    });

    it('should handle non-existent discount ID', async () => {
      const requestBody = {
        id: 'non_existent_id',
      };

      const request = new Request('http://localhost/api/discounts', {
        method: 'DELETE',
        body: JSON.stringify(requestBody),
      });

      const response = await action({ request });

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('Unsupported HTTP methods', () => {
    it('should return 405 for PUT method', async () => {
      const request = new Request('http://localhost/api/discounts', {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      const response = await action({ request });

      expect(response.status).toBe(405);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Method not allowed');
      expect(data.allowed).toEqual(['GET', 'POST', 'PATCH', 'DELETE']);
    });
  });

  describe('Authentication', () => {
    it('should call authenticate.admin for loader', async () => {
      const request = new Request('http://localhost/api/discounts');
      await loader({ request });

      expect(shopifyServer.authenticate.admin).toHaveBeenCalledWith(request);
    });

    it('should call authenticate.admin for action (POST)', async () => {
      const requestBody = {
        name: 'Test',
        type: 'percentage',
        value: 10,
        productIds: [],
      };

      const request = new Request('http://localhost/api/discounts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      await action({ request });

      expect(shopifyServer.authenticate.admin).toHaveBeenCalledWith(request);
    });

    it('should call authenticate.admin for action (PATCH)', async () => {
      const created = await discountService.createDiscount({
        name: 'Test',
        type: 'percentage',
        value: 10,
        productIds: [],
      });

      const requestBody = {
        id: created.id,
        name: 'Updated',
      };

      const request = new Request('http://localhost/api/discounts', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      });

      await action({ request });

      expect(shopifyServer.authenticate.admin).toHaveBeenCalledWith(request);
    });

    it('should call authenticate.admin for action (DELETE)', async () => {
      const created = await discountService.createDiscount({
        name: 'Test',
        type: 'percentage',
        value: 10,
        productIds: [],
      });

      const requestBody = {
        id: created.id,
      };

      const request = new Request('http://localhost/api/discounts', {
        method: 'DELETE',
        body: JSON.stringify(requestBody),
      });

      await action({ request });

      expect(shopifyServer.authenticate.admin).toHaveBeenCalledWith(request);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed JSON in POST request', async () => {
      const request = new Request('http://localhost/api/discounts', {
        method: 'POST',
        body: 'invalid json{',
      });

      const response = await action({ request });

      expect(response.status).toBe(500);
    });

    it('should handle very large discount value', async () => {
      const requestBody = {
        name: 'Large Value',
        type: 'percentage',
        value: 99999999.99,
        productIds: [],
      };

      const request = new Request('http://localhost/api/discounts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await action({ request });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.discount.value).toBe(99999999.99);
    });

    it('should handle discount with many products', async () => {
      const manyProducts = Array.from({ length: 100 }, (_, i) => `prod_${i}`);
      const requestBody = {
        name: 'Many Products',
        type: 'percentage',
        value: 10,
        productIds: manyProducts,
      };

      const request = new Request('http://localhost/api/discounts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await action({ request });

      expect(response.status).toBe(201);

      const data = await response.json();
      // productIds is stored as JSON string, so parse it
      const productIds = typeof data.discount.productIds === 'string'
        ? JSON.parse(data.discount.productIds)
        : data.discount.productIds;
      expect(productIds).toHaveLength(100);
    });

    it('should handle special characters in discount name', async () => {
      const specialName = 'Test & "Special" <Chars> \'Discount\'';
      const requestBody = {
        name: specialName,
        type: 'percentage',
        value: 10,
        productIds: [],
      };

      const request = new Request('http://localhost/api/discounts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await action({ request });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.discount.name).toBe(specialName);
    });

    it('should handle non-array productIds by converting to empty array', async () => {
      const requestBody = {
        name: 'Test',
        type: 'percentage',
        value: 10,
        productIds: 'not_an_array',
      };

      const request = new Request('http://localhost/api/discounts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await action({ request });

      expect(response.status).toBe(201);

      const data = await response.json();
      // Non-array productIds are converted to empty array by the route
      // productIds is stored as JSON string in database
      const productIds = typeof data.discount.productIds === 'string'
        ? JSON.parse(data.discount.productIds)
        : data.discount.productIds;
      expect(Array.isArray(productIds)).toBe(true);
      expect(productIds).toEqual([]);
    });
  });
});
