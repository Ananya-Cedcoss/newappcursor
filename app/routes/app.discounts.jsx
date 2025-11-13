import { useState } from "react";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const discounts = await db.discount.findMany({
    where: {
      shop: session.shop,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: { usages: true },
      },
    },
  });

  return json({ discounts });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  try {
    if (action === "create") {
      const discount = await db.discount.create({
        data: {
          code: formData.get("code"),
          type: formData.get("type"),
          value: parseFloat(formData.get("value")),
          description: formData.get("description"),
          shop: session.shop,
          startDate: new Date(formData.get("startDate")),
          endDate: formData.get("endDate") ? new Date(formData.get("endDate")) : null,
          minPurchaseAmount: formData.get("minPurchaseAmount")
            ? parseFloat(formData.get("minPurchaseAmount"))
            : null,
          maxDiscountAmount: formData.get("maxDiscountAmount")
            ? parseFloat(formData.get("maxDiscountAmount"))
            : null,
          usageLimit: formData.get("usageLimit")
            ? parseInt(formData.get("usageLimit"))
            : null,
          priority: parseInt(formData.get("priority") || "0"),
          active: formData.get("active") === "true",
        },
      });

      return json({
        success: true,
        message: "Discount created successfully",
        discount
      });
    }

    if (action === "update") {
      const id = formData.get("id");
      const discount = await db.discount.update({
        where: { id },
        data: {
          active: formData.get("active") === "true",
        },
      });

      return json({
        success: true,
        message: "Discount updated successfully",
        discount
      });
    }

    if (action === "delete") {
      const id = formData.get("id");
      await db.discount.delete({
        where: { id },
      });

      return json({
        success: true,
        message: "Discount deleted successfully"
      });
    }

    return json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Discount action error:", error);
    return json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
};

export default function Discounts() {
  const { discounts } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    submit(formData, { method: "post" });
    setShowForm(false);
  };

  const toggleDiscount = (discount) => {
    const formData = new FormData();
    formData.append("action", "update");
    formData.append("id", discount.id);
    formData.append("active", (!discount.active).toString());
    submit(formData, { method: "post" });
  };

  const deleteDiscount = (id) => {
    if (confirm("Are you sure you want to delete this discount?")) {
      const formData = new FormData();
      formData.append("action", "delete");
      formData.append("id", id);
      submit(formData, { method: "post" });
    }
  };

  return (
    <s-page title="Discount Management">
      <s-section>
        {actionData?.message && (
          <s-banner status={actionData.success ? "success" : "critical"}>
            {actionData.message}
          </s-banner>
        )}

        <div style={{ marginBottom: "20px" }}>
          <s-button kind="primary" onPress={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Create New Discount"}
          </s-button>
        </div>

        {showForm && (
          <s-card sectioned>
            <form onSubmit={handleSubmit}>
              <input type="hidden" name="action" value="create" />

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                  Discount Code *
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  placeholder="SAVE20"
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                  Discount Type *
                </label>
                <select
                  name="type"
                  required
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                  Discount Value *
                </label>
                <input
                  type="number"
                  name="value"
                  required
                  step="0.01"
                  min="0"
                  placeholder="20"
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Save 20% on your order"
                  rows={3}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    required
                    defaultValue={new Date().toISOString().slice(0, 16)}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Min Purchase
                  </label>
                  <input
                    type="number"
                    name="minPurchaseAmount"
                    step="0.01"
                    min="0"
                    placeholder="50.00"
                    style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Max Discount
                  </label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    step="0.01"
                    min="0"
                    placeholder="100.00"
                    style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    min="0"
                    placeholder="100"
                    style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                  Priority
                </label>
                <input
                  type="number"
                  name="priority"
                  defaultValue="0"
                  min="0"
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    name="active"
                    value="true"
                    defaultChecked
                  />
                  <span>Active</span>
                </label>
              </div>

              <s-button kind="primary" submit>Create Discount</s-button>
            </form>
          </s-card>
        )}

        <div style={{ marginTop: "20px" }}>
          {discounts.length === 0 ? (
            <s-empty-state heading="No discounts yet" image="/discount-icon.svg">
              <p>Create your first discount to get started</p>
            </s-empty-state>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {discounts.map((discount) => (
                <s-card key={discount.id}>
                  <div style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
                          {discount.code}
                        </h3>
                        <p style={{ margin: "0 0 8px 0", color: "#666" }}>
                          {discount.description || "No description"}
                        </p>
                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "14px" }}>
                          <span>
                            <strong>Type:</strong> {discount.type === "percentage" ? `${discount.value}%` : `$${discount.value}`}
                          </span>
                          <span>
                            <strong>Used:</strong> {discount._count.usages}{discount.usageLimit ? ` / ${discount.usageLimit}` : ""}
                          </span>
                          {discount.minPurchaseAmount && (
                            <span>
                              <strong>Min Purchase:</strong> ${discount.minPurchaseAmount}
                            </span>
                          )}
                          {discount.maxDiscountAmount && (
                            <span>
                              <strong>Max Discount:</strong> ${discount.maxDiscountAmount}
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
                          <span>Start: {new Date(discount.startDate).toLocaleDateString()}</span>
                          {discount.endDate && (
                            <span> | End: {new Date(discount.endDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <s-badge status={discount.active ? "success" : "attention"}>
                          {discount.active ? "Active" : "Inactive"}
                        </s-badge>
                        <s-button
                          size="slim"
                          onPress={() => toggleDiscount(discount)}
                        >
                          {discount.active ? "Deactivate" : "Activate"}
                        </s-button>
                        <s-button
                          size="slim"
                          destructive
                          onPress={() => deleteDiscount(discount.id)}
                        >
                          Delete
                        </s-button>
                      </div>
                    </div>
                  </div>
                </s-card>
              ))}
            </div>
          )}
        </div>
      </s-section>
    </s-page>
  );
}
