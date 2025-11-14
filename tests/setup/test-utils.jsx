/**
 * Testing Utilities
 * Custom render functions and helpers for UI testing
 */

import React from 'react';
import { render } from '@testing-library/react';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import { vi } from 'vitest';

/**
 * Custom render function that wraps components with Polaris AppProvider
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @returns {Object} Render result with utilities
 */
export function renderWithPolaris(ui, options = {}) {
  // Mock window.matchMedia for Polaris MediaQueryProvider
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  const Wrapper = ({ children }) => (
    <AppProvider i18n={enTranslations}>{children}</AppProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Create mock loader data for Remix routes
 * @param {Object} data - Data to return from loader
 * @returns {Object} Mock loader data
 */
export function createMockLoaderData(data = {}) {
  return {
    discounts: [],
    products: [],
    ...data,
  };
}

/**
 * Create mock form data
 * @param {Object} data - Form data
 * @returns {FormData}
 */
export function createMockFormData(data = {}) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
}

/**
 * Create mock discount object
 * @param {Object} overrides - Override default values
 * @returns {Object} Discount object
 */
export function createMockDiscount(overrides = {}) {
  return {
    id: 'discount_123',
    name: 'Test Discount',
    type: 'percentage',
    value: 20,
    productIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock product object
 * @param {Object} overrides - Override default values
 * @returns {Object} Product object
 */
export function createMockProduct(overrides = {}) {
  return {
    id: 'gid://shopify/Product/123',
    title: 'Test Product',
    featuredImage: {
      url: 'https://example.com/image.jpg',
      altText: 'Test Product Image',
    },
    status: 'ACTIVE',
    ...overrides,
  };
}

/**
 * Mock Remix navigation state
 * @param {string} state - Navigation state ('idle', 'loading', 'submitting')
 * @param {FormData} formData - Optional form data
 * @returns {Object} Navigation object
 */
export function createMockNavigation(state = 'idle', formData = null) {
  return {
    state,
    formData,
    location: null,
    formMethod: formData ? 'POST' : null,
    formAction: formData ? '/app/discounts' : null,
  };
}

/**
 * Mock submit function for Remix
 * @returns {Function} Mock submit function
 */
export function createMockSubmit() {
  return vi.fn((data, options) => {
    // Simulate form submission
    return Promise.resolve();
  });
}

/**
 * Mock useLoaderData hook
 * @param {Object} data - Data to return
 * @returns {Object} Loader data
 */
export function mockUseLoaderData(data) {
  return vi.fn(() => data);
}

/**
 * Mock Shopify App Bridge
 * @returns {Object} Mock shopify object
 */
export function createMockAppBridge() {
  return {
    toast: {
      show: vi.fn(),
    },
    modal: {
      show: vi.fn(),
      hide: vi.fn(),
    },
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
