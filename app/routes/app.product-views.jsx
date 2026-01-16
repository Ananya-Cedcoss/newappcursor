import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import {
  Page,
  Card,
  DataTable,
  Text,
  BlockStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const productViews = await db.productView.findMany({
    orderBy: { count: "desc" },
  });

  return json({ productViews });
};

export default function ProductViews() {
  const { productViews } = useLoaderData();

  const rows = productViews.map((view) => [
    view.productId,
    view.count.toString(),
  ]);

  return (
    <Page title="Product Views">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="200">
            <Text variant="headingMd" as="h2">
              Product View Analytics
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              Track how many times each product has been viewed
            </Text>
          </BlockStack>
        </Card>
        <Card>
          <DataTable
            columnContentTypes={["text", "numeric"]}
            headings={["Product ID", "View Count"]}
            rows={rows}
          />
        </Card>
      </BlockStack>
    </Page>
  );
}
