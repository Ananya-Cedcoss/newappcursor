import { getDiscountsByProductId } from "../models/discount.server";

/**
 * App Proxy route for fetching product discount data
 * This endpoint is accessible from the storefront via /apps/discount-proxy/product-discount
 *
 * Configure in Shopify Partner Dashboard:
 * - Subpath prefix: discount-proxy
 * - Subpath: product-discount
 * - Proxy URL: https://your-app-url/app/proxy/product-discount
 */

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  if (!productId) {
    return new Response(
      JSON.stringify({ error: "Product ID is required" }),
      {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    // Fetch discounts for this product
    const discounts = await getDiscountsByProductId(productId);

    // Return the first active discount (you can modify logic as needed)
    const activeDiscount = discounts.length > 0 ? discounts[0] : null;

    return new Response(
      JSON.stringify({
        success: true,
        discount: activeDiscount,
        productId,
      }),
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/liquid",
          "Cache-Control": "public, max-age=300", // Cache for 5 minutes
        },
      },
    );
  } catch (error) {
    console.error("Error fetching product discount:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch discount data",
      }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      },
    );
  }
};

// Handle OPTIONS requests for CORS
export const options = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
