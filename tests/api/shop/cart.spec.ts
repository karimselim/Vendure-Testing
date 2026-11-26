import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api-base";
import { CartApiClient } from "../../../api-clients/shop/cart-api-client";
import { productVariantType } from "../../../types/api-types/shop/cart-api";

// Picks in-stock variants the cart tests can add. Needs at least two
// different variants for the multi-line tests.
async function getInStockVariants(
  cartApiClient: CartApiClient,
  count: number,
): Promise<productVariantType[]> {
  const { body } = await cartApiClient.getProductVariants();
  if (!body.data) {
    throw new Error("GraphQL response did not contain data");
  }

  const variants = body.data.products.items
    .flatMap((product) => product.variants)
    .filter((variant) => variant.stockLevel === "IN_STOCK");

  expect(
    variants.length,
    "The seeded shop should have enough in-stock variants",
  ).toBeGreaterThanOrEqual(count);
  return variants.slice(0, count);
}

test("Should have no active order before adding anything", async ({
  cartApiClient,
}) => {
  const { status, body } = await cartApiClient.getActiveOrder();

  expect(status).toBe(200);
  if (!body.data) {
    throw new Error("GraphQL response did not contain data");
  }
  expect(body.data.activeOrder).toBeNull();
});

test("Should add an item to the cart", async ({ cartApiClient }) => {
  const [variant] = await getInStockVariants(cartApiClient, 1);

  const { status, body } = await cartApiClient.addToCart(variant.id, 1);

  expect(status).toBe(200);
  if (!body.data) {
    throw new Error("GraphQL response did not contain data");
  }
  const order = body.data.addItemToOrder;
  if ("errorCode" in order) {
    throw new Error(order.message);
  }

  expect(order.__typename).toBe("Order");
  expect(order.id).toBeTruthy();
  expect(order.state).toBe("AddingItems");
  expect(order.totalQuantity).toBe(1);
  expect(order.lines).toHaveLength(1);
  expect(order.lines[0].quantity).toBe(1);
  expect(order.lines[0].productVariant.id).toBe(variant.id);
  expect(order.lines[0].unitPriceWithTax).toBeGreaterThan(0);
  expect(order.lines[0].linePriceWithTax).toBe(
    order.lines[0].unitPriceWithTax,
  );
  expect(order.totalWithTax).toBe(order.subTotalWithTax);
});

test("Should keep the added items in the active order", async ({
  cartApiClient,
}) => {
  const [variant] = await getInStockVariants(cartApiClient, 1);
  await cartApiClient.addToCart(variant.id, 2);

  const { body } = await cartApiClient.getActiveOrder();

  if (!body.data || !body.data.activeOrder) {
    throw new Error("Expected an active order");
  }
  expect(body.data.activeOrder.totalQuantity).toBe(2);
  expect(body.data.activeOrder.lines).toHaveLength(1);
  expect(body.data.activeOrder.lines[0].quantity).toBe(2);
});

test("Should merge the quantity when the same variant is added twice", async ({
  cartApiClient,
}) => {
  const [variant] = await getInStockVariants(cartApiClient, 1);

  await cartApiClient.addToCart(variant.id, 1);
  const { body } = await cartApiClient.addToCart(variant.id, 1);

  if (!body.data) {
    throw new Error("GraphQL response did not contain data");
  }
  const order = body.data.addItemToOrder;
  if ("errorCode" in order) {
    throw new Error(order.message);
  }
  expect(order.lines).toHaveLength(1);
  expect(order.lines[0].quantity).toBe(2);
  expect(order.totalQuantity).toBe(2);
});

test("Should add different variants as separate lines", async ({
  cartApiClient,
}) => {
  const [first, second] = await getInStockVariants(cartApiClient, 2);

  await cartApiClient.addToCart(first.id, 1);
  const { body } = await cartApiClient.addToCart(second.id, 2);

  if (!body.data) {
    throw new Error("GraphQL response did not contain data");
  }
  const order = body.data.addItemToOrder;
  if ("errorCode" in order) {
    throw new Error(order.message);
  }

  expect(order.lines).toHaveLength(2);
  expect(order.totalQuantity).toBe(3);

  const linesTotal = order.lines.reduce(
    (sum, line) => sum + line.linePriceWithTax,
    0,
  );
  expect(order.subTotalWithTax).toBe(linesTotal);
});

