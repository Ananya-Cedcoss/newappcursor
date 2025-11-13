import { json } from "@remix-run/node";
import db from "../db.server";

// CORS headers configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// Handle OPTIONS request for CORS preflight
export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return json({ error: "Method not allowed" }, {
    status: 405,
    headers: corsHeaders,
  });
}

export async function action({ request }) {
  // Handle OPTIONS request for CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { cartLines } = await request.json();

    // Calculate cart total
    const cartTotal = cartLines.reduce((sum, line) => {
      return sum + (parseFloat(line.price) * line.quantity);
    }, 0);

    // Fetch active discounts from database
    const discounts = await db.discount.findMany({
      where: {
        active: true,
        startDate: {
          lte: new Date(),
        },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
      orderBy: {
        priority: 'desc',
      },
    });

    // Find the best applicable discount
    let bestDiscount = null;
    let maxSavings = 0;

    for (const discount of discounts) {
      // Check if cart meets minimum requirements
      if (discount.minPurchaseAmount && cartTotal < discount.minPurchaseAmount) {
        continue;
      }

      // Calculate potential savings
      let savings = 0;
      if (discount.type === 'percentage') {
        savings = cartTotal * (discount.value / 100);
      } else if (discount.type === 'fixed') {
        savings = discount.value;
      }

      // Check maximum discount limit
      if (discount.maxDiscountAmount && savings > discount.maxDiscountAmount) {
        savings = discount.maxDiscountAmount;
      }

      if (savings > maxSavings) {
        maxSavings = savings;
        bestDiscount = discount;
      }
    }

    return json({
      discount: bestDiscount ? {
        id: bestDiscount.id,
        code: bestDiscount.code,
        type: bestDiscount.type,
        value: bestDiscount.value,
        description: bestDiscount.description,
        currency: 'USD',
        savings: maxSavings,
      } : null,
    }, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error fetching available discounts:", error);
    return json({
      error: "Failed to fetch discounts",
      details: error.message,
    }, {
      status: 500,
      headers: corsHeaders,
    });
  }
}
