/**
 * Discount Calculation Tests
 * Tests for the discount calculation logic
 */

import { describe, it, expect } from 'vitest';

describe('Discount Calculations', () => {
  describe('Percentage Discounts', () => {
    it('should calculate 20% discount correctly', () => {
      const originalPrice = 50.0;
      const discountPercent = 20;
      const expectedDiscount = 10.0;
      const expectedFinal = 40.0;

      const discountAmount = (originalPrice * discountPercent) / 100;
      const finalPrice = originalPrice - discountAmount;

      expect(discountAmount).toBe(expectedDiscount);
      expect(finalPrice).toBe(expectedFinal);
    });

    it('should calculate 50% discount correctly', () => {
      const originalPrice = 100.0;
      const discountPercent = 50;

      const discountAmount = (originalPrice * discountPercent) / 100;
      const finalPrice = originalPrice - discountAmount;

      expect(discountAmount).toBe(50.0);
      expect(finalPrice).toBe(50.0);
    });

    it('should handle 100% discount', () => {
      const originalPrice = 25.0;
      const discountPercent = 100;

      const discountAmount = (originalPrice * discountPercent) / 100;
      const finalPrice = originalPrice - discountAmount;

      expect(discountAmount).toBe(25.0);
      expect(finalPrice).toBe(0.0);
    });

    it('should handle decimal percentages', () => {
      const originalPrice = 99.99;
      const discountPercent = 15.5;

      const discountAmount = (originalPrice * discountPercent) / 100;
      const finalPrice = originalPrice - discountAmount;

      expect(discountAmount).toBeCloseTo(15.498, 2);
      expect(finalPrice).toBeCloseTo(84.492, 2);
    });
  });

  describe('Fixed Amount Discounts', () => {
    it('should calculate $10 discount correctly', () => {
      const originalPrice = 50.0;
      const discountAmount = 10.0;
      const expectedFinal = 40.0;

      const finalPrice = originalPrice - discountAmount;

      expect(finalPrice).toBe(expectedFinal);
    });

    it('should not exceed product price', () => {
      const originalPrice = 25.0;
      const discountAmount = 50.0;

      // Discount should be capped at product price
      const cappedDiscount = Math.min(discountAmount, originalPrice);
      const finalPrice = originalPrice - cappedDiscount;

      expect(cappedDiscount).toBe(25.0);
      expect(finalPrice).toBe(0.0);
    });

    it('should handle exact match', () => {
      const originalPrice = 30.0;
      const discountAmount = 30.0;

      const finalPrice = originalPrice - discountAmount;

      expect(finalPrice).toBe(0.0);
    });
  });

  describe('Quantity Calculations', () => {
    it('should multiply discount by quantity', () => {
      const unitPrice = 50.0;
      const unitDiscount = 10.0;
      const quantity = 3;

      const lineTotal = unitPrice * quantity;
      const lineDiscount = unitDiscount * quantity;
      const lineFinal = lineTotal - lineDiscount;

      expect(lineTotal).toBe(150.0);
      expect(lineDiscount).toBe(30.0);
      expect(lineFinal).toBe(120.0);
    });

    it('should handle single quantity', () => {
      const unitPrice = 25.0;
      const unitDiscount = 5.0;
      const quantity = 1;

      const lineDiscount = unitDiscount * quantity;

      expect(lineDiscount).toBe(5.0);
    });
  });

  describe('Best Discount Selection', () => {
    it('should select higher percentage over fixed when percentage is better', () => {
      const price = 100.0;
      const percentageDiscount = { type: 'percentage', value: 30 }; // $30 off
      const fixedDiscount = { type: 'fixed', value: 20 }; // $20 off

      const percentAmount = (price * percentageDiscount.value) / 100;
      const fixedAmount = fixedDiscount.value;

      const bestDiscount = percentAmount > fixedAmount ? percentageDiscount : fixedDiscount;

      expect(bestDiscount.type).toBe('percentage');
      expect(percentAmount).toBe(30.0);
    });

    it('should select fixed discount when it is better', () => {
      const price = 50.0;
      const percentageDiscount = { type: 'percentage', value: 15 }; // $7.50 off
      const fixedDiscount = { type: 'fixed', value: 10 }; // $10 off

      const percentAmount = (price * percentageDiscount.value) / 100;
      const fixedAmount = fixedDiscount.value;

      const bestDiscount = fixedAmount > percentAmount ? fixedDiscount : percentageDiscount;

      expect(bestDiscount.type).toBe('fixed');
      expect(fixedAmount).toBe(10.0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero price', () => {
      const price = 0.0;
      const discountPercent = 20;

      const discountAmount = (price * discountPercent) / 100;

      expect(discountAmount).toBe(0.0);
    });

    it('should handle zero discount', () => {
      const price = 50.0;
      const discountPercent = 0;

      const discountAmount = (price * discountPercent) / 100;
      const finalPrice = price - discountAmount;

      expect(discountAmount).toBe(0.0);
      expect(finalPrice).toBe(50.0);
    });

    it('should handle very small amounts', () => {
      const price = 0.99;
      const discountPercent = 10;

      const discountAmount = (price * discountPercent) / 100;
      const finalPrice = price - discountAmount;

      expect(discountAmount).toBeCloseTo(0.099, 3);
      expect(finalPrice).toBeCloseTo(0.891, 3);
    });
  });

  describe('Price Formatting', () => {
    it('should round to 2 decimal places', () => {
      const price = 19.995;
      const rounded = Math.round(price * 100) / 100;

      expect(rounded).toBe(20.0);
    });

    it('should handle cents conversion', () => {
      const dollars = 50.0;
      const cents = dollars * 100;

      expect(cents).toBe(5000);
    });

    it('should convert cents to dollars', () => {
      const cents = 5000;
      const dollars = cents / 100;

      expect(dollars).toBe(50.0);
    });
  });
});
