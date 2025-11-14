/**
 * Performance Benchmarks for Product Discount Lookup
 * Tests the performance of theme extension discount calculator
 */

import { bench, describe } from 'vitest';
import {
  formatMoney,
  calculateDiscount,
  generateDiscountMessage,
  generateBadgeHTML,
  shouldShowDiscount,
  buildDiscountUI,
} from '../../extensions/product-discount-display/lib/discount-calculator.js';

describe('Product Discount Lookup - Performance', () => {
  /**
   * =================================================================
   * Money Formatting
   * =================================================================
   */
  describe('Money Formatting', () => {
    bench('format money: 100 times', () => {
      for (let i = 0; i < 100; i++) {
        formatMoney(10000);
      }
    });

    bench('format money: 1000 times', () => {
      for (let i = 0; i < 1000; i++) {
        formatMoney(10000);
      }
    });

    bench('format varied amounts: 100 times', () => {
      const amounts = [1000, 5050, 10000, 25000, 99999];
      for (let i = 0; i < 100; i++) {
        formatMoney(amounts[i % 5]);
      }
    });
  });

  /**
   * =================================================================
   * Discount Calculations
   * =================================================================
   */
  describe('Discount Calculations', () => {
    bench('calculate percentage discount: 100 times', () => {
      const discount = { type: 'percentage', value: 20 };
      for (let i = 0; i < 100; i++) {
        calculateDiscount(10000, discount);
      }
    });

    bench('calculate fixed discount: 100 times', () => {
      const discount = { type: 'fixed', value: 15 };
      for (let i = 0; i < 100; i++) {
        calculateDiscount(10000, discount);
      }
    });

    bench('calculate varied discount types: 100 times', () => {
      const discounts = [
        { type: 'percentage', value: 10 },
        { type: 'percentage', value: 25 },
        { type: 'fixed', value: 10 },
        { type: 'fixed', value: 20 },
      ];
      for (let i = 0; i < 100; i++) {
        calculateDiscount(10000, discounts[i % 4]);
      }
    });

    bench('calculate with edge case prices: 100 times', () => {
      const prices = [100, 1000, 10000, 100000];
      const discount = { type: 'percentage', value: 15 };
      for (let i = 0; i < 100; i++) {
        calculateDiscount(prices[i % 4], discount);
      }
    });
  });

  /**
   * =================================================================
   * Message Generation
   * =================================================================
   */
  describe('Message Generation', () => {
    bench('generate percentage message: 100 times', () => {
      const discount = { type: 'percentage', value: 20, name: 'Summer Sale' };
      for (let i = 0; i < 100; i++) {
        generateDiscountMessage(discount);
      }
    });

    bench('generate fixed message: 100 times', () => {
      const discount = { type: 'fixed', value: 15, name: 'Holiday Deal' };
      for (let i = 0; i < 100; i++) {
        generateDiscountMessage(discount);
      }
    });

    bench('generate varied messages: 100 times', () => {
      const discounts = [
        { type: 'percentage', value: 10, name: 'Discount 1' },
        { type: 'percentage', value: 25, name: 'Discount 2' },
        { type: 'fixed', value: 10, name: 'Discount 3' },
        { type: 'fixed', value: 20, name: 'Discount 4' },
      ];
      for (let i = 0; i < 100; i++) {
        generateDiscountMessage(discounts[i % 4]);
      }
    });
  });

  /**
   * =================================================================
   * Badge HTML Generation
   * =================================================================
   */
  describe('Badge HTML Generation', () => {
    bench('generate percentage badge: 100 times', () => {
      const discount = { type: 'percentage', value: 20 };
      for (let i = 0; i < 100; i++) {
        generateBadgeHTML(discount);
      }
    });

    bench('generate fixed badge: 100 times', () => {
      const discount = { type: 'fixed', value: 15 };
      for (let i = 0; i < 100; i++) {
        generateBadgeHTML(discount, 10000);
      }
    });

    bench('generate varied badges: 100 times', () => {
      const discounts = [
        { type: 'percentage', value: 10 },
        { type: 'percentage', value: 25 },
        { type: 'fixed', value: 10 },
        { type: 'fixed', value: 20 },
      ];
      for (let i = 0; i < 100; i++) {
        generateBadgeHTML(discounts[i % 4], 10000);
      }
    });
  });

  /**
   * =================================================================
   * Visibility Logic
   * =================================================================
   */
  describe('Visibility Logic', () => {
    bench('check visibility: valid discount (100 times)', () => {
      const data = { success: true, discount: { type: 'percentage', value: 20 } };
      for (let i = 0; i < 100; i++) {
        shouldShowDiscount(data);
      }
    });

    bench('check visibility: invalid discount (100 times)', () => {
      const data = { success: false, discount: null };
      for (let i = 0; i < 100; i++) {
        shouldShowDiscount(data);
      }
    });

    bench('check visibility: varied cases (100 times)', () => {
      const cases = [
        { success: true, discount: { type: 'percentage', value: 20 } },
        { success: false, discount: null },
        { success: true, discount: null },
        null,
      ];
      for (let i = 0; i < 100; i++) {
        shouldShowDiscount(cases[i % 4]);
      }
    });
  });

  /**
   * =================================================================
   * Complete UI Building
   * =================================================================
   */
  describe('Complete UI Building', () => {
    bench('build complete UI: percentage discount', () => {
      const discount = {
        type: 'percentage',
        value: 20,
        name: 'Summer Sale',
      };
      buildDiscountUI(10000, discount);
    });

    bench('build complete UI: fixed discount', () => {
      const discount = {
        type: 'fixed',
        value: 15,
        name: 'Holiday Deal',
      };
      buildDiscountUI(10000, discount);
    });

    bench('build complete UI: 100 times', () => {
      const discount = { type: 'percentage', value: 20, name: 'Sale' };
      for (let i = 0; i < 100; i++) {
        buildDiscountUI(10000, discount);
      }
    });

    bench('build UI with varied prices: 100 times', () => {
      const prices = [5000, 10000, 15000, 20000];
      const discount = { type: 'percentage', value: 20, name: 'Sale' };
      for (let i = 0; i < 100; i++) {
        buildDiscountUI(prices[i % 4], discount);
      }
    });
  });

  /**
   * =================================================================
   * Realistic Scenarios
   * =================================================================
   */
  describe('Realistic Product Page Scenarios', () => {
    bench('product page load: calculate and display discount', () => {
      const productPrice = 7999; // $79.99
      const discount = { type: 'percentage', value: 25, name: 'Spring Sale' };

      // What happens on product page load
      const calculation = calculateDiscount(productPrice, discount);
      const message = generateDiscountMessage(discount);
      const badge = generateBadgeHTML(discount, productPrice);
      const shouldShow = shouldShowDiscount({
        success: true,
        discount,
      });
    });

    bench('product with multiple price points (variants)', () => {
      const prices = [4999, 5999, 7999]; // Different variants
      const discount = { type: 'percentage', value: 20, name: 'Sale' };

      prices.forEach(price => {
        calculateDiscount(price, discount);
        generateBadgeHTML(discount, price);
      });
    });

    bench('collection page: 20 products with discounts', () => {
      const discount = { type: 'percentage', value: 15, name: 'Collection Sale' };

      for (let i = 0; i < 20; i++) {
        const price = 5000 + (i * 1000); // Varied prices
        calculateDiscount(price, discount);
        generateBadgeHTML(discount, price);
      }
    });

    bench('high-traffic page: 100 rapid calculations', () => {
      const discount = { type: 'percentage', value: 20, name: 'Flash Sale' };
      const price = 9999;

      for (let i = 0; i < 100; i++) {
        calculateDiscount(price, discount);
      }
    });
  });

  /**
   * =================================================================
   * Edge Cases and Validation
   * =================================================================
   */
  describe('Edge Cases', () => {
    bench('handle very small price (100 times)', () => {
      const discount = { type: 'percentage', value: 10 };
      for (let i = 0; i < 100; i++) {
        calculateDiscount(100, discount); // $1.00
      }
    });

    bench('handle very large price (100 times)', () => {
      const discount = { type: 'percentage', value: 10 };
      for (let i = 0; i < 100; i++) {
        calculateDiscount(1000000, discount); // $10,000
      }
    });

    bench('handle 100% discount (100 times)', () => {
      const discount = { type: 'percentage', value: 100 };
      for (let i = 0; i < 100; i++) {
        calculateDiscount(10000, discount);
      }
    });

    bench('handle fixed discount exceeding price (100 times)', () => {
      const discount = { type: 'fixed', value: 150 };
      for (let i = 0; i < 100; i++) {
        calculateDiscount(10000, discount); // $150 discount on $100 item
      }
    });

    bench('handle decimal percentages (100 times)', () => {
      const discount = { type: 'percentage', value: 12.5 };
      for (let i = 0; i < 100; i++) {
        calculateDiscount(10000, discount);
      }
    });
  });

  /**
   * =================================================================
   * String Operations
   * =================================================================
   */
  describe('String Operations Performance', () => {
    bench('template literal formatting: 100 times', () => {
      const value = 20;
      for (let i = 0; i < 100; i++) {
        `Save ${value}% today!`;
      }
    });

    bench('string concatenation: 100 times', () => {
      const value = 20;
      for (let i = 0; i < 100; i++) {
        'Save ' + value + '% today!';
      }
    });

    bench('HTML generation with template literals: 100 times', () => {
      const value = 20;
      for (let i = 0; i < 100; i++) {
        `<span class="badge">-${value}%</span>`;
      }
    });
  });

  /**
   * =================================================================
   * Object Operations
   * =================================================================
   */
  describe('Object Operations', () => {
    bench('create calculation result object: 1000 times', () => {
      for (let i = 0; i < 1000; i++) {
        const result = {
          originalPrice: 10000,
          discountAmount: 2000,
          discountedPrice: 8000,
          savingsPercentage: 20,
          formattedOriginal: '$100.00',
          formattedDiscounted: '$80.00',
          formattedSavings: '$20.00',
        };
      }
    });

    bench('destructure discount object: 1000 times', () => {
      const discount = { type: 'percentage', value: 20, name: 'Sale' };
      for (let i = 0; i < 1000; i++) {
        const { type, value, name } = discount;
      }
    });

    bench('spread discount object: 1000 times', () => {
      const discount = { type: 'percentage', value: 20, name: 'Sale' };
      for (let i = 0; i < 1000; i++) {
        const newDiscount = { ...discount, active: true };
      }
    });
  });
});
