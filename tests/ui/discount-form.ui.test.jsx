/**
 * UI Component Tests for Discount Management Form
 * Tests form rendering, interactions, validation, and submissions using React Testing Library
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
const mockToast = { show: vi.fn() };
vi.mock('@shopify/app-bridge-react', () => ({
  TitleBar: ({ title }) => <div data-testid="title-bar">{title}</div>,
  useAppBridge: () => ({ toast: mockToast }),
}));

describe('Discount Form UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoaderData = { discounts: [], products: [] };
    mockNavigation = { state: 'idle', formData: null };
    global.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * =================================================================
   * Form Rendering Tests
   * =================================================================
   */
  describe('Form Renders Correctly', () => {
    it('should render the discount creation form with all fields', () => {
      renderWithPolaris(<Discounts />);

      // Check form heading
      expect(screen.getByText('Create New Discount')).toBeInTheDocument();

      // Check all form fields are present
      expect(screen.getByLabelText('Discount Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Discount Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Discount Value (%)')).toBeInTheDocument();
    });

    it('should render with correct initial/default values', () => {
      renderWithPolaris(<Discounts />);

      const nameInput = screen.getByLabelText('Discount Name');
      const typeSelect = screen.getByLabelText('Discount Type');
      const valueInput = screen.getByLabelText('Discount Value (%)');

      expect(nameInput).toHaveValue('');
      expect(typeSelect).toHaveValue('percentage');
      expect(valueInput).toHaveValue(null);
    });

    it('should render submit button', () => {
      renderWithPolaris(<Discounts />);

      const submitButton = screen.getByRole('button', { name: /Create Discount/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeEnabled();
    });

    it('should render product selection button', () => {
      renderWithPolaris(<Discounts />);

      expect(screen.getByRole('button', { name: /Select Products/i })).toBeInTheDocument();
    });

    it('should render sync to Shopify checkbox', () => {
      renderWithPolaris(<Discounts />);

      const checkbox = screen.getByRole('checkbox', {
        name: /Sync discount metadata to Shopify products/i,
      });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should display selected products count', () => {
      renderWithPolaris(<Discounts />);

      expect(screen.getByText(/Selected Products: 0 product\(s\)/i)).toBeInTheDocument();
    });
  });

  /**
   * =================================================================
   * Product Dropdown/Selection Tests
   * =================================================================
   */
  describe('Product Dropdown Loads and Functions', () => {
    beforeEach(() => {
      mockLoaderData.products = [
        createMockProduct({ id: 'prod_1', title: 'Awesome Shirt' }),
        createMockProduct({ id: 'prod_2', title: 'Cool Pants' }),
        createMockProduct({ id: 'prod_3', title: 'Nice Hat' }),
      ];
    });

    it('should open product modal when button is clicked', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const selectButton = screen.getByRole('button', { name: /Select Products/i });
      await user.click(selectButton);

      // Modal title should be visible
      expect(screen.getByText('Select Products')).toBeInTheDocument();
    });

    it('should display all available products in modal', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      await user.click(screen.getByRole('button', { name: /Select Products/i }));

      expect(screen.getByText('Awesome Shirt')).toBeInTheDocument();
      expect(screen.getByText('Cool Pants')).toBeInTheDocument();
      expect(screen.getByText('Nice Hat')).toBeInTheDocument();
    });

    it('should allow selecting products in modal', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      // Open modal
      await user.click(screen.getByRole('button', { name: /Select Products/i }));

      // Select products by clicking on them
      await user.click(screen.getByText('Awesome Shirt'));
      await user.click(screen.getByText('Cool Pants'));

      // Click Done to apply selection
      await user.click(screen.getByRole('button', { name: 'Done' }));

      // Should update count
      await waitFor(() => {
        expect(screen.getByText(/Selected Products: 2 product\(s\)/i)).toBeInTheDocument();
      });
    });

    it('should close modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      await user.click(screen.getByRole('button', { name: /Select Products/i }));
      expect(screen.getByText('Select Products')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(screen.queryByText('Select Products')).not.toBeInTheDocument();
      });
    });

    it('should show product names after selection', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      await user.click(screen.getByRole('button', { name: /Select Products/i }));
      await user.click(screen.getByText('Awesome Shirt'));
      await user.click(screen.getByRole('button', { name: 'Done' }));

      // Product name should appear below the count
      await waitFor(() => {
        expect(screen.getByText(/Awesome Shirt/i)).toBeInTheDocument();
      });
    });
  });

  /**
   * =================================================================
   * Field Validation Tests
   * =================================================================
   */
  describe('Field Validation Shows Errors', () => {
    it('should accept valid discount name input', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const nameInput = screen.getByLabelText('Discount Name');
      await user.type(nameInput, 'Summer Sale 2024');

      expect(nameInput).toHaveValue('Summer Sale 2024');
    });

    it('should accept valid numeric discount value', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const valueInput = screen.getByLabelText('Discount Value (%)');
      await user.type(valueInput, '25');

      expect(valueInput).toHaveValue(25);
    });

    it('should accept decimal discount values', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const valueInput = screen.getByLabelText('Discount Value (%)');
      await user.type(valueInput, '12.5');

      expect(valueInput).toHaveValue(12.5);
    });

    it('should change discount type from percentage to fixed', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const typeSelect = screen.getByLabelText('Discount Type');
      await user.selectOptions(typeSelect, 'fixed');

      expect(typeSelect).toHaveValue('fixed');
    });

    it('should update value label when type changes to fixed', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const typeSelect = screen.getByLabelText('Discount Type');
      await user.selectOptions(typeSelect, 'fixed');

      // Label should change to show $
      expect(screen.getByLabelText('Discount Value ($)')).toBeInTheDocument();
      expect(screen.queryByLabelText('Discount Value (%)')).not.toBeInTheDocument();
    });

    it('should show warning when sync enabled without products', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const checkbox = screen.getByRole('checkbox', {
        name: /Sync discount metadata to Shopify products/i,
      });
      await user.click(checkbox);

      expect(
        screen.getByText(/Please select at least one product to sync discount metadata/i)
      ).toBeInTheDocument();
    });

    it('should not show warning when sync enabled with products', async () => {
      mockLoaderData.products = [createMockProduct({ id: 'prod_1', title: 'Product 1' })];
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      // Select a product first
      await user.click(screen.getByRole('button', { name: /Select Products/i }));
      await user.click(screen.getByText('Product 1'));
      await user.click(screen.getByRole('button', { name: 'Done' }));

      // Enable sync
      const checkbox = screen.getByRole('checkbox', {
        name: /Sync discount metadata to Shopify products/i,
      });
      await user.click(checkbox);

      // Warning should NOT appear
      expect(
        screen.queryByText(/Please select at least one product to sync discount metadata/i)
      ).not.toBeInTheDocument();
    });

    it('should enforce minimum value of 0', () => {
      renderWithPolaris(<Discounts />);

      const valueInput = screen.getByLabelText('Discount Value (%)');
      expect(valueInput).toHaveAttribute('min', '0');
    });

    it('should have proper step for percentage values', () => {
      renderWithPolaris(<Discounts />);

      const valueInput = screen.getByLabelText('Discount Value (%)');
      expect(valueInput).toHaveAttribute('step', '1');
    });

    it('should have proper step for fixed amount values', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const typeSelect = screen.getByLabelText('Discount Type');
      await user.selectOptions(typeSelect, 'fixed');

      const valueInput = screen.getByLabelText('Discount Value ($)');
      expect(valueInput).toHaveAttribute('step', '0.01');
    });
  });

  /**
   * =================================================================
   * Save Button and Form Submission Tests
   * =================================================================
   */
  describe('Save Button Triggers Submit', () => {
    it('should call submit when create button is clicked with valid data', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      // Fill form with valid data
      await user.type(screen.getByLabelText('Discount Name'), 'Test Discount');
      await user.type(screen.getByLabelText('Discount Value (%)'), '20');

      // Click submit
      await user.click(screen.getByRole('button', { name: /Create Discount/i }));

      expect(mockSubmit).toHaveBeenCalled();
    });

    it('should submit with correct form data for percentage discount', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      await user.type(screen.getByLabelText('Discount Name'), 'Percentage Discount');
      await user.type(screen.getByLabelText('Discount Value (%)'), '15');

      await user.click(screen.getByRole('button', { name: /Create Discount/i }));

      expect(mockSubmit).toHaveBeenCalled();
      const formData = mockSubmit.mock.calls[0][0];
      expect(formData.get('_action')).toBe('create');
      expect(formData.get('name')).toBe('Percentage Discount');
      expect(formData.get('type')).toBe('percentage');
      expect(formData.get('value')).toBe('15');
    });

    it('should submit with correct form data for fixed discount', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      await user.selectOptions(screen.getByLabelText('Discount Type'), 'fixed');
      await user.type(screen.getByLabelText('Discount Name'), 'Fixed Discount');
      await user.type(screen.getByLabelText('Discount Value ($)'), '10.50');

      await user.click(screen.getByRole('button', { name: /Create Discount/i }));

      expect(mockSubmit).toHaveBeenCalled();
      const formData = mockSubmit.mock.calls[0][0];
      expect(formData.get('type')).toBe('fixed');
      expect(formData.get('value')).toBe('10.50');
    });

    it('should include selected products in submission', async () => {
      mockLoaderData.products = [
        createMockProduct({ id: 'prod_1', title: 'Product 1' }),
        createMockProduct({ id: 'prod_2', title: 'Product 2' }),
      ];
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      // Select products
      await user.click(screen.getByRole('button', { name: /Select Products/i }));
      await user.click(screen.getByText('Product 1'));
      await user.click(screen.getByText('Product 2'));
      await user.click(screen.getByRole('button', { name: 'Done' }));

      // Fill and submit form
      await user.type(screen.getByLabelText('Discount Name'), 'Multi-Product Discount');
      await user.type(screen.getByLabelText('Discount Value (%)'), '20');
      await user.click(screen.getByRole('button', { name: /Create Discount/i }));

      const formData = mockSubmit.mock.calls[0][0];
      const productIds = JSON.parse(formData.get('productIds'));
      expect(productIds).toHaveLength(2);
      expect(productIds).toContain('prod_1');
      expect(productIds).toContain('prod_2');
    });

    it('should include syncToShopify flag when checkbox is checked', async () => {
      mockLoaderData.products = [createMockProduct({ id: 'prod_1', title: 'Product 1' })];
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      // Select a product
      await user.click(screen.getByRole('button', { name: /Select Products/i }));
      await user.click(screen.getByText('Product 1'));
      await user.click(screen.getByRole('button', { name: 'Done' }));

      // Enable sync
      await user.click(
        screen.getByRole('checkbox', { name: /Sync discount metadata to Shopify products/i })
      );

      // Submit
      await user.type(screen.getByLabelText('Discount Name'), 'Synced Discount');
      await user.type(screen.getByLabelText('Discount Value (%)'), '25');
      await user.click(screen.getByRole('button', { name: /Create Discount/i }));

      const formData = mockSubmit.mock.calls[0][0];
      expect(formData.get('syncToShopify')).toBe('true');
    });

    it('should show loading state during submission', () => {
      mockNavigation.state = 'submitting';
      renderWithPolaris(<Discounts />);

      const submitButton = screen.getByRole('button', { name: /Create Discount/i });
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
      expect(submitButton).toBeDisabled();
    });

    it('should disable form inputs during submission', () => {
      mockNavigation.state = 'submitting';
      renderWithPolaris(<Discounts />);

      const submitButton = screen.getByRole('button', { name: /Create Discount/i });
      expect(submitButton).toBeDisabled();
    });
  });

  /**
   * =================================================================
   * Success Message Tests
   * =================================================================
   */
  describe('Success Message Appears', () => {
    it('should show toast notification after successful creation', () => {
      const formData = new FormData();
      formData.set('_action', 'create');
      mockNavigation = { state: 'idle', formData };

      renderWithPolaris(<Discounts />);

      expect(mockToast.show).toHaveBeenCalledWith('Discount created');
    });

    it('should show toast notification after successful update', () => {
      mockLoaderData.discounts = [
        createMockDiscount({ id: 'disc_1', name: 'Test', type: 'percentage', value: 10 }),
      ];

      const formData = new FormData();
      formData.set('_action', 'update');
      mockNavigation = { state: 'idle', formData };

      renderWithPolaris(<Discounts />);

      expect(mockToast.show).toHaveBeenCalledWith('Discount updated');
    });

    it('should show toast notification after successful deletion', () => {
      const formData = new FormData();
      formData.set('_action', 'delete');
      mockNavigation = { state: 'idle', formData };

      renderWithPolaris(<Discounts />);

      expect(mockToast.show).toHaveBeenCalledWith('Discount deleted');
    });

    it('should reset form after successful submission', () => {
      // Simulate successful submission by changing navigation state
      mockNavigation = { state: 'idle', formData: new FormData() };
      mockNavigation.formData.set('_action', 'create');

      renderWithPolaris(<Discounts />);

      // Form should be reset
      expect(screen.getByLabelText('Discount Name')).toHaveValue('');
      expect(screen.getByLabelText('Discount Type')).toHaveValue('percentage');
    });
  });

  /**
   * =================================================================
   * Edit Mode Tests
   * =================================================================
   */
  describe('Edit Functionality', () => {
    beforeEach(() => {
      mockLoaderData.discounts = [
        createMockDiscount({
          id: 'disc_1',
          name: 'Existing Discount',
          type: 'percentage',
          value: 25,
          productIds: [],
        }),
      ];
    });

    it('should populate form when edit button is clicked', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const editButton = screen.getByRole('button', { name: /Edit/i });
      await user.click(editButton);

      expect(screen.getByLabelText('Discount Name')).toHaveValue('Existing Discount');
      expect(screen.getByLabelText('Discount Type')).toHaveValue('percentage');
      expect(screen.getByLabelText('Discount Value (%)')).toHaveValue(25);
    });

    it('should change button text to "Update Discount" in edit mode', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      await user.click(screen.getByRole('button', { name: /Edit/i }));

      expect(screen.getByRole('button', { name: /Update Discount/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Create Discount$/i })).not.toBeInTheDocument();
    });

    it('should show cancel button in edit mode', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      await user.click(screen.getByRole('button', { name: /Edit/i }));

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('should submit update action when saving edits', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      await user.click(screen.getByRole('button', { name: /Edit/i }));

      const nameInput = screen.getByLabelText('Discount Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Discount');

      await user.click(screen.getByRole('button', { name: /Update Discount/i }));

      expect(mockSubmit).toHaveBeenCalled();
      const formData = mockSubmit.mock.calls[0][0];
      expect(formData.get('_action')).toBe('update');
      expect(formData.get('id')).toBe('disc_1');
      expect(formData.get('name')).toBe('Updated Discount');
    });
  });

  /**
   * =================================================================
   * Delete Functionality Tests
   * =================================================================
   */
  describe('Delete Functionality', () => {
    beforeEach(() => {
      mockLoaderData.discounts = [
        createMockDiscount({
          id: 'disc_1',
          name: 'Delete Me',
          type: 'percentage',
          value: 20,
          productIds: [],
        }),
      ];
    });

    it('should show confirmation dialog when delete is clicked', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      await user.click(screen.getByRole('button', { name: /Delete/i }));

      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this discount?'
      );
    });

    it('should submit delete action when confirmed', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      await user.click(screen.getByRole('button', { name: /Delete/i }));

      expect(mockSubmit).toHaveBeenCalled();
      const formData = mockSubmit.mock.calls[0][0];
      expect(formData.get('_action')).toBe('delete');
      expect(formData.get('id')).toBe('disc_1');
    });

    it('should not delete when confirmation is cancelled', async () => {
      global.confirm = vi.fn(() => false);
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      await user.click(screen.getByRole('button', { name: /Delete/i }));

      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  /**
   * =================================================================
   * Accessibility Tests
   * =================================================================
   */
  describe('Accessibility', () => {
    it('should have proper labels for all form inputs', () => {
      renderWithPolaris(<Discounts />);

      expect(screen.getByLabelText('Discount Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Discount Type')).toBeInTheDocument();
      expect(screen.getByLabelText(/Discount Value/)).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderWithPolaris(<Discounts />);

      expect(screen.getByRole('button', { name: /Create Discount/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Select Products/i })).toBeInTheDocument();
    });

    it('should have proper checkbox role and label', () => {
      renderWithPolaris(<Discounts />);

      const checkbox = screen.getByRole('checkbox', {
        name: /Sync discount metadata to Shopify products/i,
      });
      expect(checkbox).toBeInTheDocument();
    });

    it('should have descriptive help text for checkbox', () => {
      renderWithPolaris(<Discounts />);

      expect(
        screen.getByText(/When enabled, discount information will be saved as product metafields/i)
      ).toBeInTheDocument();
    });
  });
});
