# UI Component Tests Summary (Remix + Vitest + React Testing Library)

## Overview

Comprehensive UI component tests have been implemented for the Discount Management interface using **Vitest**, **React Testing Library**, and **Shopify Polaris** components.

## Installation

All required dependencies are already installed:

```json
{
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/user-event": "^14.6.1",
  "vitest": "^4.0.8",
  "happy-dom": "^20.0.10"
}
```

## Test Files

### 1. **Form UI Tests** - `tests/ui/discount-form.ui.test.jsx`
Comprehensive functional tests for form behavior and interactions.

### 2. **Snapshot Tests** - `tests/ui/discount-snapshots.ui.test.jsx`
Visual regression tests for component structure.

### 3. **Existing Tests** - `app/routes/app.discounts.test.jsx` & `app.discounts.snapshot.test.jsx`
Original test files with extensive coverage.

## Test Coverage

### ✅ Form Renders (8 tests)
- [x] Renders discount creation form with all fields
- [x] Displays correct initial/default values
- [x] Renders submit button
- [x] Renders product selection button
- [x] Renders sync to Shopify checkbox
- [x] Displays selected products count
- [x] Shows proper form heading
- [x] All form fields are accessible

### ✅ Product Dropdown Loads (6 tests)
- [x] Opens product modal when button clicked
- [x] Displays all available products in modal
- [x] Allows selecting multiple products
- [x] Closes modal when cancel clicked
- [x] Updates selected product count
- [x] Shows product names after selection

### ✅ Field Validation Shows Errors (10 tests)
- [x] Accepts valid discount name input
- [x] Accepts valid numeric discount value
- [x] Accepts decimal discount values
- [x] Changes discount type (percentage/fixed)
- [x] Updates value label when type changes
- [x] Shows warning when sync enabled without products
- [x] Hides warning when sync enabled with products
- [x] Enforces minimum value of 0
- [x] Proper step for percentage values (step="1")
- [x] Proper step for fixed amount values (step="0.01")

### ✅ Save Button Triggers Submit (7 tests)
- [x] Calls submit function with valid data
- [x] Submits correct data for percentage discount
- [x] Submits correct data for fixed discount
- [x] Includes selected products in submission
- [x] Includes syncToShopify flag when checked
- [x] Shows loading state during submission
- [x] Disables form inputs during submission

### ✅ Success Message Appears (4 tests)
- [x] Shows toast notification after successful creation
- [x] Shows toast notification after successful update
- [x] Shows toast notification after successful deletion
- [x] Resets form after successful submission

### ✅ Snapshot Tests for Key Components (35+ snapshots)
- [x] Empty state
- [x] Create form default state
- [x] Form fields (name, type, value)
- [x] Single percentage discount
- [x] Single fixed discount
- [x] Multiple mixed discounts
- [x] Product assignments
- [x] Loading states
- [x] Buttons (create, update, delete, select products)
- [x] Badges (percentage, fixed amount)
- [x] Banners (info, warning)
- [x] Layout sections
- [x] Data table structure
- [x] Edge cases (long names, many products, decimal values)

### ✅ Additional Features Tested
- [x] Edit discount functionality (5 tests)
- [x] Delete discount functionality (3 tests)
- [x] Accessibility (3 tests)
- [x] Form interactions (6 tests)
- [x] Modal behavior (product selection)

## Mock Setup

### Remix Mocks

```javascript
// Mock loader data
const mockLoaderData = { discounts: [], products: [] };

// Mock submit function
const mockSubmit = vi.fn();

// Mock navigation state
const mockNavigation = { state: 'idle', formData: null };

vi.mock('@remix-run/react', () => ({
  useLoaderData: () => mockLoaderData,
  useSubmit: () => mockSubmit,
  useNavigation: () => mockNavigation,
  Form: ({ children, ...props }) => <form {...props}>{children}</form>,
}));
```

### Shopify App Bridge Mocks

```javascript
const mockToast = { show: vi.fn() };

vi.mock('@shopify/app-bridge-react', () => ({
  TitleBar: ({ title }) => <div data-testid="title-bar">{title}</div>,
  useAppBridge: () => ({ toast: mockToast }),
}));
```

### Window Mocks

```javascript
// Mock window.matchMedia (for Polaris components)
window.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock window.confirm (for delete confirmation)
global.confirm = vi.fn(() => true);
```

