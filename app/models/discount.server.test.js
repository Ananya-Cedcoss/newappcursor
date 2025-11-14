/**
 * Unit Tests for Discount Database Service Functions
 * Tests all CRUD operations and business logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createDiscount,
  getDiscountById,
  getAllDiscounts,
  updateDiscount,
  deleteDiscount,
  getDiscountsByProductId,
  getDiscountsByType,
  countDiscounts,
} from './discount.server.js';
import { cleanAllTables, getPrismaClient } from '../../tests/setup/db.helper.js';

describe('Discount Database Service Functions', () => {
  beforeEach(async () => {
    // Clean database before each test
    await cleanAllTables();
  });

  afterEach(async () => {
    // Clean database after each test
    await cleanAllTables();
  });

  describe('createDiscount()', () => {
    it('should create a discount with valid data', async () => {
      const discountData = {
        name: 'Test Discount',
        type: 'percentage',
        value: 20,
        productIds: ['prod_123', 'prod_456'],
      };

      const discount = await createDiscount(discountData);

      expect(discount).toBeDefined();
      expect(discount.id).toBeDefined();
      expect(discount.name).toBe('Test Discount');
      expect(discount.type).toBe('percentage');
      expect(discount.value).toBe(20);
      expect(JSON.parse(discount.productIds)).toEqual(['prod_123', 'prod_456']);
      expect(discount.createdAt).toBeDefined();
      expect(discount.updatedAt).toBeDefined();
    });

    it('should create a fixed discount', async () => {
      const discountData = {
        name: 'Fixed Discount',
        type: 'fixed',
        value: 10.5,
        productIds: ['prod_789'],
      };

      const discount = await createDiscount(discountData);

      expect(discount.type).toBe('fixed');
      expect(discount.value).toBe(10.5);
    });

    it('should handle empty productIds array', async () => {
      const discountData = {
        name: 'No Products',
        type: 'percentage',
        value: 15,
        productIds: [],
      };

      const discount = await createDiscount(discountData);

      expect(JSON.parse(discount.productIds)).toEqual([]);
    });

    it('should handle decimal values', async () => {
      const discountData = {
        name: 'Decimal Discount',
        type: 'percentage',
        value: 12.75,
        productIds: ['prod_001'],
      };

      const discount = await createDiscount(discountData);

      expect(discount.value).toBe(12.75);
    });
  });

  describe('getDiscountById()', () => {
    it('should retrieve a discount by ID', async () => {
      const created = await createDiscount({
        name: 'Test Discount',
        type: 'percentage',
        value: 20,
        productIds: ['prod_123'],
      });

      const retrieved = await getDiscountById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Test Discount');
      expect(retrieved.productIds).toEqual(['prod_123']);
    });

    it('should return null for non-existent ID', async () => {
      const result = await getDiscountById('non_existent_id');

      expect(result).toBeNull();
    });

    it('should parse productIds from JSON string', async () => {
      const created = await createDiscount({
        name: 'Test Discount',
        type: 'percentage',
        value: 20,
        productIds: ['prod_1', 'prod_2', 'prod_3'],
      });

      const retrieved = await getDiscountById(created.id);

      expect(Array.isArray(retrieved.productIds)).toBe(true);
      expect(retrieved.productIds).toHaveLength(3);
      expect(retrieved.productIds).toEqual(['prod_1', 'prod_2', 'prod_3']);
    });
  });

  describe('getAllDiscounts()', () => {
    it('should return all discounts', async () => {
      await createDiscount({
        name: 'Discount 1',
        type: 'percentage',
        value: 10,
        productIds: ['prod_1'],
      });
      await createDiscount({
        name: 'Discount 2',
        type: 'fixed',
        value: 5,
        productIds: ['prod_2'],
      });

      const discounts = await getAllDiscounts();

      expect(discounts).toHaveLength(2);
      expect(discounts[0].productIds).toBeDefined();
      expect(Array.isArray(discounts[0].productIds)).toBe(true);
    });

    it('should return empty array when no discounts exist', async () => {
      const discounts = await getAllDiscounts();

      expect(discounts).toEqual([]);
    });

    it('should support pagination with skip and take', async () => {
      // Create 5 discounts
      for (let i = 1; i <= 5; i++) {
        await createDiscount({
          name: `Discount ${i}`,
          type: 'percentage',
          value: i * 10,
          productIds: [`prod_${i}`],
        });
      }

      const page1 = await getAllDiscounts({ skip: 0, take: 2 });
      const page2 = await getAllDiscounts({ skip: 2, take: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('should order discounts by createdAt descending', async () => {
      const discount1 = await createDiscount({
        name: 'First',
        type: 'percentage',
        value: 10,
        productIds: [],
      });

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const discount2 = await createDiscount({
        name: 'Second',
        type: 'percentage',
        value: 20,
        productIds: [],
      });

      const discounts = await getAllDiscounts();

      expect(discounts[0].id).toBe(discount2.id); // Most recent first
      expect(discounts[1].id).toBe(discount1.id);
    });

    it('should parse productIds for all discounts', async () => {
      await createDiscount({
        name: 'Test 1',
        type: 'percentage',
        value: 10,
        productIds: ['prod_1', 'prod_2'],
      });
      await createDiscount({
        name: 'Test 2',
        type: 'fixed',
        value: 5,
        productIds: ['prod_3'],
      });

      const discounts = await getAllDiscounts();

      discounts.forEach((discount) => {
        expect(Array.isArray(discount.productIds)).toBe(true);
      });
    });
  });

  describe('updateDiscount()', () => {
    it('should update discount name', async () => {
      const created = await createDiscount({
        name: 'Original Name',
        type: 'percentage',
        value: 20,
        productIds: ['prod_1'],
      });

      const updated = await updateDiscount(created.id, { name: 'Updated Name' });

      expect(updated.name).toBe('Updated Name');
      expect(updated.type).toBe('percentage');
      expect(updated.value).toBe(20);
    });

    it('should update discount type', async () => {
      const created = await createDiscount({
        name: 'Test Discount',
        type: 'percentage',
        value: 20,
        productIds: [],
      });

      const updated = await updateDiscount(created.id, { type: 'fixed' });

      expect(updated.type).toBe('fixed');
    });

    it('should update discount value', async () => {
      const created = await createDiscount({
        name: 'Test Discount',
        type: 'percentage',
        value: 20,
        productIds: [],
      });

      const updated = await updateDiscount(created.id, { value: 30 });

      expect(updated.value).toBe(30);
    });

    it('should update productIds', async () => {
      const created = await createDiscount({
        name: 'Test Discount',
        type: 'percentage',
        value: 20,
        productIds: ['prod_1'],
      });

      const updated = await updateDiscount(created.id, {
        productIds: ['prod_2', 'prod_3'],
      });

      expect(updated.productIds).toEqual(['prod_2', 'prod_3']);
    });

    it('should update multiple fields at once', async () => {
      const created = await createDiscount({
        name: 'Original',
        type: 'percentage',
        value: 10,
        productIds: ['prod_1'],
      });

      const updated = await updateDiscount(created.id, {
        name: 'Updated',
        type: 'fixed',
        value: 25,
        productIds: ['prod_2', 'prod_3', 'prod_4'],
      });

      expect(updated.name).toBe('Updated');
      expect(updated.type).toBe('fixed');
      expect(updated.value).toBe(25);
      expect(updated.productIds).toEqual(['prod_2', 'prod_3', 'prod_4']);
    });

    it('should parse productIds in response', async () => {
      const created = await createDiscount({
        name: 'Test',
        type: 'percentage',
        value: 10,
        productIds: ['prod_1'],
      });

      const updated = await updateDiscount(created.id, {
        productIds: ['prod_2', 'prod_3'],
      });

      expect(Array.isArray(updated.productIds)).toBe(true);
      expect(updated.productIds).toEqual(['prod_2', 'prod_3']);
    });

    it('should throw error for non-existent discount', async () => {
      await expect(
        updateDiscount('non_existent_id', { name: 'New Name' })
      ).rejects.toThrow();
    });
  });

  describe('deleteDiscount()', () => {
    it('should delete a discount', async () => {
      const created = await createDiscount({
        name: 'To Delete',
        type: 'percentage',
        value: 15,
        productIds: [],
      });

      const deleted = await deleteDiscount(created.id);

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe(created.id);

      // Verify it's actually deleted
      const found = await getDiscountById(created.id);
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent discount', async () => {
      await expect(deleteDiscount('non_existent_id')).rejects.toThrow();
    });

    it('should remove discount from database', async () => {
      const discount1 = await createDiscount({
        name: 'Keep',
        type: 'percentage',
        value: 10,
        productIds: [],
      });
      const discount2 = await createDiscount({
        name: 'Delete',
        type: 'percentage',
        value: 20,
        productIds: [],
      });

      await deleteDiscount(discount2.id);

      const allDiscounts = await getAllDiscounts();
      expect(allDiscounts).toHaveLength(1);
      expect(allDiscounts[0].id).toBe(discount1.id);
    });
  });

  describe('getDiscountsByProductId()', () => {
    it('should find discounts for a specific product', async () => {
      await createDiscount({
        name: 'Discount 1',
        type: 'percentage',
        value: 10,
        productIds: ['prod_123', 'prod_456'],
      });
      await createDiscount({
        name: 'Discount 2',
        type: 'fixed',
        value: 5,
        productIds: ['prod_789'],
      });

      const discounts = await getDiscountsByProductId('prod_123');

      expect(discounts).toHaveLength(1);
      expect(discounts[0].name).toBe('Discount 1');
      expect(discounts[0].productIds).toContain('prod_123');
    });

    it('should return empty array when no discounts found', async () => {
      const discounts = await getDiscountsByProductId('non_existent_product');

      expect(discounts).toEqual([]);
    });

    it('should find multiple discounts for same product', async () => {
      await createDiscount({
        name: 'Discount 1',
        type: 'percentage',
        value: 10,
        productIds: ['prod_123'],
      });
      await createDiscount({
        name: 'Discount 2',
        type: 'fixed',
        value: 5,
        productIds: ['prod_123', 'prod_456'],
      });

      const discounts = await getDiscountsByProductId('prod_123');

      expect(discounts).toHaveLength(2);
    });

    it('should parse productIds in results', async () => {
      await createDiscount({
        name: 'Test',
        type: 'percentage',
        value: 10,
        productIds: ['prod_1', 'prod_2'],
      });

      const discounts = await getDiscountsByProductId('prod_1');

      expect(Array.isArray(discounts[0].productIds)).toBe(true);
      expect(discounts[0].productIds).toEqual(['prod_1', 'prod_2']);
    });
  });

  describe('getDiscountsByType()', () => {
    it('should find all percentage discounts', async () => {
      await createDiscount({
        name: 'Percentage 1',
        type: 'percentage',
        value: 10,
        productIds: [],
      });
      await createDiscount({
        name: 'Fixed 1',
        type: 'fixed',
        value: 5,
        productIds: [],
      });
      await createDiscount({
        name: 'Percentage 2',
        type: 'percentage',
        value: 20,
        productIds: [],
      });

      const discounts = await getDiscountsByType('percentage');

      expect(discounts).toHaveLength(2);
      discounts.forEach((discount) => {
        expect(discount.type).toBe('percentage');
      });
    });

    it('should find all fixed discounts', async () => {
      await createDiscount({
        name: 'Fixed 1',
        type: 'fixed',
        value: 5,
        productIds: [],
      });
      await createDiscount({
        name: 'Percentage 1',
        type: 'percentage',
        value: 10,
        productIds: [],
      });

      const discounts = await getDiscountsByType('fixed');

      expect(discounts).toHaveLength(1);
      expect(discounts[0].type).toBe('fixed');
    });

    it('should return empty array for type with no discounts', async () => {
      const discounts = await getDiscountsByType('percentage');

      expect(discounts).toEqual([]);
    });

    it('should order by createdAt descending', async () => {
      const first = await createDiscount({
        name: 'First',
        type: 'percentage',
        value: 10,
        productIds: [],
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const second = await createDiscount({
        name: 'Second',
        type: 'percentage',
        value: 20,
        productIds: [],
      });

      const discounts = await getDiscountsByType('percentage');

      expect(discounts[0].id).toBe(second.id);
      expect(discounts[1].id).toBe(first.id);
    });

    it('should parse productIds in results', async () => {
      await createDiscount({
        name: 'Test',
        type: 'percentage',
        value: 10,
        productIds: ['prod_1', 'prod_2'],
      });

      const discounts = await getDiscountsByType('percentage');

      expect(Array.isArray(discounts[0].productIds)).toBe(true);
    });
  });

  describe('countDiscounts()', () => {
    it('should return 0 when no discounts exist', async () => {
      const count = await countDiscounts();

      expect(count).toBe(0);
    });

    it('should return correct count of discounts', async () => {
      await createDiscount({
        name: 'Discount 1',
        type: 'percentage',
        value: 10,
        productIds: [],
      });
      await createDiscount({
        name: 'Discount 2',
        type: 'fixed',
        value: 5,
        productIds: [],
      });
      await createDiscount({
        name: 'Discount 3',
        type: 'percentage',
        value: 15,
        productIds: [],
      });

      const count = await countDiscounts();

      expect(count).toBe(3);
    });

    it('should update count after deletion', async () => {
      const discount1 = await createDiscount({
        name: 'Discount 1',
        type: 'percentage',
        value: 10,
        productIds: [],
      });
      await createDiscount({
        name: 'Discount 2',
        type: 'fixed',
        value: 5,
        productIds: [],
      });

      let count = await countDiscounts();
      expect(count).toBe(2);

      await deleteDiscount(discount1.id);

      count = await countDiscounts();
      expect(count).toBe(1);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle very long discount names', async () => {
      const longName = 'A'.repeat(500);
      const discount = await createDiscount({
        name: longName,
        type: 'percentage',
        value: 10,
        productIds: [],
      });

      expect(discount.name).toBe(longName);
    });

    it('should handle zero value discount', async () => {
      const discount = await createDiscount({
        name: 'Zero Discount',
        type: 'percentage',
        value: 0,
        productIds: [],
      });

      expect(discount.value).toBe(0);
    });

    it('should handle negative values', async () => {
      const discount = await createDiscount({
        name: 'Negative Discount',
        type: 'fixed',
        value: -10,
        productIds: [],
      });

      expect(discount.value).toBe(-10);
    });

    it('should handle very large value', async () => {
      const discount = await createDiscount({
        name: 'Large Discount',
        type: 'percentage',
        value: 99999.99,
        productIds: [],
      });

      expect(discount.value).toBe(99999.99);
    });

    it('should handle large number of productIds', async () => {
      const manyProducts = Array.from({ length: 100 }, (_, i) => `prod_${i}`);
      const discount = await createDiscount({
        name: 'Many Products',
        type: 'percentage',
        value: 10,
        productIds: manyProducts,
      });

      expect(JSON.parse(discount.productIds)).toHaveLength(100);
    });

    it('should handle special characters in name', async () => {
      const specialName = 'Test & "Special" <Chars> \'Discount\'';
      const discount = await createDiscount({
        name: specialName,
        type: 'percentage',
        value: 10,
        productIds: [],
      });

      expect(discount.name).toBe(specialName);
    });

    it('should handle productIds with special characters', async () => {
      const productIds = ['prod-123', 'prod_456', 'prod.789'];
      const discount = await createDiscount({
        name: 'Test',
        type: 'percentage',
        value: 10,
        productIds,
      });

      expect(JSON.parse(discount.productIds)).toEqual(productIds);
    });

    it('should handle floating point precision', async () => {
      const discount = await createDiscount({
        name: 'Precise Value',
        type: 'percentage',
        value: 10.123456789,
        productIds: [],
      });

      expect(discount.value).toBeCloseTo(10.123456789, 5);
    });
  });
});
