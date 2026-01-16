import { json } from "@remix-run/node";
import db from "../db.server";

// Debounce time in milliseconds (30 seconds)
const DEBOUNCE_TIME = 30 * 1000;

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { productId } = await request.json();

    if (!productId) {
      return json({ error: "productId is required" }, { status: 400 });
    }

    const now = new Date();

    // Try to find existing product analytics record
    const existingAnalytics = await db.productAnalytics.findUnique({
      where: { productId: String(productId) },
    });

    if (existingAnalytics) {
      // Check if enough time has passed since last view (debounce)
      const timeSinceLastView = now.getTime() - existingAnalytics.lastViewedAt.getTime();

      if (timeSinceLastView >= DEBOUNCE_TIME) {
        // Increment count and update timestamp
        await db.productAnalytics.update({
          where: { productId: String(productId) },
          data: {
            viewCount: existingAnalytics.viewCount + 1,
            lastViewedAt: now,
          },
        });
        return json({ success: true, counted: true }, { status: 200 });
      } else {
        // Within debounce window, don't count
        return json({ success: true, counted: false, reason: "debounced" }, { status: 200 });
      }
    } else {
      // Create new record with count 1
      await db.productAnalytics.create({
        data: {
          productId: String(productId),
          viewCount: 1,
          lastViewedAt: now,
        },
      });
      return json({ success: true, counted: true }, { status: 200 });
    }
  } catch (error) {
    console.error("Error tracking view:", error);
    return json({ error: "Failed to track view" }, { status: 500 });
  }
};
