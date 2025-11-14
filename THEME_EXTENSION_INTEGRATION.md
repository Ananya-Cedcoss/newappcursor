# Theme Extension Integration Guide

## Overview
The Product Discount Display theme extension has been fully integrated with the backend API to fetch and display real-time discount information on the storefront.

## Features Implemented

### 1. **Real-Time Discount Fetching**
- All extension components now fetch discount data directly from the backend API
- Uses the App Proxy endpoint: `/apps/discount-proxy/product-discount`
- No dependency on metafields (though still supported as fallback)

### 2. **Visual Components Updated**

#### **Main Discount Block** (`blocks/product-discount.liquid`)
Displays comprehensive discount information with:
- **Loading State**: Animated spinner with "Checking for discounts..." message
- **Discount Badge**: Eye-catching "🎉 Special Offer" badge
- **Discount Name**: Display the discount campaign name
- **Highlight Message**: "Save 10% today!" or "Save $5.00 today!"
- **Discount Amount**: Large, prominent display of discount value
- **Pricing Display**:
  - Original price (strikethrough)
  - Discounted price (prominent)
  - Savings amount
- **Auto-Apply Notice**: "✓ Discount applied automatically at checkout"

#### **Discount Badge Snippet** (`snippets/product-discount-badge.liquid`)
Compact badge showing discount amount:
- Percentage discounts: "-20%"
- Fixed discounts: "-$5.00"
- Only appears when discount is available

#### **Discount Price Snippet** (`snippets/product-discount-price.liquid`)
Price display with discount:
- Shows original and discounted prices
- Displays savings amount and percentage
- Falls back to regular price if no discount

### 3. **Enhanced Styling**

New CSS features added to `assets/product-discount.css`:

- **Loading Spinner**: Animated rotating spinner
- **Pulsing Highlight**: Attention-grabbing animation for discount messages
- **Smooth Transitions**: Slide-in animations when content loads
- **Responsive Design**: Mobile-optimized layouts
- **Dark Mode Support**: Adapts to user's color scheme preference
- **Hover Effects**: Interactive elements with smooth transitions

## How It Works

### Data Flow

```
1. Product page loads
   ↓
2. Extension JavaScript executes
   ↓
3. Fetch request to: /apps/discount-proxy/product-discount?productId={id}
   ↓
4. Backend queries database for discounts
   ↓
5. Response with discount data (or empty if none)
   ↓
6. JavaScript dynamically renders discount UI
   ↓
7. Animations and styling applied
```

### API Response Format

```json
{
  "success": true,
  "discount": {
    "id": "uuid",
    "name": "Summer Sale",
    "type": "percentage",
    "value": 20,
    "productIds": ["123", "456"]
  },
  "productId": "123"
}
```

### Discount Calculation

**Percentage Discounts:**
```javascript
discountAmount = (originalPrice × value) / 100
discountedPrice = originalPrice - discountAmount
```

**Fixed Discounts:**
```javascript
discountAmount = value × 100 // Convert to cents
discountedPrice = originalPrice - discountAmount
```

## Usage in Theme

### Add Main Discount Block
In the theme editor, add the "Product Discount" block to product pages:
1. Go to Online Store → Themes → Customize
2. Navigate to a product page
3. Add block → Apps → Product Discount
4. Customize settings:
   - Badge Text (default: "Special Offer")
   - Show Savings Amount (checkbox)
   - Discount Color

### Use Discount Badge Snippet
In product card templates (collection pages, featured products):
```liquid
{% render 'product-discount-badge', product: product %}
```

### Use Discount Price Snippet
In product forms or price displays:
```liquid
{% render 'product-discount-price', product: product, variant: variant %}
```

## Visual Examples

### Discount Block Display
```
┌─────────────────────────────────────────┐
│  🎉 Special Offer                       │
│                                         │
│  Summer Sale                            │
│  Save 20% today!                        │
│                                         │
│         20% OFF                         │
│                                         │
│  $99.99  $79.99  Save $20.00           │
│                                         │
│  ✓ Discount applied automatically       │
│    at checkout                          │
└─────────────────────────────────────────┘
```

### Messages Displayed

**Percentage Discount:**
- "Save 20% today!"
- "20% OFF"
- "✓ Discount applied automatically at checkout"

**Fixed Amount Discount:**
- "Save $10.00 today!"
- "$10.00 OFF"
- "✓ Discount applied automatically at checkout"

## Customization

### Modify Badge Text
In theme editor settings or directly in Liquid:
```liquid
{{ block.settings.badge_text | default: 'Limited Time Offer' }}
```

### Change Colors
Edit `product-discount.css`:
```css
.product-discount-block {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.discount-highlight {
  color: #ffd700; /* Gold highlight color */
}
```

### Adjust Animations
Modify animation timing:
```css
.discount-loaded {
  animation: slideInDown 0.4s ease-out;
}

.discount-highlight {
  animation: pulse 2s ease-in-out infinite;
}
```

## Performance Considerations

### Caching
- App proxy responses are cached for 5 minutes
- Reduces database queries
- Ensures fast page loads

### Loading States
- Shows loading spinner immediately
- Prevents layout shift with hidden container
- Gracefully hides if no discount available

### Error Handling
- Catches fetch errors silently
- Falls back to hiding the discount block
- Logs errors to console for debugging

## Testing

### Test Scenarios

1. **Product with Discount**
   - Create discount in admin
   - Assign to product
   - View product page
   - Verify discount displays correctly

2. **Product without Discount**
   - View product without assigned discount
   - Verify block is hidden
   - No errors in console

3. **Multiple Products**
   - Test on collection pages with badge snippet
   - Verify correct discounts for each product
   - Check performance with many products

4. **Mobile Devices**
   - Test responsive layout
   - Verify touch interactions
   - Check text readability

5. **Different Discount Types**
   - Test percentage discount (e.g., 20%)
   - Test fixed discount (e.g., $10)
   - Verify calculations are correct

## Troubleshooting

### Discount Not Showing

**Check:**
1. Discount is created in admin interface
2. Product ID is correctly assigned to discount
3. App proxy is configured correctly
4. Browser console for errors
5. Network tab shows successful API call

### Incorrect Calculations

**Verify:**
1. Product price is in cents (Shopify format)
2. Fixed discount value is in dollars (will be converted)
3. Percentage is between 0-100

### Styling Issues

**Common Fixes:**
1. Clear browser cache
2. Check for CSS conflicts with theme
3. Verify CSS file is loaded: `{{ 'product-discount.css' | asset_url }}`
4. Use browser DevTools to inspect styles

## App Proxy Configuration

Ensure App Proxy is configured in Shopify Partner Dashboard:

```
Subpath prefix: discount-proxy
Subpath: product-discount
Proxy URL: https://your-app-url/app/proxy/product-discount
```

## Future Enhancements

Potential improvements:
- Add variant-specific discounts
- Support for tiered pricing (quantity breaks)
- Countdown timers for time-limited offers
- A/B testing different discount messages
- Analytics tracking for discount views/conversions

## Support

For issues or questions:
1. Check console logs for errors
2. Verify API endpoints are responding
3. Test with browser DevTools Network tab
4. Review Shopify app logs
