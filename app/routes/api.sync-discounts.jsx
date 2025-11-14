import { authenticate } from "../shopify.server";
import { getAllDiscounts } from "../models/discount.server";
import { syncDiscountsToFunction } from "../utils/discount-function.server";

/**
 * POST: Sync all database discounts to Shopify Functions
 * This activates discounts so they apply automatically in the cart
 */
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed",
        allowed: ["POST"],
      }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Get all discounts from database
    const discounts = await getAllDiscounts();

    if (discounts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No discounts to sync",
          results: { created: [], updated: [], errors: [] },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Sync to Shopify Functions
    const results = await syncDiscountsToFunction(admin, discounts);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${results.created.length + results.updated.length} discounts`,
        results: {
          created: results.created.length,
          updated: results.updated.length,
          errors: results.errors.length,
          details: results,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error syncing discounts:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to sync discounts",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
