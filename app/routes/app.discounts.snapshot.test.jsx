/**
 * Snapshot Tests for Discount Management UI
 * Captures component structure for regression testing
 */

import { describe, it, expect, vi } from 'vitest';
import { renderWithPolaris, createMockDiscount, createMockProduct } from '../../tests/setup/test-utils.jsx';
import Discounts from './app.discounts.jsx';

// Mock Remix hooks
const mockLoaderData = { discounts: [], products: [] };
const mockSubmit = vi.fn();
const mockNavigation = { state: 'idle', formData: null };

vi.mock('@remix-run/react', () => ({
  useLoaderData: () => mockLoaderData,
  useSubmit: () => mockSubmit,
  useNavigation: () => mockNavigation,
  Form: ({ children, ...props }) => <form {...props}>{children}</form>,
}));

// Mock Shopify App Bridge
vi.mock('@shopify/app-bridge-react', () => ({
  TitleBar: ({ title }) => <div data-testid="title-bar">{title}</div>,
  useAppBridge: () => ({ toast: { show: vi.fn() } }),
}));

describe('Discount Management UI Snapshots', () => {
  describe('Empty State', () => {
    it('should match snapshot for empty discount list', () => {
      mockLoaderData.discounts = [];
      mockLoaderData.products = [];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Form States', () => {
    it('should match snapshot for create form (default state)', () => {
      mockLoaderData.discounts = [];
      mockLoaderData.products = [];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container.querySelector('form')).toMatchSnapshot();
    });

    it('should match snapshot with percentage discount type selected', () => {
      mockLoaderData.discounts = [];
      mockLoaderData.products = [];

      const { container } = renderWithPolaris(<Discounts />);
      const formSection = container.querySelector('form');
      expect(formSection).toMatchSnapshot();
    });
  });

  describe('Discount List', () => {
    it('should match snapshot with single discount', () => {
      mockLoaderData.discounts = [
        createMockDiscount({
          id: 'disc_1',
          name: 'Summer Sale',
          type: 'percentage',
          value: 20,
          productIds: [],
        }),
      ];
      mockLoaderData.products = [];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with multiple discounts', () => {
      mockLoaderData.discounts = [
        createMockDiscount({
          id: 'disc_1',
          name: 'Summer Sale',
          type: 'percentage',
          value: 20,
          productIds: [],
        }),
        createMockDiscount({
          id: 'disc_2',
          name: 'Winter Discount',
          type: 'fixed',
          value: 10,
          productIds: [],
        }),
        createMockDiscount({
          id: 'disc_3',
          name: 'Spring Special',
          type: 'percentage',
          value: 15,
          productIds: ['prod_1', 'prod_2'],
        }),
      ];
      mockLoaderData.products = [
        createMockProduct({ id: 'prod_1', title: 'Product 1' }),
        createMockProduct({ id: 'prod_2', title: 'Product 2' }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with discount types badges', () => {
      mockLoaderData.discounts = [
        createMockDiscount({ type: 'percentage', value: 25 }),
        createMockDiscount({ type: 'fixed', value: 5 }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      const badges = container.querySelectorAll('[class*="Badge"]');
      expect(badges).toMatchSnapshot();
    });
  });

  describe('Product Display', () => {
    it('should match snapshot when products are assigned to discount', () => {
      mockLoaderData.discounts = [
        createMockDiscount({
          id: 'disc_1',
          name: 'Product-Specific Discount',
          type: 'percentage',
          value: 30,
          productIds: ['prod_1', 'prod_2', 'prod_3'],
        }),
      ];
      mockLoaderData.products = [
        createMockProduct({ id: 'prod_1', title: 'Widget A' }),
        createMockProduct({ id: 'prod_2', title: 'Widget B' }),
        createMockProduct({ id: 'prod_3', title: 'Widget C' }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Button States', () => {
    it('should match snapshot with activate in cart button visible', () => {
      mockLoaderData.discounts = [createMockDiscount()];

      const { container } = renderWithPolaris(<Discounts />);
      const activateButton = container.querySelector('[class*="Button"]');
      expect(activateButton).toMatchSnapshot();
    });
  });

  describe('Info Banners', () => {
    it('should match snapshot with info banner about cart activation', () => {
      mockLoaderData.discounts = [createMockDiscount()];

      const { container } = renderWithPolaris(<Discounts />);
      const banner = container.querySelector('[class*="Banner"]');
      expect(banner).toMatchSnapshot();
    });
  });

  describe('Loading States', () => {
    it('should match snapshot during form submission', () => {
      mockLoaderData.discounts = [];
      Object.assign(mockNavigation, { state: 'submitting', formData: new FormData() });

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Data Table', () => {
    it('should match snapshot of discount data table structure', () => {
      mockLoaderData.discounts = [
        createMockDiscount({ id: '1', name: 'Disc 1', type: 'percentage', value: 10 }),
        createMockDiscount({ id: '2', name: 'Disc 2', type: 'fixed', value: 20 }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      const dataTable = container.querySelector('[class*="DataTable"]');
      expect(dataTable).toMatchSnapshot();
    });

    it('should match snapshot with table headings', () => {
      mockLoaderData.discounts = [createMockDiscount()];

      const { container } = renderWithPolaris(<Discounts />);
      const tableHeadings = container.querySelectorAll('th');
      expect(tableHeadings).toMatchSnapshot();
    });
  });

  describe('Page Layout', () => {
    it('should match snapshot of overall page structure', () => {
      mockLoaderData.discounts = [createMockDiscount()];
      mockLoaderData.products = [createMockProduct()];

      const { container } = renderWithPolaris(<Discounts />);
      const page = container.querySelector('[class*="Page"]');
      expect(page).toMatchSnapshot();
    });

    it('should match snapshot of layout sections', () => {
      mockLoaderData.discounts = [createMockDiscount()];

      const { container } = renderWithPolaris(<Discounts />);
      const layout = container.querySelector('[class*="Layout"]');
      expect(layout).toMatchSnapshot();
    });
  });

  describe('Complex Scenarios', () => {
    it('should match snapshot with all features visible', () => {
      mockLoaderData.discounts = [
        createMockDiscount({
          id: 'disc_1',
          name: 'Complex Discount',
          type: 'percentage',
          value: 25,
          productIds: ['prod_1'],
        }),
      ];
      mockLoaderData.products = [
        createMockProduct({ id: 'prod_1', title: 'Test Product' }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with mixed discount types', () => {
      mockLoaderData.discounts = [
        createMockDiscount({ type: 'percentage', value: 10 }),
        createMockDiscount({ type: 'fixed', value: 5 }),
        createMockDiscount({ type: 'percentage', value: 20 }),
        createMockDiscount({ type: 'fixed', value: 15 }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Edge Cases', () => {
    it('should match snapshot with very long discount name', () => {
      mockLoaderData.discounts = [
        createMockDiscount({
          name: 'This is a very long discount name that might cause layout issues if not handled properly',
          type: 'percentage',
          value: 10,
        }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with large number of selected products', () => {
      const manyProductIds = Array.from({ length: 20 }, (_, i) => `prod_${i}`);
      const manyProducts = manyProductIds.map((id, i) =>
        createMockProduct({ id, title: `Product ${i + 1}` })
      );

      mockLoaderData.discounts = [
        createMockDiscount({
          name: 'Many Products Discount',
          productIds: manyProductIds,
        }),
      ];
      mockLoaderData.products = manyProducts;

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with very high discount value', () => {
      mockLoaderData.discounts = [
        createMockDiscount({
          name: 'Maximum Discount',
          type: 'percentage',
          value: 99.99,
        }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });
  });
});
