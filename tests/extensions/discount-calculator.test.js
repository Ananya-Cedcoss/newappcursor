/**
 * Tests for Theme Extension Discount Calculator
 * Tests all JavaScript logic used in Liquid templates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatMoney,
  calculateDiscount,
  generateDiscountMessage,
  generateBadgeHTML,
  shouldShowDiscount,
  fetchDiscountData,
  buildDiscountUI,
  buildPriceDisplay,
} from '../../extensions/product-discount-display/lib/discount-calculator.js';

describe('Theme Extension - Discount Calculator', () => {
  /**
   * =================================================================
   * Money Formatting Tests
   * =================================================================
   */
  describe('formatMoney()', () => {
    it('should format cents to dollar string', () => {
      expect(formatMoney(1000)).toBe('$10.00');
      expect(formatMoney(1050)).toBe('$10.50');
      expect(formatMoney(999)).toBe('$9.99');
    });

    it('should handle zero amount', () => {
      expect(formatMoney(0)).toBe('$0.00');
    });

    it('should handle large amounts', () => {
      expect(formatMoney(999999)).toBe('$9999.99');
      expect(formatMoney(10000000)).toBe('$100000.00');
    });

    it('should round to 2 decimal places', () => {
      expect(formatMoney(1001)).toBe('$10.01');
      expect(formatMoney(1005)).toBe('$10.05');
    });

    it('should throw error for non-number input', () => {
      expect(() => formatMoney('100')).toThrow('cents must be a number');
      expect(() => formatMoney(null)).toThrow('cents must be a number');
      expect(() => formatMoney(undefined)).toThrow('cents must be a number');
    });
  });

  /**
   * =================================================================
   * Discount Calculation Tests
   * =================================================================
   */
  describe('calculateDiscount() - Percentage Discounts', () => {
    it('should calculate 20% discount correctly', () => {
      const result = calculateDiscount(10000, { type: 'percentage', value: 20 });

      expect(result.originalPrice).toBe(10000);
      expect(result.discountAmount).toBe(2000);
      expect(result.discountedPrice).toBe(8000);
      expect(result.discountType).toBe('percentage');
      expect(result.discountValue).toBe(20);
      expect(result.savingsPercentage).toBe(20);
    });

    it('should calculate 50% discount correctly', () => {
      const result = calculateDiscount(5000, { type: 'percentage', value: 50 });

      expect(result.discountAmount).toBe(2500);
      expect(result.discountedPrice).toBe(2500);
    });

    it('should calculate 100% discount (free)', () => {
      const result = calculateDiscount(10000, { type: 'percentage', value: 100 });

      expect(result.discountAmount).toBe(10000);
      expect(result.discountedPrice).toBe(0);
    });

    it('should handle decimal percentage values', () => {
      const result = calculateDiscount(10000, { type: 'percentage', value: 12.5 });

      expect(result.discountAmount).toBe(1250);
      expect(result.discountedPrice).toBe(8750);
    });

    it('should round discount amounts to nearest cent', () => {
      const result = calculateDiscount(3333, { type: 'percentage', value: 10 });

      // 10% of 3333 = 333.3, should round to 333
      expect(result.discountAmount).toBe(333);
      expect(result.discountedPrice).toBe(3000);
    });
  });

  describe('calculateDiscount() - Fixed Discounts', () => {
    it('should calculate $10 fixed discount correctly', () => {
      const result = calculateDiscount(10000, { type: 'fixed', value: 10 });

      expect(result.originalPrice).toBe(10000);
      expect(result.discountAmount).toBe(1000); // $10 = 1000 cents
      expect(result.discountedPrice).toBe(9000);
      expect(result.discountType).toBe('fixed');
    });

    it('should calculate $5.50 fixed discount correctly', () => {
      const result = calculateDiscount(10000, { type: 'fixed', value: 5.5 });

      expect(result.discountAmount).toBe(550);
      expect(result.discountedPrice).toBe(9450);
    });

    it('should not allow negative final price', () => {
      // $100 discount on $50 item
      const result = calculateDiscount(5000, { type: 'fixed', value: 100 });

      expect(result.discountedPrice).toBe(0);
      expect(result.discountedPrice).toBeGreaterThanOrEqual(0);
    });

    it('should calculate savings percentage for fixed discount', () => {
      const result = calculateDiscount(10000, { type: 'fixed', value: 25 });

      expect(result.savingsPercentage).toBe(25); // $25 off $100 = 25%
    });
  });

  describe('calculateDiscount() - Validation', () => {
    it('should throw error for invalid original price', () => {
      expect(() => calculateDiscount(-100, { type: 'percentage', value: 10 }))
        .toThrow('originalPrice must be a non-negative number');

      expect(() => calculateDiscount('100', { type: 'percentage', value: 10 }))
        .toThrow('originalPrice must be a non-negative number');
    });

    it('should throw error for invalid discount object', () => {
      expect(() => calculateDiscount(10000, null))
        .toThrow('Invalid discount object');

      expect(() => calculateDiscount(10000, {}))
        .toThrow('Invalid discount object');

      expect(() => calculateDiscount(10000, { type: 'percentage' }))
        .toThrow('Invalid discount object');
    });

    it('should throw error for invalid percentage value', () => {
      expect(() => calculateDiscount(10000, { type: 'percentage', value: -10 }))
        .toThrow('Percentage value must be between 0 and 100');

      expect(() => calculateDiscount(10000, { type: 'percentage', value: 150 }))
        .toThrow('Percentage value must be between 0 and 100');
    });

    it('should throw error for invalid discount type', () => {
      expect(() => calculateDiscount(10000, { type: 'invalid', value: 10 }))
        .toThrow('Invalid discount type');
    });
  });

  /**
   * =================================================================
   * Discount Message Generation Tests
   * =================================================================
   */
  describe('generateDiscountMessage()', () => {
    it('should generate message for percentage discount', () => {
      const message = generateDiscountMessage({ type: 'percentage', value: 20 }, 2000);
      expect(message).toBe('Save 20% today!');
    });

    it('should generate message for fixed discount', () => {
      const message = generateDiscountMessage({ type: 'fixed', value: 10 }, 1000);
      expect(message).toBe('Save $10.00 today!');
    });

    it('should handle different percentage values', () => {
      expect(generateDiscountMessage({ type: 'percentage', value: 50 }, 5000))
        .toBe('Save 50% today!');

      expect(generateDiscountMessage({ type: 'percentage', value: 15 }, 1500))
        .toBe('Save 15% today!');
    });

    it('should throw error for invalid discount', () => {
      expect(() => generateDiscountMessage(null, 1000))
        .toThrow('Invalid discount object');
    });
  });

  /**
   * =================================================================
   * Badge HTML Generation Tests
   * =================================================================
   */
  describe('generateBadgeHTML()', () => {
    it('should generate percentage badge HTML', () => {
      const html = generateBadgeHTML({ type: 'percentage', value: 25 }, 2500);

      expect(html).toContain('discount-badge--percentage');
      expect(html).toContain('-25%');
    });

    it('should generate fixed discount badge HTML', () => {
      const html = generateBadgeHTML({ type: 'fixed', value: 15 }, 1500);

      expect(html).toContain('discount-badge--fixed');
      expect(html).toContain('-$15.00');
    });

    it('should include proper CSS classes', () => {
      const html = generateBadgeHTML({ type: 'percentage', value: 20 }, 2000);

      expect(html).toContain('class="discount-badge');
      expect(html).toContain('discount-badge__value');
    });

    it('should throw error for invalid discount', () => {
      expect(() => generateBadgeHTML(null, 1000))
        .toThrow('Invalid discount object');
    });
  });

  /**
   * =================================================================
   * UI Visibility Logic Tests
   * =================================================================
   */
  describe('shouldShowDiscount()', () => {
    it('should return true when discount data is valid', () => {
      const data = {
        success: true,
        discount: {
          type: 'percentage',
          value: 20,
          name: 'Summer Sale',
        },
      };

      expect(shouldShowDiscount(data)).toBe(true);
    });

    it('should return false when success is false', () => {
      const data = {
        success: false,
        discount: null,
      };

      expect(shouldShowDiscount(data)).toBe(false);
    });

    it('should return false when discount is null', () => {
      const data = {
        success: true,
        discount: null,
      };

      expect(shouldShowDiscount(data)).toBe(false);
    });

    it('should return false when data is null or undefined', () => {
      expect(shouldShowDiscount(null)).toBe(false);
      expect(shouldShowDiscount(undefined)).toBe(false);
      expect(shouldShowDiscount({})).toBe(false);
    });

    it('should handle various falsy discount values', () => {
      expect(shouldShowDiscount({ success: true, discount: false })).toBe(false);
      expect(shouldShowDiscount({ success: true, discount: 0 })).toBe(false);
      expect(shouldShowDiscount({ success: true, discount: '' })).toBe(false);
    });
  });

  /**
   * =================================================================
   * Fetch Discount Data Tests
   * =================================================================
   */
  describe('fetchDiscountData()', () => {
    let mockFetch;

    beforeEach(() => {
      mockFetch = vi.fn();
      global.fetch = mockFetch;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch discount data successfully', async () => {
      const mockData = {
        success: true,
        discount: {
          type: 'percentage',
          value: 20,
          name: 'Test Discount',
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchDiscountData('prod_123');

      expect(mockFetch).toHaveBeenCalledWith('/apps/discount-proxy/product-discount?productId=prod_123');
      expect(result).toEqual(mockData);
    });

    it('should use custom base URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, discount: null }),
      });

      await fetchDiscountData('prod_123', '/api/discounts');

      expect(mockFetch).toHaveBeenCalledWith('/api/discounts/product-discount?productId=prod_123');
    });

    it('should throw error when productId is missing', async () => {
      await expect(fetchDiscountData(''))
        .rejects.toThrow('productId is required');

      await expect(fetchDiscountData(null))
        .rejects.toThrow('productId is required');
    });

    it('should throw error on HTTP error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(fetchDiscountData('prod_123'))
        .rejects.toThrow('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchDiscountData('prod_123'))
        .rejects.toThrow('Network error');
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(fetchDiscountData('prod_123'))
        .rejects.toThrow('Invalid JSON');
    });
  });

  /**
   * =================================================================
   * Complete UI Rendering Tests
   * =================================================================
   */
  describe('buildDiscountUI()', () => {
    it('should build complete discount UI for percentage discount', () => {
      const discount = {
        type: 'percentage',
        value: 25,
        name: 'Summer Sale',
      };
      const html = buildDiscountUI(discount, 10000, 'Special Offer');

      expect(html).toContain('Summer Sale');
      expect(html).toContain('Save 25% today!');
      expect(html).toContain('25% OFF');
      expect(html).toContain('$100.00'); // Original price
      expect(html).toContain('$75.00'); // Discounted price
      expect(html).toContain('Save $25.00');
      expect(html).toContain('Special Offer');
      expect(html).toContain('Discount applied automatically at checkout');
    });

    it('should build complete discount UI for fixed discount', () => {
      const discount = {
        type: 'fixed',
        value: 15,
        name: 'Flash Sale',
      };
      const html = buildDiscountUI(discount, 10000);

      expect(html).toContain('Flash Sale');
      expect(html).toContain('Save $15.00 today!');
      expect(html).toContain('$15.00 OFF');
      expect(html).toContain('$100.00'); // Original
      expect(html).toContain('$85.00'); // After discount
    });

    it('should include all required HTML elements', () => {
      const discount = { type: 'percentage', value: 20, name: 'Test' };
      const html = buildDiscountUI(discount, 5000);

      expect(html).toContain('discount-badge');
      expect(html).toContain('discount-info');
      expect(html).toContain('discount-info__name');
      expect(html).toContain('discount-highlight');
      expect(html).toContain('discount-pricing');
      expect(html).toContain('original-price');
      expect(html).toContain('discounted-price');
      expect(html).toContain('savings');
    });
  });

  describe('buildPriceDisplay()', () => {
    it('should build price display for percentage discount', () => {
      const discount = { type: 'percentage', value: 30, name: 'Sale' };
      const html = buildPriceDisplay(discount, 10000);

      expect(html).toContain('$100.00'); // Original
      expect(html).toContain('$70.00'); // After 30% off
      expect(html).toContain('You save:');
      expect(html).toContain('$30.00 (30%)');
    });

    it('should build price display for fixed discount', () => {
      const discount = { type: 'fixed', value: 20, name: 'Clearance' };
      const html = buildPriceDisplay(discount, 10000);

      expect(html).toContain('$100.00');
      expect(html).toContain('$80.00');
      expect(html).toContain('$20.00 (20)'); // Fixed shows dollar amount without %
    });

    it('should include proper CSS classes', () => {
      const discount = { type: 'percentage', value: 15, name: 'Test' };
      const html = buildPriceDisplay(discount, 5000);

      expect(html).toContain('product-discount-price');
      expect(html).toContain('price--original');
      expect(html).toContain('price--discounted');
      expect(html).toContain('discount-savings');
      expect(html).toContain('savings-label');
      expect(html).toContain('savings-amount');
    });

    it('should show strikethrough on original price', () => {
      const discount = { type: 'percentage', value: 25, name: 'Test' };
      const html = buildPriceDisplay(discount, 8000);

      expect(html).toContain('<s>$80.00</s>');
    });
  });

  /**
   * =================================================================
   * Edge Cases and Integration Tests
   * =================================================================
   */
  describe('Edge Cases', () => {
    it('should handle very small prices', () => {
      const result = calculateDiscount(1, { type: 'percentage', value: 50 });

      expect(result.discountAmount).toBe(1); // Rounds to 1 cent
      expect(result.discountedPrice).toBe(0);
    });

    it('should handle very large prices', () => {
      const result = calculateDiscount(100000000, { type: 'percentage', value: 10 });

      expect(result.discountAmount).toBe(10000000);
      expect(result.discountedPrice).toBe(90000000);
    });

    it('should handle decimal discount values', () => {
      const result = calculateDiscount(10000, { type: 'percentage', value: 12.5 });

      expect(result.discountAmount).toBe(1250);
      expect(result.discountedPrice).toBe(8750);
    });

    it('should handle zero discount value', () => {
      const result = calculateDiscount(10000, { type: 'percentage', value: 0 });

      expect(result.discountAmount).toBe(0);
      expect(result.discountedPrice).toBe(10000);
    });
  });

  describe('Integration - Complete Flow', () => {
    it('should complete full discount calculation and rendering flow', () => {
      const originalPrice = 9999; // $99.99
      const discount = {
        type: 'percentage',
        value: 20,
        name: 'Flash Sale',
      };

      // Calculate
      const calculation = calculateDiscount(originalPrice, discount);
      expect(calculation.discountAmount).toBe(2000); // $20.00
      expect(calculation.discountedPrice).toBe(7999); // $79.99

      // Generate message
      const message = generateDiscountMessage(discount, calculation.discountAmount);
      expect(message).toBe('Save 20% today!');

      // Generate badge
      const badge = generateBadgeHTML(discount, calculation.discountAmount);
      expect(badge).toContain('-20%');

      // Build UI
      const ui = buildDiscountUI(discount, originalPrice);
      expect(ui).toContain('Flash Sale');
      expect(ui).toContain('$99.99');
      expect(ui).toContain('$79.99');
      expect(ui).toContain('Save $20.00');
    });
  });
});