## Test Utilities

### Custom Render Function

```javascript
import { renderWithPolaris } from '../setup/test-utils.jsx';

// Renders component with Polaris AppProvider wrapper
const { container, getByLabelText } = renderWithPolaris(<Discounts />);
```

### Mock Data Helpers

```javascript
import { createMockDiscount, createMockProduct } from '../setup/test-utils.jsx';

const discount = createMockDiscount({
  id: 'disc_1',
  name: 'Summer Sale',
  type: 'percentage',
  value: 20,
  productIds: ['prod_1'],
});

const product = createMockProduct({
  id: 'prod_1',
  title: 'Awesome Product',
});
```

## Running the Tests

### Run all UI tests:
```bash
npm test -- tests/ui/
```

### Run form tests only:
```bash
npm test -- tests/ui/discount-form.ui.test.jsx
```

### Run snapshot tests only:
```bash
npm test -- tests/ui/discount-snapshots.ui.test.jsx
```

### Run with coverage:
```bash
npm run test:coverage
```

### Run in watch mode:
```bash
npm run test:watch -- tests/ui/
```

### Update snapshots:
```bash
npm test -- tests/ui/discount-snapshots.ui.test.jsx -u
```

## Test Structure

Each test follows the Arrange-Act-Assert pattern:

```javascript
it('should update discount name when user types', async () => {
  // Arrange: Setup user event and render component
  const user = userEvent.setup();
  renderWithPolaris(<Discounts />);

  // Act: Perform user action
  const nameInput = screen.getByLabelText('Discount Name');
  await user.type(nameInput, 'Summer Sale');

  // Assert: Verify expected outcome
  expect(nameInput).toHaveValue('Summer Sale');
});
```

## Key Testing Patterns

### 1. **Form Interactions**
```javascript
// Type into input
await user.type(screen.getByLabelText('Discount Name'), 'Test');

// Select option
await user.selectOptions(screen.getByLabelText('Discount Type'), 'fixed');

// Click button
await user.click(screen.getByRole('button', { name: /Create Discount/i }));

// Check checkbox
await user.click(screen.getByRole('checkbox', { name: /Sync/i }));
```

### 2. **Form Submission Testing**
```javascript
it('should submit with correct form data', async () => {
  const user = userEvent.setup();
  renderWithPolaris(<Discounts />);

  // Fill form
  await user.type(screen.getByLabelText('Discount Name'), 'Test');
  await user.type(screen.getByLabelText('Discount Value (%)'), '20');

  // Submit
  await user.click(screen.getByRole('button', { name: /Create Discount/i }));

  // Verify submit was called
  expect(mockSubmit).toHaveBeenCalled();

  // Verify form data
  const formData = mockSubmit.mock.calls[0][0];
  expect(formData.get('name')).toBe('Test');
  expect(formData.get('value')).toBe('20');
});
```

### 3. **Modal Testing**
```javascript
// Open modal
await user.click(screen.getByRole('button', { name: /Select Products/i }));

// Verify modal is open
expect(screen.getByText('Select Products')).toBeInTheDocument();

// Interact with modal content
await user.click(screen.getByText('Product 1'));

// Close modal
await user.click(screen.getByRole('button', { name: 'Done' }));

// Verify modal is closed
await waitFor(() => {
  expect(screen.queryByText('Select Products')).not.toBeInTheDocument();
});
```

### 4. **Loading State Testing**
```javascript
it('should show loading state during submission', () => {
  mockNavigation.state = 'submitting';
  renderWithPolaris(<Discounts />);

  const submitButton = screen.getByRole('button', { name: /Create Discount/i });
  expect(submitButton).toHaveAttribute('aria-busy', 'true');
  expect(submitButton).toBeDisabled();
});
```

### 5. **Toast Notification Testing**
```javascript
it('should show toast after successful creation', () => {
  const formData = new FormData();
  formData.set('_action', 'create');
  mockNavigation = { state: 'idle', formData };

  renderWithPolaris(<Discounts />);

  expect(mockToast.show).toHaveBeenCalledWith('Discount created');
});
```

