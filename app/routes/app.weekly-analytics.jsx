import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  InlineStack,
  DataTable,
  Badge,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  getWeeklyAnalytics,
  getAnalyticsSummary,
  getAllAnalyticsForExport,
  formatAnalyticsAsCSV,
} from "../services/analytics.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const exportParam = url.searchParams.get("export");

  // Handle CSV export
  if (exportParam === "csv") {
    const analytics = await getAllAnalyticsForExport();
    const csvContent = formatAnalyticsAsCSV(analytics);
    const date = new Date().toISOString().split("T")[0];
    const filename = `product-analytics-${date}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // Get last 12 weeks of data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 84); // 12 weeks

  const weeklyAnalytics = await getWeeklyAnalytics(startDate, endDate);
  const summary = await getAnalyticsSummary();

  return { weeklyAnalytics, summary };
};

export default function WeeklyAnalytics() {
  const { weeklyAnalytics, summary } = useLoaderData();

  const handleExport = async () => {
    try {
      const response = await fetch("/app/weekly-analytics?export=csv");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `product-analytics-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <Page>
      <TitleBar title="Weekly Analytics" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {/* Summary Card */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Analytics Summary
                  </Text>
                  <Button onClick={handleExport} variant="primary">
                    Export to CSV
                  </Button>
                </InlineStack>
                <Divider />
                <InlineStack gap="800">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Total Products
                    </Text>
                    <Text as="p" variant="headingLg">
                      {summary.totalProducts}
                    </Text>
                  </BlockStack>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Total Views
                    </Text>
                    <Text as="p" variant="headingLg">
                      {summary.totalViews}
                    </Text>
                  </BlockStack>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Average Views
                    </Text>
                    <Text as="p" variant="headingLg">
                      {summary.averageViews}
                    </Text>
                  </BlockStack>
                  {summary.mostViewedProduct && (
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Most Viewed Product
                      </Text>
                      <Text as="p" variant="headingLg">
                        {summary.mostViewedProduct}
                      </Text>
                      <Badge tone="success">{summary.mostViewedCount} views</Badge>
                    </BlockStack>
                  )}
                </InlineStack>
              </BlockStack>
            </Card>

            {/* Weekly Data Card */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Weekly Breakdown (Last 12 Weeks)
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  View product analytics grouped by week
                </Text>

                {weeklyAnalytics.length === 0 ? (
                  <Text as="p" variant="bodyMd" tone="subdued">
                    No analytics data available for the selected time period.
                  </Text>
                ) : (
                  <BlockStack gap="400">
                    {weeklyAnalytics.map((week) => (
                      <Card key={week.weekStart} background="bg-surface-secondary">
                        <BlockStack gap="300">
                          <InlineStack align="space-between" blockAlign="center">
                            <Text as="h3" variant="headingMd">
                              Week of {new Date(week.weekStart).toLocaleDateString()}
                            </Text>
                            <Badge tone="info">{week.totalViews} total views</Badge>
                          </InlineStack>
                          <DataTable
                            columnContentTypes={["text", "numeric", "text"]}
                            headings={["Product ID", "Views", "Last Viewed"]}
                            rows={week.products.map((product) => [
                              product.productId,
                              product.viewCount.toString(),
                              new Date(product.lastViewedAt).toLocaleString(),
                            ])}
                          />
                        </BlockStack>
                      </Card>
                    ))}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
