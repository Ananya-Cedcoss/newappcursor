import { useState, useEffect, useRef, useCallback } from "react";
import { useActionData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  BlockStack,
  Text,
  InlineStack,
  Box,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const productId = formData.get("productId");

  if (!productId) {
    return { error: "Product ID is required" };
  }

  try {
    // Fetch product details from Shopify
    const response = await admin.graphql(
      `#graphql
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          description
          status
          vendor
          productType
          createdAt
          updatedAt
          featuredImage {
            url
            altText
          }
          variants(first: 5) {
            edges {
              node {
                id
                title
                price
                sku
                inventoryQuantity
              }
            }
          }
        }
      }`,
      {
        variables: {
          id: `gid://shopify/Product/${productId}`,
        },
      }
    );

    const responseJson = await response.json();

    if (responseJson.data?.product) {
      // Track the view
      try {
        const trackResponse = await fetch(
          `${new URL(request.url).origin}/api/track-view`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ productId }),
          }
        );

        const trackData = await trackResponse.json();

        return {
          product: responseJson.data.product,
          viewCount: trackData.viewCount,
          lastViewedAt: trackData.lastViewedAt,
        };
      } catch (trackError) {
        console.error("Error tracking view:", trackError);
        // Still return product data even if tracking fails
        return {
          product: responseJson.data.product,
          trackingError: "Failed to track view",
        };
      }
    } else {
      return { error: "Product not found" };
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    return { error: "Failed to fetch product details" };
  }
};

export default function ViewProduct() {
  const [productId, setProductId] = useState("");
  const actionData = useActionData();
  const submit = useSubmit();

  const handleSubmit = () => {
    if (productId.trim()) {
      const formData = new FormData();
      formData.append("productId", productId.trim());
      submit(formData, { method: "post" });
    }
  };

  const product = actionData?.product;
  const error = actionData?.error;
  const viewCount = actionData?.viewCount;
  const trackingError = actionData?.trackingError;

  return (
    <Page>
      <TitleBar title="View Product" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Enter Product ID to View
              </Text>
              <InlineStack gap="300" align="start">
                <div style={{ flexGrow: 1 }}>
                  <TextField
                    label="Product ID"
                    value={productId}
                    onChange={setProductId}
                    placeholder="e.g., 8765432109876"
                    autoComplete="off"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSubmit();
                      }
                    }}
                  />
                </div>
                <Button onClick={handleSubmit} variant="primary">
                  View Product
                </Button>
              </InlineStack>

              {error && (
                <Banner tone="critical">
                  <Text as="p">{error}</Text>
                </Banner>
              )}

              {trackingError && (
                <Banner tone="warning">
                  <Text as="p">{trackingError}</Text>
                </Banner>
              )}

              {product && (
                <BlockStack gap="400">
                  <Banner tone="success">
                    <Text as="p">
                      Product viewed successfully! Total views: {viewCount || "N/A"}
                    </Text>
                  </Banner>

                  <Card>
                    <BlockStack gap="400">
                      {product.featuredImage && (
                        <Box>
                          <img
                            src={product.featuredImage.url}
                            alt={product.featuredImage.altText || product.title}
                            style={{ maxWidth: "300px", borderRadius: "8px" }}
                          />
                        </Box>
                      )}

                      <BlockStack gap="200">
                        <Text as="h3" variant="headingLg">
                          {product.title}
                        </Text>
                        <InlineStack gap="200">
                          <Text as="span" variant="bodyMd" tone="subdued">
                            Status:
                          </Text>
                          <Text as="span" variant="bodyMd">
                            {product.status}
                          </Text>
                        </InlineStack>
                      </BlockStack>

                      {product.description && (
                        <BlockStack gap="200">
                          <Text as="h4" variant="headingMd">
                            Description
                          </Text>
                          <Text as="p" variant="bodyMd">
                            {product.description}
                          </Text>
                        </BlockStack>
                      )}

                      <BlockStack gap="200">
                        <Text as="h4" variant="headingMd">
                          Product Details
                        </Text>
                        <InlineStack gap="200">
                          <Text as="span" variant="bodyMd" tone="subdued">
                            Vendor:
                          </Text>
                          <Text as="span" variant="bodyMd">
                            {product.vendor || "N/A"}
                          </Text>
                        </InlineStack>
                        <InlineStack gap="200">
                          <Text as="span" variant="bodyMd" tone="subdued">
                            Product Type:
                          </Text>
                          <Text as="span" variant="bodyMd">
                            {product.productType || "N/A"}
                          </Text>
                        </InlineStack>
                      </BlockStack>

                      {product.variants?.edges?.length > 0 && (
                        <BlockStack gap="200">
                          <Text as="h4" variant="headingMd">
                            Variants
                          </Text>
                          {product.variants.edges.map(({ node }) => (
                            <Box
                              key={node.id}
                              padding="300"
                              background="bg-surface-secondary"
                              borderRadius="200"
                            >
                              <BlockStack gap="100">
                                <Text as="p" variant="bodyMd" fontWeight="semibold">
                                  {node.title}
                                </Text>
                                <InlineStack gap="400">
                                  <Text as="span" variant="bodyMd">
                                    Price: ${node.price}
                                  </Text>
                                  {node.sku && (
                                    <Text as="span" variant="bodyMd">
                                      SKU: {node.sku}
                                    </Text>
                                  )}
                                  <Text as="span" variant="bodyMd">
                                    Inventory: {node.inventoryQuantity || 0}
                                  </Text>
                                </InlineStack>
                              </BlockStack>
                            </Box>
                          ))}
                        </BlockStack>
                      )}
                    </BlockStack>
                  </Card>
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
