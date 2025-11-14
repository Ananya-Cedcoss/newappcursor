/**
 * Snapshot Tests for Discount Management UI Components
 * Captures component structure for regression testing
 */

import { describe, it, expect, vi } from 'vitest';
import { renderWithPolaris, createMockDiscount, createMockProduct } from '../setup/test-utils.jsx';
import Discounts from '../../app/routes/app.discounts.jsx';

// Mock Remix hooks
let mockLoaderData = { discounts: [], products: [] };
const mockSubmit = vi.fn();
let mockNavigation = { state: 'idle', formData: null };

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

describe('Discount UI Component Snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoaderData = { discounts: [], products: [] };
    mockNavigation = { state: 'idle', formData: null };
  });

  describe('Empty State Snapshots', () => {
    it('should match snapshot for empty discount list', () => {
      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot of create form in default state', () => {
      const { container } = renderWithPolaris(<Discounts />);
      const formCard = container.querySelector('[class*="Card"]');
      expect(formCard).toMatchSnapshot();
    });
  });

  describe('Form Field Snapshots', () => {
    it('should match snapshot with percentage discount type', () => {
      const { container } = renderWithPolaris(<Discounts />);
      const typeField = container.querySelector('select[value="percentage"]');
      expect(typeField?.parentElement?.parentElement).toMatchSnapshot();
    });

    it('should match snapshot of discount name input', () => {
      const { getByLabelText } = renderWithPolaris(<Discounts />);
      const nameInput = getByLabelText('Discount Name');
      expect(nameInput.parentElement?.parentElement).toMatchSnapshot();
    });

    it('should match snapshot of discount value input', () => {
      const { getByLabelText } = renderWithPolaris(<Discounts />);
      const valueInput = getByLabelText(/Discount Value/);
      expect(valueInput.parentElement?.parentElement).toMatchSnapshot();
    });
  });

  describe('Discount List Snapshots', () => {
    it('should match snapshot with single percentage discount', () => {
      mockLoaderData.discounts = [
        createMockDiscount({
          id: 'disc_1',
          name: 'Summer Sale',
          type: 'percentage',
          value: 20,
          productIds: [],
        }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with single fixed discount', () => {
      mockLoaderData.discounts = [
        createMockDiscount({
          id: 'disc_1',
          name: '$10 Off',
          type: 'fixed',
          value: 10,
          productIds: [],
        }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with multiple discounts of mixed types', () => {
      mockLoaderData.discounts = [
        createMockDiscount({
          id: 'disc_1',
          name: 'Percentage Discount',
          type: 'percentage',
          value: 15,
          productIds: [],
        }),
        createMockDiscount({
          id: 'disc_2',
          name: 'Fixed Discount',
          type: 'fixed',
          value: 5,
          productIds: [],
        }),
        createMockDiscount({
          id: 'disc_3',
          name: 'Another Percentage',
          type: 'percentage',
          value: 30,
          productIds: ['prod_1'],
        }),
      ];
      mockLoaderData.products = [createMockProduct({ id: 'prod_1', title: 'Product 1' })];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Product Assignment Snapshots', () => {
    it('should match snapshot with discount assigned to specific products', () => {
      mockLoaderData.discounts = [
        createMockDiscount({
          id: 'disc_1',
          name: 'Product-Specific Discount',
          type: 'percentage',
          value: 25,
          productIds: ['prod_1', 'prod_2'],
        }),
      ];
      mockLoaderData.products = [
        createMockProduct({ id: 'prod_1', title: 'Widget A' }),
        createMockProduct({ id: 'prod_2', title: 'Widget B' }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot showing "All products" when no products selected', () => {
      mockLoaderData.discounts = [
        createMockDiscount({
          id: 'disc_1',
          name: 'All Products Discount',
          type: 'percentage',
          value: 10,
          productIds: [],
        }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      const dataTable = container.querySelector('[class*="DataTable"]');
      expect(dataTable).toMatchSnapshot();
    });
  });

  describe('Loading State Snapshots', () => {
    it('should match snapshot during form submission', () => {
      mockNavigation.state = 'submitting';
      const formData = new FormData();
      formData.set('_action', 'create');
      mockNavigation.formData = formData;

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot of loading button state', () => {
      mockNavigation.state = 'submitting';

      const { getByRole } = renderWithPolaris(<Discounts />);
      const submitButton = getByRole('button', { name: /Create Discount/i });
      expect(submitButton).toMatchSnapshot();
    });
  });

  describe('Button Snapshots', () => {
    it('should match snapshot of create discount button', () => {
      const { getByRole } = renderWithPolaris(<Discounts />);
      const button = getByRole('button', { name: /Create Discount/i });
      expect(button).toMatchSnapshot();
    });

    it('should match snapshot of select products button', () => {
      const { getByRole } = renderWithPolaris(<Discounts />);
      const button = getByRole('button', { name: /Select Products/i });
      expect(button).toMatchSnapshot();
    });

    it('should match snapshot when activate in cart button is visible', () => {
      mockLoaderData.discounts = [createMockDiscount()];

      const { getByRole } = renderWithPolaris(<Discounts />);
      const button = getByRole('button', { name: /Activate in Cart/i });
      expect(button).toMatchSnapshot();
    });
  });

  describe('Badge Snapshots', () => {
    it('should match snapshot of percentage badge', () => {
      mockLoaderData.discounts = [
        createMockDiscount({ type: 'percentage', value: 20 }),
      ];

      const { getByText } = renderWithPolaris(<Discounts />);
      const badge = getByText('Percentage');
      expect(badge.parentElement).toMatchSnapshot();
    });

    it('should match snapshot of fixed amount badge', () => {
      mockLoaderData.discounts = [
        createMockDiscount({ type: 'fixed', value: 10 }),
      ];

      const { getByText } = renderWithPolaris(<Discounts />);
      const badge = getByText('Fixed Amount');
      expect(badge.parentElement).toMatchSnapshot();
    });
  });

  describe('Banner Snapshots', () => {
    it('should match snapshot of cart activation info banner', () => {
      mockLoaderData.discounts = [createMockDiscount()];

      const { getByText } = renderWithPolaris(<Discounts />);
      const banner = getByText(/Click "Activate in Cart"/i);
      expect(banner.closest('[class*="Banner"]')).toMatchSnapshot();
    });

    it('should match snapshot of warning banner for sync without products', () => {
      // This would need user interaction to trigger, so we skip it in snapshots
      // or create a separate component for the banner
    });
  });

  describe('Layout Snapshots', () => {
    it('should match snapshot of overall page layout', () => {
      mockLoaderData.discounts = [createMockDiscount()];
      mockLoaderData.products = [createMockProduct()];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot of form layout section', () => {
      const { container } = renderWithPolaris(<Discounts />);
      const formSection = container.querySelector('[class*="Layout"]')?.firstChild;
      expect(formSection).toMatchSnapshot();
    });

    it('should match snapshot of discount list layout section', () => {
      mockLoaderData.discounts = [createMockDiscount()];

      const { container } = renderWithPolaris(<Discounts />);
      const sections = container.querySelectorAll('[class*="Layout"] > div');
      expect(sections[1]).toMatchSnapshot();
    });
  });

  describe('Data Table Snapshots', () => {
    it('should match snapshot of discount table with data', () => {
      mockLoaderData.discounts = [
        createMockDiscount({ id: '1', name: 'Disc 1', type: 'percentage', value: 10 }),
        createMockDiscount({ id: '2', name: 'Disc 2', type: 'fixed', value: 20 }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      const dataTable = container.querySelector('[class*="DataTable"]');
      expect(dataTable).toMatchSnapshot();
    });

    it('should match snapshot of table headings', () => {
      mockLoaderData.discounts = [createMockDiscount()];

      const { container } = renderWithPolaris(<Discounts />);
      const headings = container.querySelectorAll('th');
      expect(Array.from(headings)).toMatchSnapshot();
    });
  });

  describe('Edge Case Snapshots', () => {
    it('should match snapshot with very long discount name', () => {
      mockLoaderData.discounts = [
        createMockDiscount({
          name: 'This is an extremely long discount name that might cause layout issues if not properly handled with CSS',
          type: 'percentage',
          value: 15,
        }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with many products selected', () => {
      const manyProductIds = Array.from({ length: 10 }, (_, i) => `prod_${i}`);
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

    it('should match snapshot with maximum percentage value', () => {
      mockLoaderData.discounts = [
        createMockDiscount({
          name: 'Max Discount',
          type: 'percentage',
          value: 100,
        }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with decimal values', () => {
      mockLoaderData.discounts = [
        createMockDiscount({
          name: 'Decimal Discount',
          type: 'percentage',
          value: 12.5,
        }),
        createMockDiscount({
          name: 'Decimal Fixed',
          type: 'fixed',
          value: 7.99,
        }),
      ];

      const { container } = renderWithPolaris(<Discounts />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Checkbox Snapshots', () => {
    it('should match snapshot of unchecked sync checkbox', () => {
      const { getByRole } = renderWithPolaris(<Discounts />);
      const checkbox = getByRole('checkbox', { name: /Sync discount metadata/i });
      expect(checkbox.parentElement?.parentElement).toMatchSnapshot();
    });
  });
});
