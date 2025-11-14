/**
 * Liquid Template Compilation and Snapshot Tests
 * Tests Liquid template rendering and structure
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock Liquid rendering context
const createMockProduct = (overrides = {}) => ({
  id: 'gid://shopify/Product/123456789',
  title: 'Test Product',
  selected_or_first_available_variant: {
    id: 'gid://shopify/ProductVariant/987654321',
    price: 10000, // $100.00 in cents
    title: 'Default Title',
  },
  ...overrides,
});

const createMockBlock = (settings = {}) => ({
  settings: {
    badge_text: 'Special Offer',
    show_savings: true,
    discount_color: '#ff0000',
    ...settings,
  },
});

/**
 * Read Liquid template file
 */
function readLiquidTemplate(filename) {
  const extensionPath = join(process.cwd(), 'extensions', 'product-discount-display');
  const filePath = join(extensionPath, filename);
  return readFileSync(filePath, 'utf-8');
}

describe('Liquid Template - Compilation Tests', () => {
  /**
   * =================================================================
   * Template Structure Tests
   * =================================================================
   */
  describe('product-discount.liquid - Structure', () => {
    let template;

    beforeEach(() => {
      template = readLiquidTemplate('blocks/product-discount.liquid');
    });

    it('should include CSS stylesheet tag', () => {
      expect(template).toContain("{{ 'product-discount.css' | asset_url | stylesheet_tag }}");
    });

    it('should have discount block container with correct attributes', () => {
      expect(template).toContain('class="product-discount-block"');
      expect(template).toContain('id="discount-block-{{ product.id }}"');
      expect(template).toContain('data-product-id="{{ product.id }}"');
      expect(template).toContain('data-variant-price="{{ product.selected_or_first_available_variant.price }}"');
    });

    it('should have loading state markup', () => {
      expect(template).toContain('class="discount-loading"');
      expect(template).toContain('class="loading-spinner"');
      expect(template).toContain('Checking for discounts...');
    });

    it('should include embedded JavaScript', () => {
      expect(template).toContain('<script>');
      expect(template).toContain('</script>');
      expect(template).toMatch(/fetch\(['"]/);
    });

    it('should have schema definition', () => {
      expect(template).toContain('{% schema %}');
      expect(template).toContain('{% endschema %}');
      expect(template).toContain('"name": "Product Discount"');
    });

    it('should define schema settings', () => {
      expect(template).toContain('"badge_text"');
      expect(template).toContain('"show_savings"');
      expect(template).toContain('"discount_color"');
    });

    it('should use product variables correctly', () => {
      expect(template).toContain('{{ product.id }}');
      expect(template).toContain('{{ product.selected_or_first_available_variant.price }}');
    });

    it('should use block settings', () => {
      expect(template).toContain("{{ block.settings.badge_text | default: 'Special Offer' }}");
    });
  });

  describe('product-discount-price.liquid - Structure', () => {
    let template;

    beforeEach(() => {
      template = readLiquidTemplate('snippets/product-discount-price.liquid');
    });

    it('should handle variant parameter', () => {
      expect(template).toContain('{% if variant %}');
      expect(template).toContain('{% assign current_variant = variant %}');
    });

    it('should fallback to first available variant', () => {
      expect(template).toContain('{% else %}');
      expect(template).toContain('{% assign current_variant = product.selected_or_first_available_variant %}');
    });

    it('should have price wrapper with data attributes', () => {
      expect(template).toContain('class="product-discount-price-wrapper"');
      expect(template).toContain('id="discount-price-{{ product.id }}"');
      expect(template).toContain('data-product-id="{{ product.id }}"');
      expect(template).toContain('data-variant-price="{{ current_variant.price }}"');
    });

    it('should display initial price', () => {
      expect(template).toContain('{{ current_variant.price | money }}');
    });

    it('should include fetch logic', () => {
      expect(template).toContain("fetch('/apps/discount-proxy/product-discount?productId='");
    });

    it('should handle percentage and fixed discounts', () => {
      expect(template).toContain("discount.type === 'percentage'");
      expect(template).toContain("discount.type === 'fixed'");
    });
  });

  describe('product-discount-badge.liquid - Structure', () => {
    let template;

    beforeEach(() => {
      template = readLiquidTemplate('snippets/product-discount-badge.liquid');
    });

    it('should have badge wrapper with hidden initial state', () => {
      expect(template).toContain('class="product-discount-badge-wrapper"');
      expect(template).toContain('id="discount-badge-{{ product.id }}"');
      expect(template).toContain('style="display: none;"');
    });

    it('should fetch discount data', () => {
      expect(template).toContain("fetch('/apps/discount-proxy/product-discount?productId='");
    });

    it('should generate percentage badge', () => {
      expect(template).toContain('discount-badge--percentage');
      expect(template).toContain('-${discount.value}%');
    });

    it('should generate fixed amount badge', () => {
      expect(template).toContain('discount-badge--fixed');
      expect(template).toContain('-${formatMoney(discountAmount)}');
    });

    it('should show badge when discount exists', () => {
      expect(template).toContain("badgeWrapper.style.display = 'inline-block'");
    });
  });

  /**
   * =================================================================
   * JavaScript Logic Tests (in Liquid)
   * =================================================================
   */
  describe('Embedded JavaScript Logic', () => {
    describe('Fetch URL Construction', () => {
      it('should construct correct API URL in product-discount.liquid', () => {
        const template = readLiquidTemplate('blocks/product-discount.liquid');
        expect(template).toContain("/apps/discount-proxy/product-discount?productId=' + productId");
      });

      it('should construct correct API URL in product-discount-price.liquid', () => {
        const template = readLiquidTemplate('snippets/product-discount-price.liquid');
        expect(template).toContain("/apps/discount-proxy/product-discount?productId=' + productId");
      });

      it('should construct correct API URL in product-discount-badge.liquid', () => {
        const template = readLiquidTemplate('snippets/product-discount-badge.liquid');
        expect(template).toContain("/apps/discount-proxy/product-discount?productId=' + productId");
      });
    });

    describe('Price Calculation Logic', () => {
      it('should include percentage calculation in product-discount.liquid', () => {
        const template = readLiquidTemplate('blocks/product-discount.liquid');
        expect(template).toContain('(originalPrice * discount.value) / 100');
      });

      it('should include fixed amount calculation', () => {
        const template = readLiquidTemplate('blocks/product-discount.liquid');
        expect(template).toContain('discount.value * 100'); // Convert dollars to cents
      });

      it('should calculate final discounted price', () => {
        const template = readLiquidTemplate('blocks/product-discount.liquid');
        expect(template).toContain('originalPrice - discountAmount');
      });
    });

    describe('Money Formatting', () => {
      it('should define formatMoney function', () => {
        const template = readLiquidTemplate('blocks/product-discount.liquid');
        expect(template).toContain('const formatMoney = (cents)');
        expect(template).toContain("'$' + (cents / 100).toFixed(2)");
      });

      it('should use formatMoney for all price displays', () => {
        const template = readLiquidTemplate('blocks/product-discount.liquid');
        expect(template).toMatch(/formatMoney\(originalPrice\)/);
        expect(template).toMatch(/formatMoney\(discountedPrice\)/);
        expect(template).toMatch(/formatMoney\(discountAmount\)/);
      });
    });

    describe('Conditional Rendering', () => {
      it('should check for successful discount data', () => {
        const template = readLiquidTemplate('blocks/product-discount.liquid');
        expect(template).toContain('data && data.success && data.discount');
      });

      it('should hide block when no discount', () => {
        const template = readLiquidTemplate('blocks/product-discount.liquid');
        expect(template).toContain("discountBlock.style.display = 'none'");
      });

      it('should show block when discount exists', () => {
        const template = readLiquidTemplate('blocks/product-discount.liquid');
        expect(template).toContain("discountBlock.style.display = 'block'");
      });
    });

    describe('Error Handling', () => {
      it('should handle fetch errors', () => {
        const template = readLiquidTemplate('blocks/product-discount.liquid');
        expect(template).toContain('.catch(error =>');
        expect(template).toContain("console.error('Error loading discount:', error)");
      });

      it('should hide block on error', () => {
        const template = readLiquidTemplate('blocks/product-discount.liquid');
        expect(template).toMatch(/\.catch.*discountBlock\.style\.display = 'none'/s);
      });
    });
  });

  /**
   * =================================================================
   * Snapshot Tests
   * =================================================================
   */
  describe('Template Snapshots', () => {
    it('should match snapshot for product-discount.liquid', () => {
      const template = readLiquidTemplate('blocks/product-discount.liquid');
      expect(template).toMatchSnapshot();
    });

    it('should match snapshot for product-discount-price.liquid', () => {
      const template = readLiquidTemplate('snippets/product-discount-price.liquid');
      expect(template).toMatchSnapshot();
    });

    it('should match snapshot for product-discount-badge.liquid', () => {
      const template = readLiquidTemplate('snippets/product-discount-badge.liquid');
      expect(template).toMatchSnapshot();
    });

    it('should match snapshot for stars.liquid', () => {
      const template = readLiquidTemplate('snippets/stars.liquid');
      expect(template).toMatchSnapshot();
    });

    it('should match snapshot for star_rating.liquid', () => {
      const template = readLiquidTemplate('blocks/star_rating.liquid');
      expect(template).toMatchSnapshot();
    });
  });

  /**
   * =================================================================
   * Schema Validation Tests
   * =================================================================
   */
  describe('Schema Validation', () => {
    it('should have valid JSON schema', () => {
      const template = readLiquidTemplate('blocks/product-discount.liquid');
      const schemaMatch = template.match(/{% schema %}([\s\S]*?){% endschema %}/);

      expect(schemaMatch).toBeTruthy();

      const schemaJSON = schemaMatch[1].trim();

      // Should be valid JSON
      expect(() => JSON.parse(schemaJSON)).not.toThrow();

      const schema = JSON.parse(schemaJSON);
      expect(schema.name).toBe('Product Discount');
      expect(schema.target).toBe('section');
      expect(Array.isArray(schema.settings)).toBe(true);
    });

    it('should have required schema fields', () => {
      const template = readLiquidTemplate('blocks/product-discount.liquid');
      const schemaMatch = template.match(/{% schema %}([\s\S]*?){% endschema %}/);
      const schema = JSON.parse(schemaMatch[1].trim());

      expect(schema).toHaveProperty('name');
      expect(schema).toHaveProperty('target');
      expect(schema).toHaveProperty('settings');
    });

    it('should define all settings with required properties', () => {
      const template = readLiquidTemplate('blocks/product-discount.liquid');
      const schemaMatch = template.match(/{% schema %}([\s\S]*?){% endschema %}/);
      const schema = JSON.parse(schemaMatch[1].trim());

      schema.settings.forEach(setting => {
        expect(setting).toHaveProperty('type');
        expect(setting).toHaveProperty('id');
        expect(setting).toHaveProperty('label');
      });
    });
  });

  /**
   * =================================================================
   * Comment Documentation Tests
   * =================================================================
   */
  describe('Template Documentation', () => {
    it('should have usage comment in product-discount-price.liquid', () => {
      const template = readLiquidTemplate('snippets/product-discount-price.liquid');
      expect(template).toContain("{% comment %}");
      expect(template).toContain("Usage:");
      expect(template).toContain("{% render 'product-discount-price'");
    });

    it('should have description comment in product-discount-badge.liquid', () => {
      const template = readLiquidTemplate('snippets/product-discount-badge.liquid');
      expect(template).toContain("{% comment %}");
      expect(template).toContain("Product Discount Badge");
    });

    it('should document block purpose', () => {
      const template = readLiquidTemplate('blocks/product-discount.liquid');
      expect(template).toContain("{% comment %}");
      expect(template).toContain("Product Discount Display Block");
    });
  });

  /**
   * =================================================================
   * Integration with Shopify APIs
   * =================================================================
   */
  describe('Shopify Liquid Filters', () => {
    it('should use money filter for price display', () => {
      const template = readLiquidTemplate('snippets/product-discount-price.liquid');
      expect(template).toContain('| money');
    });

    it('should use asset_url filter for CSS', () => {
      const template = readLiquidTemplate('blocks/product-discount.liquid');
      expect(template).toContain('| asset_url');
      expect(template).toContain('| stylesheet_tag');
    });

    it('should use default filter for settings', () => {
      const template = readLiquidTemplate('blocks/product-discount.liquid');
      expect(template).toContain("| default: 'Special Offer'");
    });
  });
});

/**
 * =================================================================
 * Shopify CLI Build Tests
 * =================================================================
 */
describe('Shopify CLI Build Validation', () => {
  it('should have valid extension configuration', () => {
    const configPath = join(
      process.cwd(),
      'extensions',
      'product-discount-display',
      'shopify.extension.toml'
    );

    const config = readFileSync(configPath, 'utf-8');

    expect(config).toContain('type =');
    expect(config).toContain('name =');
  });

  it('should have all required files in extension directory', () => {
    const fs = require('fs');
    const extensionPath = join(process.cwd(), 'extensions', 'product-discount-display');

    expect(fs.existsSync(join(extensionPath, 'shopify.extension.toml'))).toBe(true);
    expect(fs.existsSync(join(extensionPath, 'blocks', 'product-discount.liquid'))).toBe(true);
    expect(fs.existsSync(join(extensionPath, 'snippets', 'product-discount-price.liquid'))).toBe(true);
    expect(fs.existsSync(join(extensionPath, 'snippets', 'product-discount-badge.liquid'))).toBe(true);
  });
});