### 6. **Snapshot Testing**
```javascript
it('should match snapshot for empty state', () => {
  const { container } = renderWithPolaris(<Discounts />);
  expect(container).toMatchSnapshot();
});

it('should match snapshot of specific element', () => {
  const { getByLabelText } = renderWithPolaris(<Discounts />);
  const nameInput = getByLabelText('Discount Name');
  expect(nameInput.parentElement).toMatchSnapshot();
});
```

## Test Organization

Tests are organized into logical describe blocks:

1. **Form Rendering** - Tests that verify UI elements are present
2. **Product Dropdown** - Tests for product selection modal
3. **Field Validation** - Tests for input validation and constraints
4. **Form Submission** - Tests for save button and data submission
5. **Success Messages** - Tests for toast notifications
6. **Edit Functionality** - Tests for editing existing discounts
7. **Delete Functionality** - Tests for deleting discounts
8. **Accessibility** - Tests for ARIA labels and roles
9. **Snapshots** - Visual regression tests

## Best Practices

### 1. **Use Semantic Queries**
```javascript
// Prefer accessible queries
screen.getByRole('button', { name: /Create Discount/i })
screen.getByLabelText('Discount Name')
screen.getByText('Summer Sale')

// Avoid
screen.getByTestId('create-button')
```

### 2. **Wait for Async Operations**
```javascript
// Use waitFor for async updates
await waitFor(() => {
  expect(screen.getByText('Success!')).toBeInTheDocument();
});
```

### 3. **Clean Up After Tests**
```javascript
afterEach(() => {
  vi.clearAllMocks();  // Clear mock call history
  vi.restoreAllMocks(); // Restore original implementations
});
```

### 4. **Test User Behavior, Not Implementation**
```javascript
// Good: Test what user sees and does
await user.type(screen.getByLabelText('Discount Name'), 'Test');
expect(screen.getByDisplayValue('Test')).toBeInTheDocument();

// Avoid: Testing implementation details
expect(component.state.name).toBe('Test');
```

## Accessibility Testing

All tests include accessibility checks:

- Proper `aria-label` attributes
- Semantic HTML roles (`button`, `checkbox`, `textbox`)
- Descriptive button text
- Help text for form fields
- Loading states with `aria-busy`

## Common Issues and Solutions

### Issue: Tests timeout or hang
**Solution**: Ensure `happy-dom` environment is configured correctly and `window.matchMedia` is mocked.

### Issue: Polaris components don't render
**Solution**: Use `renderWithPolaris()` helper which wraps components with `AppProvider`.

### Issue: Form submission not detected
**Solution**: Mock `useSubmit()` from Remix and verify it's called with correct FormData.

### Issue: Modal doesn't appear
**Solution**: Check that `window.matchMedia` and `IntersectionObserver` are properly mocked.

### Issue: Snapshots constantly failing
**Solution**: Ensure snapshots are generated in a consistent environment. Run with `--update-snapshot` to refresh.

## Coverage Report

To generate a detailed coverage report:

```bash
npm run test:coverage
```

Expected coverage targets:
- **Statements**: 70%+
- **Branches**: 65%+
- **Functions**: 70%+
- **Lines**: 70%+

## Continuous Integration

Tests can be run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run UI Tests
  run: npm test -- tests/ui/

- name: Generate Coverage
  run: npm run test:coverage
```

## Next Steps

Potential enhancements:
1. Add visual regression testing with Percy or Chromatic
2. Add E2E tests with Playwright
3. Add performance testing
4. Add accessibility testing with axe-core
5. Add internationalization tests
6. Add mobile viewport tests

## Resources

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
- [Shopify Polaris Testing](https://polaris.shopify.com/contributing/testing)
- [Testing Library Cheat Sheet](https://testing-library.com/docs/react-testing-library/cheatsheet)

## Summary

✅ **70+ comprehensive UI tests** covering:
- Form rendering and initial state
- Product dropdown/selection modal
- Field validation and constraints
- Form submission and data handling
- Success notifications
- Edit and delete functionality
- Accessibility
- Snapshot/visual regression testing

All tests use:
- **React Testing Library** for component rendering and queries
- **Vitest** as the test runner
- **User Event** for realistic user interactions
- **Shopify Polaris** components with proper mocking
- **Remix** form helpers and hooks with mocks
- **Happy-DOM** for DOM environment

Tests follow best practices for:
- Semantic queries
- User-centric testing
- Accessibility
- Clean code organization
- Comprehensive coverage
