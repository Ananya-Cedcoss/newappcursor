# Product Discount Display - Theme App Extension

This Theme App Extension allows you to display product discounts on your Shopify storefront with beautiful, customizable UI components.

## Features

- Display discount badges on product pages
- Show original and discounted prices with savings
- Full block with discount name, amount, and pricing details
- Supports both percentage and fixed amount discounts
- Responsive design with animations
- Dark mode support
- Fetches data from product metafields or app proxy

## Installation

1. **Deploy the Extension**
   ```bash
   shopify app deploy
   ```

2. **Enable in Theme Editor**
   - Go to your Shopify admin
   - Navigate to Online Store > Themes
   - Click "Customize" on your active theme
   - The extension will be available in the theme editor

## Components

### 1. Product Discount Block
**File:** `blocks/product-discount.liquid`

Full-featured discount display with badge, name, amount, and pricing.

**Usage in Theme Editor:**
- Navigate to a product page in the theme editor
- Click "Add block" or "Add section"
- Select "Product Discount" from the app blocks
- Customize settings:
  - Badge Text (default: "Special Offer")
  - Show Savings Amount (checkbox)
  - Discount Color

**Settings:**
- `badge_text`: Custom text for the discount badge
- `show_savings`: Toggle savings amount display
- `discount_color`: Color picker for discount elements

### 2. Discount Badge Snippet
**File:** `snippets/product-discount-badge.liquid`

Small badge showing the discount percentage or amount.

**Usage in Liquid:**
```liquid
{% render 'product-discount-badge', product: product %}
```

**Output:**
- `-20%` for percentage discounts
- `-$10.00` for fixed amount discounts

### 3. Discount Price Snippet
**File:** `snippets/product-discount-price.liquid`

Shows original price (strikethrough) and discounted price with savings.

**Usage in Liquid:**
```liquid
{% render 'product-discount-price', product: product %}
```

**With specific variant:**
```liquid
{% render 'product-discount-price', product: product, variant: variant %}
```

**Output:**
- Original price (strikethrough)
- Discounted price (highlighted)
- Savings amount and percentage

## Integration Methods

### Method 1: Product Metafields (Recommended)

Discounts are automatically synced to product metafields when you enable "Sync discount metadata to Shopify products" in the admin UI.

**Metafield Details:**
- Namespace: `custom`
- Key: `discount_info`
- Type: `json`

**Data Structure:**
```json
{
  "discountId": "uuid",
  "name": "Summer Sale",
  "type": "percentage",
  "value": 20,
  "updatedAt": "2025-01-13T10:00:00Z"
}
```

### Method 2: App Proxy (Fallback)

If metafields are not available, the extension can fetch discount data via app proxy.

**Setup App Proxy:**

1. Go to Shopify Partner Dashboard
2. Navigate to your app > Configuration > App proxy
3. Configure:
   - **Subpath prefix:** `discount-proxy`
   - **Subpath:** `product-discount`
   - **Proxy URL:** `https://your-app-url/app/proxy/product-discount`

4. The extension will automatically use this endpoint if metafields are not found

**Proxy Endpoint:**
```
GET /apps/discount-proxy/product-discount?productId={productId}
```

## Adding to Product Pages

### Option 1: Theme Editor (No Code)
1. Open theme editor
2. Navigate to a product page template
3. Click "Add block"
4. Select "Product Discount" from Apps section
5. Position and customize as needed

### Option 2: Manual Liquid Integration

**In product.liquid or product-template.liquid:**

```liquid
<!-- Full discount display -->
{% render 'product-discount-block', product: product %}

<!-- Or use individual components -->

<!-- Discount badge -->
<div class="product-badges">
  {% render 'product-discount-badge', product: product %}
</div>

<!-- Discount price (replace existing price) -->
<div class="product-price">
  {% render 'product-discount-price', product: product %}
</div>
```

**In product-card.liquid (collection pages):**

```liquid
<div class="card__badges">
  {% render 'product-discount-badge', product: card_product %}
</div>
```

## Customization

### CSS Variables

You can customize the appearance by overriding CSS variables in your theme:

```css
.product-discount-block {
  --discount-gradient-start: #667eea;
  --discount-gradient-end: #764ba2;
  --discount-accent: #ffd700;
  --discount-badge-bg: rgba(255, 255, 255, 0.2);
}
```

### Custom Styling

Add your own CSS in your theme to override default styles:

```css
/* Make discount block more compact */
.product-discount-block {
  padding: 15px;
  margin: 10px 0;
}

/* Change badge color */
.discount-badge--percentage {
  background: #00b894;
}
```

## Liquid Variables Available

All components have access to:
- `product` - The product object
- `variant` (optional) - Specific variant for price calculations
- `discount_metafield` - The discount data from metafields
- `discount_data` - Parsed JSON discount information

## Troubleshooting

### Discount Not Showing
1. **Check metafield sync is enabled** in admin UI
2. **Verify products are selected** for the discount
3. **Ensure theme extension is enabled** in theme editor
4. **Check app proxy configuration** if using fallback method

### Styling Issues
1. **Clear browser cache** after CSS changes
2. **Check for theme CSS conflicts** using browser developer tools
3. **Ensure CSS file is loaded** (check Network tab)

### App Proxy Not Working
1. **Verify proxy configuration** in Partner Dashboard
2. **Check app URL** is correct and accessible
3. **Test endpoint directly**: `/apps/discount-proxy/product-discount?productId=gid://shopify/Product/123`
4. **Check CORS headers** are properly set

## Example Implementations

### Product Page - Above Add to Cart
```liquid
<div class="product-main">
  <h1>{{ product.title }}</h1>

  {% render 'product-discount-price', product: product %}

  <div class="product-form">
    <!-- Your add to cart form -->
  </div>
</div>
```

### Collection Card - Badge Overlay
```liquid
<div class="product-card">
  <div class="product-card__image">
    {{ product.featured_image | image_url: width: 600 | image_tag }}

    <div class="product-card__badge-overlay">
      {% render 'product-discount-badge', product: product %}
    </div>
  </div>

  <div class="product-card__info">
    <h3>{{ product.title }}</h3>
    {% render 'product-discount-price', product: product %}
  </div>
</div>
```

## API Reference

### Block Schema
```json
{
  "name": "Product Discount",
  "target": "section",
  "settings": [
    {
      "type": "text",
      "id": "badge_text",
      "label": "Badge Text",
      "default": "Special Offer"
    },
    {
      "type": "checkbox",
      "id": "show_savings",
      "label": "Show Savings Amount",
      "default": true
    },
    {
      "type": "color",
      "id": "discount_color",
      "label": "Discount Color",
      "default": "#ff0000"
    }
  ]
}
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Shopify's theme app extension documentation
3. Contact app support

## Version History

**v1.0.0** - Initial release
- Product discount block
- Discount badge snippet
- Discount price snippet
- Metafield and proxy support
- Responsive design
- Dark mode support
