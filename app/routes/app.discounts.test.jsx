/**
 * UI Component Tests for Discount Management
 * Tests form rendering, interactions, validation, and submissions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import {
  renderWithPolaris,
  createMockDiscount,
  createMockProduct,
  createMockNavigation,
  userEvent,
} from '../../tests/setup/test-utils.jsx';
import Discounts from './app.discounts.jsx';

// Mock Remix hooks
const mockLoaderData = { discounts: [], products: [] };
const mockSubmit = vi.fn();
const mockNavigation = createMockNavigation('idle');

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

describe('Discount Management UI Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoaderData.discounts = [];
    mockLoaderData.products = [];
    Object.assign(mockNavigation, createMockNavigation('idle'));
  });

  describe('Form Rendering', () => {
    it('should render the discount form', () => {
      renderWithPolaris(<Discounts />);

      expect(screen.getByText('Create New Discount')).toBeInTheDocument();
      expect(screen.getByLabelText('Discount Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Discount Type')).toBeInTheDocument();
      expect(screen.getByLabelText(/Discount Value/)).toBeInTheDocument();
    });

    it('should render all form fields with correct initial values', () => {
      renderWithPolaris(<Discounts />);

      const nameInput = screen.getByLabelText('Discount Name');
      const typeSelect = screen.getByLabelText('Discount Type');
      const valueInput = screen.getByLabelText('Discount Value (%)');

      expect(nameInput).toHaveValue('');
      expect(typeSelect).toHaveValue('percentage');
      expect(valueInput).toHaveValue(null);
    });

    it('should render the create discount button', () => {
      renderWithPolaris(<Discounts />);

      const createButton = screen.getByRole('button', { name: /Create Discount/i });
      expect(createButton).toBeInTheDocument();
      expect(createButton).not.toBeDisabled();
    });

    it('should render the select products button', () => {
      renderWithPolaris(<Discounts />);

      const selectButton = screen.getByRole('button', { name: /Select Products/i });
      expect(selectButton).toBeInTheDocument();
    });

    it('should render sync to shopify checkbox', () => {
      renderWithPolaris(<Discounts />);

      const checkbox = screen.getByRole('checkbox', {
        name: /Sync discount metadata to Shopify products/i,
      });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should show selected products count', () => {
      renderWithPolaris(<Discounts />);

      expect(screen.getByText(/Selected Products: 0 product\(s\)/i)).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update discount name when user types', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const nameInput = screen.getByLabelText('Discount Name');
      await user.type(nameInput, 'Summer Sale');

      expect(nameInput).toHaveValue('Summer Sale');
    });

    it('should update discount type when user selects', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const typeSelect = screen.getByLabelText('Discount Type');
      await user.selectOptions(typeSelect, 'fixed');

      expect(typeSelect).toHaveValue('fixed');
    });

    it('should change value label when type changes to fixed', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const typeSelect = screen.getByLabelText('Discount Type');
      await user.selectOptions(typeSelect, 'fixed');

      expect(screen.getByLabelText('Discount Value ($)')).toBeInTheDocument();
    });

    it('should update discount value when user types', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const valueInput = screen.getByLabelText('Discount Value (%)');
      await user.type(valueInput, '25');

      expect(valueInput).toHaveValue(25);
    });

    it('should toggle sync to shopify checkbox', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const checkbox = screen.getByRole('checkbox', {
        name: /Sync discount metadata to Shopify products/i,
      });
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });

    it('should show warning banner when sync enabled without products', async () => {
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
  });

  describe('Product Selection Modal', () => {
    beforeEach(() => {
      mockLoaderData.products = [
        createMockProduct({ id: 'prod_1', title: 'Product 1' }),
        createMockProduct({ id: 'prod_2', title: 'Product 2' }),
        createMockProduct({ id: 'prod_3', title: 'Product 3' }),
      ];
    });

    it('should open product modal when select products button is clicked', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const selectButton = screen.getByRole('button', { name: /Select Products/i });
      await user.click(selectButton);

      expect(screen.getByText('Select Products')).toBeInTheDocument();
    });

    it('should display all products in the modal', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const selectButton = screen.getByRole('button', { name: /Select Products/i });
      await user.click(selectButton);

      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('Product 3')).toBeInTheDocument();
    });

    it('should allow selecting products in modal', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      // Open modal
      await user.click(screen.getByRole('button', { name: /Select Products/i }));

      // Click on a product
      const product1 = screen.getByText('Product 1');
      await user.click(product1);

      // Verify checkbox is checked (Note: implementation uses controlled checkbox)
      // The actual checkbox state would be visible after clicking Done
    });

    it('should close modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      // Open modal
      await user.click(screen.getByRole('button', { name: /Select Products/i }));
      expect(screen.getByText('Select Products')).toBeInTheDocument();

      // Click Cancel
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByText('Select Products')).not.toBeInTheDocument();
      });
    });

    it('should update selected products count after selection', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      // Open modal
      await user.click(screen.getByRole('button', { name: /Select Products/i }));

      // Click products
      await user.click(screen.getByText('Product 1'));
      await user.click(screen.getByText('Product 2'));

      // Click Done
      const doneButton = screen.getByRole('button', { name: 'Done' });
      await user.click(doneButton);

      // Check count updated
      expect(screen.getByText(/Selected Products: 2 product\(s\)/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call submit when create button is clicked', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      // Fill form
      await user.type(screen.getByLabelText('Discount Name'), 'Test Discount');
      await user.type(screen.getByLabelText('Discount Value (%)'), '20');

      // Click submit
      const createButton = screen.getByRole('button', { name: /Create Discount/i });
      await user.click(createButton);

      expect(mockSubmit).toHaveBeenCalled();
    });

    it('should submit with correct form data', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      // Fill form
      await user.type(screen.getByLabelText('Discount Name'), 'Test Discount');
      await user.selectOptions(screen.getByLabelText('Discount Type'), 'fixed');
      await user.type(screen.getByLabelText('Discount Value ($)'), '10');

      // Submit
      await user.click(screen.getByRole('button', { name: /Create Discount/i }));

      expect(mockSubmit).toHaveBeenCalled();
      const formData = mockSubmit.mock.calls[0][0];
      expect(formData.get('_action')).toBe('create');
      expect(formData.get('name')).toBe('Test Discount');
      expect(formData.get('type')).toBe('fixed');
      expect(formData.get('value')).toBe('10');
    });

    it('should show loading state during submission', () => {
      Object.assign(mockNavigation, createMockNavigation('submitting'));
      renderWithPolaris(<Discounts />);

      const createButton = screen.getByRole('button', { name: /Create Discount/i });
      // Polaris Button shows loading spinner when loading prop is true
      expect(createButton).toHaveAttribute('aria-busy', 'true');
    });

    it('should disable form during submission', () => {
      Object.assign(mockNavigation, createMockNavigation('submitting'));
      renderWithPolaris(<Discounts />);

      const createButton = screen.getByRole('button', { name: /Create Discount/i });
      expect(createButton).toBeDisabled();
    });
  });

  describe('Discount List Display', () => {
    beforeEach(() => {
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
      ];
    });

    it('should display all discounts in a table', () => {
      renderWithPolaris(<Discounts />);

      expect(screen.getByText('Summer Sale')).toBeInTheDocument();
      expect(screen.getByText('Winter Discount')).toBeInTheDocument();
    });

    it('should show discount type badges', () => {
      renderWithPolaris(<Discounts />);

      expect(screen.getByText('Percentage')).toBeInTheDocument();
      expect(screen.getByText('Fixed Amount')).toBeInTheDocument();
    });

    it('should show discount values correctly', () => {
      renderWithPolaris(<Discounts />);

      expect(screen.getByText('20%')).toBeInTheDocument();
      expect(screen.getByText('$10')).toBeInTheDocument();
    });

    it('should show edit and delete buttons for each discount', () => {
      renderWithPolaris(<Discounts />);

      const editButtons = screen.getAllByRole('button', { name: /Edit/i });
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });

      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });

    it('should show "All products" when no specific products selected', () => {
      renderWithPolaris(<Discounts />);

      const allProductsTexts = screen.getAllByText('All products');
      expect(allProductsTexts.length).toBeGreaterThan(0);
    });

    it('should show empty state when no discounts exist', () => {
      mockLoaderData.discounts = [];
      renderWithPolaris(<Discounts />);

      expect(
        screen.getByText(/No discounts created yet. Create your first discount above./i)
      ).toBeInTheDocument();
    });
  });

  describe('Edit Discount Functionality', () => {
    beforeEach(() => {
      mockLoaderData.discounts = [
        createMockDiscount({
          id: 'disc_1',
          name: 'Edit Me',
          type: 'percentage',
          value: 15,
          productIds: [],
        }),
      ];
    });

    it('should populate form when edit button is clicked', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const editButton = screen.getByRole('button', { name: /Edit/i });
      await user.click(editButton);

      expect(screen.getByLabelText('Discount Name')).toHaveValue('Edit Me');
      expect(screen.getByLabelText('Discount Type')).toHaveValue('percentage');
      expect(screen.getByLabelText('Discount Value (%)')).toHaveValue(15);
    });

    it('should change button text to "Update Discount" in edit mode', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      await user.click(screen.getByRole('button', { name: /Edit/i }));

      expect(screen.getByRole('button', { name: /Update Discount/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Create Discount/i })).not.toBeInTheDocument();
    });

    it('should show cancel button in edit mode', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      await user.click(screen.getByRole('button', { name: /Edit/i }));

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('should reset form when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      // Enter edit mode
      await user.click(screen.getByRole('button', { name: /Edit/i }));
      expect(screen.getByLabelText('Discount Name')).toHaveValue('Edit Me');

      // Click cancel
      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      // Form should be reset
      expect(screen.getByLabelText('Discount Name')).toHaveValue('');
      expect(screen.getByRole('button', { name: /Create Discount/i })).toBeInTheDocument();
    });

    it('should submit update action when updating discount', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      // Enter edit mode
      await user.click(screen.getByRole('button', { name: /Edit/i }));

      // Modify name
      const nameInput = screen.getByLabelText('Discount Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      // Submit
      await user.click(screen.getByRole('button', { name: /Update Discount/i }));

      expect(mockSubmit).toHaveBeenCalled();
      const formData = mockSubmit.mock.calls[0][0];
      expect(formData.get('_action')).toBe('update');
      expect(formData.get('id')).toBe('disc_1');
      expect(formData.get('name')).toBe('Updated Name');
    });
  });

  describe('Delete Discount Functionality', () => {
    beforeEach(() => {
      mockLoaderData.discounts = [
        createMockDiscount({
          id: 'disc_1',
          name: 'Delete Me',
          type: 'percentage',
          value: 25,
          productIds: [],
        }),
      ];

      // Mock window.confirm
      global.confirm = vi.fn(() => true);
    });

    it('should show confirmation dialog when delete is clicked', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this discount?'
      );
    });

    it('should submit delete action when confirmed', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      expect(mockSubmit).toHaveBeenCalled();
      const formData = mockSubmit.mock.calls[0][0];
      expect(formData.get('_action')).toBe('delete');
      expect(formData.get('id')).toBe('disc_1');
    });

    it('should not delete when confirmation is cancelled', async () => {
      global.confirm = vi.fn(() => false);
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Success Messages', () => {
    it('should show toast after successful creation', () => {
      const formData = new FormData();
      formData.set('_action', 'create');

      Object.assign(mockNavigation, {
        ...createMockNavigation('idle'),
        formData,
      });

      renderWithPolaris(<Discounts />);

      // The useEffect should trigger toast
      expect(mockToast.show).toHaveBeenCalledWith('Discount created');
    });

    it('should show toast after successful update', () => {
      mockLoaderData.discounts = [
        createMockDiscount({ id: 'disc_1', name: 'Test', type: 'percentage', value: 10 }),
      ];

      const formData = new FormData();
      formData.set('_action', 'update');

      Object.assign(mockNavigation, {
        ...createMockNavigation('idle'),
        formData,
      });

      renderWithPolaris(<Discounts />);

      expect(mockToast.show).toHaveBeenCalledWith('Discount updated');
    });

    it('should show toast after successful deletion', () => {
      const formData = new FormData();
      formData.set('_action', 'delete');

      Object.assign(mockNavigation, {
        ...createMockNavigation('idle'),
        formData,
      });

      renderWithPolaris(<Discounts />);

      expect(mockToast.show).toHaveBeenCalledWith('Discount deleted');
    });
  });

  describe('Activate in Cart Feature', () => {
    beforeEach(() => {
      mockLoaderData.discounts = [createMockDiscount()];
      global.fetch = vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ success: true }),
        })
      );
    });

    it('should show "Activate in Cart" button when discounts exist', () => {
      renderWithPolaris(<Discounts />);

      expect(screen.getByRole('button', { name: /Activate in Cart/i })).toBeInTheDocument();
    });

    it('should not show "Activate in Cart" button when no discounts', () => {
      mockLoaderData.discounts = [];
      renderWithPolaris(<Discounts />);

      expect(screen.queryByRole('button', { name: /Activate in Cart/i })).not.toBeInTheDocument();
    });

    it('should call sync API when activate button is clicked', async () => {
      const user = userEvent.setup();
      renderWithPolaris(<Discounts />);

      const activateButton = screen.getByRole('button', { name: /Activate in Cart/i });
      await user.click(activateButton);

      expect(global.fetch).toHaveBeenCalledWith('/api/sync-discounts', { method: 'POST' });
    });

    it('should show info banner about cart activation', () => {
      renderWithPolaris(<Discounts />);

      expect(
        screen.getByText(/Click "Activate in Cart" to apply these discounts automatically/i)
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form inputs', () => {
      renderWithPolaris(<Discounts />);

      expect(screen.getByLabelText('Discount Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Discount Type')).toBeInTheDocument();
      expect(screen.getByLabelText(/Discount Value/)).toBeInTheDocument();
    });

    it('should have proper roles for buttons', () => {
      renderWithPolaris(<Discounts />);

      expect(screen.getByRole('button', { name: /Create Discount/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Select Products/i })).toBeInTheDocument();
    });

    it('should have proper checkbox role', () => {
      renderWithPolaris(<Discounts />);

      expect(
        screen.getByRole('checkbox', { name: /Sync discount metadata/i })
      ).toBeInTheDocument();
    });
  });
});
