import db from "../db.server";

/**
 * Calculate analytics grouped by week
 * @param {Date} startDate - Start date for analytics
 * @param {Date} endDate - End date for analytics
 * @returns {Promise<Array>} Weekly analytics data
 */
export async function getWeeklyAnalytics(startDate, endDate) {
  const analytics = await db.productAnalytics.findMany({
    where: {
      lastViewedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      lastViewedAt: "desc",
    },
  });

  // Group by week
  const weeklyData = {};

  analytics.forEach((item) => {
    const date = new Date(item.lastViewedAt);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        weekStart: weekKey,
        products: [],
        totalViews: 0,
      };
    }

    weeklyData[weekKey].products.push({
      productId: item.productId,
      viewCount: item.viewCount,
      lastViewedAt: item.lastViewedAt,
    });
    weeklyData[weekKey].totalViews += item.viewCount;
  });

  // Convert to array and sort by week
  return Object.values(weeklyData).sort(
    (a, b) => new Date(b.weekStart) - new Date(a.weekStart)
  );
}

/**
 * Get all analytics data for export
 * @returns {Promise<Array>} All product analytics records
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
 * @param {Date} date - Input date
 * @returns {Date} Start of the week
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Format analytics data as CSV string
 * @param {Array} analytics - Analytics data to format
 * @returns {string} CSV formatted string
 */
export function formatAnalyticsAsCSV(analytics) {
  const headers = ["Product ID", "View Count", "Last Viewed At", "Created At"];
  const csvRows = [headers.join(",")];

  analytics.forEach((item) => {
    const row = [
      item.productId,
      item.viewCount,
      new Date(item.lastViewedAt).toISOString(),
      new Date(item.createdAt).toISOString(),
    ];
    csvRows.push(row.join(","));
  });

  return csvRows.join("\n");
}

/**
 * Get analytics summary statistics
 * @returns {Promise<Object>} Summary statistics
 */
export async function getAnalyticsSummary() {
  const allAnalytics = await db.productAnalytics.findMany();

  const totalProducts = allAnalytics.length;
  const totalViews = allAnalytics.reduce((sum, item) => sum + item.viewCount, 0);
  const averageViews = totalProducts > 0 ? totalViews / totalProducts : 0;

  // Get most viewed product
  const mostViewed = allAnalytics.reduce(
    (max, item) => (item.viewCount > max.viewCount ? item : max),
    { viewCount: 0 }
  );

  return {
    totalProducts,
    totalViews,
    averageViews: Math.round(averageViews * 100) / 100,
    mostViewedProduct: mostViewed.productId || null,
    mostViewedCount: mostViewed.viewCount || 0,
  };
}