test("Should adjust the quantity of a line", async ({ cartApiClient }) => {
  const [variant] = await getInStockVariants(cartApiClient, 1);
  const added = await cartApiClient.addToCart(variant.id, 1);
  if (!added.body.data || "errorCode" in added.body.data.addItemToOrder) {
    throw new Error("Could not add the item");
  }
  const line = added.body.data.addItemToOrder.lines[0];

  const { body } = await cartApiClient.adjustQuantity(line.id, 3);

  if (!body.data) {
    throw new Error("GraphQL response did not contain data");
  }
  const order = body.data.adjustOrderLine;
  if ("errorCode" in order) {
    throw new Error(order.message);
  }
  expect(order.lines).toHaveLength(1);
  expect(order.lines[0].quantity).toBe(3);
  expect(order.lines[0].linePriceWithTax).toBe(
    order.lines[0].unitPriceWithTax * 3,
  );
  expect(order.totalQuantity).toBe(3);
});

test("Should remove the line when its quantity is adjusted to zero", async ({
  cartApiClient,
}) => {
  const [variant] = await getInStockVariants(cartApiClient, 1);
  const added = await cartApiClient.addToCart(variant.id, 2);
  if (!added.body.data || "errorCode" in added.body.data.addItemToOrder) {
    throw new Error("Could not add the item");
  }
  const line = added.body.data.addItemToOrder.lines[0];

  const { body } = await cartApiClient.adjustQuantity(line.id, 0);

  if (!body.data) {
    throw new Error("GraphQL response did not contain data");
  }
  const order = body.data.adjustOrderLine;
  if ("errorCode" in order) {
    throw new Error(order.message);
  }
  expect(order.lines).toHaveLength(0);
  expect(order.totalQuantity).toBe(0);
});

test("Should remove a line from the cart", async ({ cartApiClient }) => {
  const [first, second] = await getInStockVariants(cartApiClient, 2);
  await cartApiClient.addToCart(first.id, 1);
  const added = await cartApiClient.addToCart(second.id, 1);
  if (!added.body.data || "errorCode" in added.body.data.addItemToOrder) {
    throw new Error("Could not add the items");
  }
  const orderBefore = added.body.data.addItemToOrder;
  if ("errorCode" in orderBefore) {
    throw new Error("Could not add the items");
  }
  const lineToRemove = orderBefore.lines[0];
  const lineToKeep = orderBefore.lines[1];

  const { body } = await cartApiClient.removeItem(lineToRemove.id);

  if (!body.data) {
    throw new Error("GraphQL response did not contain data");
  }
  const order = body.data.removeOrderLine;
  if ("errorCode" in order) {
    throw new Error(order.message);
  }
  expect(order.lines).toHaveLength(1);
  expect(order.lines[0].id).toBe(lineToKeep.id);
  expect(order.totalQuantity).toBe(1);
});

test("Should reject a negative quantity", async ({ cartApiClient }) => {
  const [variant] = await getInStockVariants(cartApiClient, 1);

  const { body } = await cartApiClient.addToCart(variant.id, -1);

  if (!body.data) {
    throw new Error("GraphQL response did not contain data");
  }
  const result = body.data.addItemToOrder;
  expect(result.__typename).toBe("NegativeQuantityError");
  if (!("errorCode" in result)) {
    throw new Error("Expected an error result");
  }
  expect(result.errorCode).toBeTruthy();
  expect(result.message).toBeTruthy();
});

test("Should reject an invalid coupon code", async ({ cartApiClient }) => {
  const [variant] = await getInStockVariants(cartApiClient, 1);
  await cartApiClient.addToCart(variant.id, 1);

  const { body } = await cartApiClient.applyCouponCode("NOT-A-REAL-CODE");

  if (!body.data) {
    throw new Error("GraphQL response did not contain data");
  }
  const result = body.data.applyCouponCode;
  expect(result.__typename).toBe("CouponCodeInvalidError");
  if (!("errorCode" in result)) {
    throw new Error("Expected an error result");
  }
  expect(result.errorCode).toBeTruthy();
  expect(result.message).toBeTruthy();
});
