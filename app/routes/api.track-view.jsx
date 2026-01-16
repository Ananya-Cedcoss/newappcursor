import { json } from "@remix-run/node";
import db from "../db.server";

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { productId } = await request.json();

    if (!productId) {
      return json({ error: "productId is required" }, { status: 400 });
    }

    // Try to find existing product view record
    const existingView = await db.productView.findUnique({
      where: { productId: String(productId) },
    });

    if (existingView) {
      // Increment count if exists
      await db.productView.update({
        where: { productId: String(productId) },
        data: { count: existingView.count + 1 },
      });
    } else {
      // Create new record with count 1
      await db.productView.create({
        data: {
          productId: String(productId),
          count: 1,
        },
      });
    }

    return json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error tracking view:", error);
    return json({ error: "Failed to track view" }, { status: 500 });
  }
};
