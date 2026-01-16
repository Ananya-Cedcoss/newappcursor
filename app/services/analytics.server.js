import db from "../db.server";

/**
 * Get analytics for the past N weeks
 * @param {number} weeks - Number of weeks to look back
 * @returns {Promise<Array>} Weekly analytics data
 */
export async function getWeeklyAnalytics(weeks = 4) {
  const now = new Date();
  const weeksAgo = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

  const allAnalytics = await db.productAnalytics.findMany({
    where: {
      lastViewedAt: {
        gte: weeksAgo,
      },
    },
    orderBy: {
      lastViewedAt: "desc",
    },
  });

  // Group by week
  const weeklyData = {};

  allAnalytics.forEach((analytics) => {
    const date = new Date(analytics.lastViewedAt);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        weekStart,
        weekEnd: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
        products: {},
        totalViews: 0,
        uniqueProducts: 0,
      };
    }

    if (!weeklyData[weekKey].products[analytics.productId]) {
      weeklyData[weekKey].products[analytics.productId] = {
        productId: analytics.productId,
        views: 0,
        lastViewed: analytics.lastViewedAt,
      };
      weeklyData[weekKey].uniqueProducts++;
    }

    weeklyData[weekKey].products[analytics.productId].views = analytics.viewCount;
    weeklyData[weekKey].totalViews += analytics.viewCount;
  });

  return Object.values(weeklyData).sort(
    (a, b) => b.weekStart.getTime() - a.weekStart.getTime()
  );
}

/**
 * Get all analytics data for export
 * @returns {Promise<Array>} All product analytics
 */
export async function getAllAnalyticsForExport() {
  return await db.productAnalytics.findMany({
    orderBy: {
      viewCount: "desc",
    },
  });
}

/**
 * Get the start of the week (Monday) for a given date
 * @param {Date} date
 * @returns {Date}
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
}

/**
 * Generate CSV content from analytics data
 * @param {Array} analytics - Product analytics data
 * @returns {string} CSV formatted string
 */
export function generateCSV(analytics) {
  const headers = ["Product ID", "View Count", "Last Viewed At"];
  const rows = analytics.map((item) => [
    item.productId,
    item.viewCount,
    new Date(item.lastViewedAt).toISOString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}
