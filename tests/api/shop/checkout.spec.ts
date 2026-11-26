import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api-base";
import { CartApiClient } from "../../../api-clients/shop/cart-api-client";
import { CheckoutApiClient } from "../../../api-clients/shop/checkout-api-client";
import {
  addressInputType,
  checkoutOrderType,
  checkoutResultType,
} from "../../../types/api-types/shop/checkout-api";

const address: addressInputType = {
  fullName: "Test Buyer",
  streetLine1: "1 Tahrir Square",
  city: "Cairo",
  postalCode: "11511",
  countryCode: "EG",
  phoneNumber: "+201000000000",
};

// A unique guest email per test, so repeated runs never collide.
function guestCustomer() {
  const id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  return {
    emailAddress: `guest-${id}@example.com`,
    firstName: "Test",
    lastName: "Buyer",
  };
}

// Unwraps a mutation result: returns the order, or throws the GraphQL error.
function expectOrder(result: checkoutResultType | null | undefined) {
  if (!result) {
    throw new Error("The mutation returned nothing");
  }
  if ("errorCode" in result) {
    throw new Error(`${result.errorCode}: ${result.message}`);
  }
  return result as checkoutOrderType;
}

async function addInStockItem(cartApiClient: CartApiClient) {
  const { body } = await cartApiClient.getProductVariants();
  const variant = body.data?.products.items
    .flatMap((product) => product.variants)
    .find((v) => v.stockLevel === "IN_STOCK");
  if (!variant) {
    throw new Error("No in-stock variant found in the store");
  }
  await cartApiClient.addToCart(variant.id, 1);
  return variant;
}

// Takes a cart through customer, address and shipping, and leaves the order
// ready to move to payment.
async function prepareOrder(
  cartApiClient: CartApiClient,
  checkoutApiClient: CheckoutApiClient,
) {
  await addInStockItem(cartApiClient);
  const customer = await checkoutApiClient.setCustomerForOrder(
    guestCustomer(),
  );
  expectOrder(customer.body.data?.setCustomerForOrder);
  const withAddress = await checkoutApiClient.setShippingAddress(address);
  expectOrder(withAddress.body.data?.setOrderShippingAddress);

  const { body } = await checkoutApiClient.getEligibleMethods();
  const shippingMethod = body.data?.eligibleShippingMethods[0];
  if (!shippingMethod) {
    throw new Error("No eligible shipping method");
  }
  const withShipping = await checkoutApiClient.setShippingMethod(
    shippingMethod.id,
  );
  return {
    order: expectOrder(withShipping.body.data?.setOrderShippingMethod),
    shippingMethod,
  };
}

test("Should set the guest customer on the order", async ({
  cartApiClient,
  checkoutApiClient,
}) => {
  await addInStockItem(cartApiClient);
  const input = guestCustomer();

  const { body } = await checkoutApiClient.setCustomerForOrder(input);

  const order = expectOrder(body.data?.setCustomerForOrder);
  expect(order.customer?.emailAddress).toBe(input.emailAddress);
  expect(order.customer?.firstName).toBe(input.firstName);
});

test("Should set the shipping address on the order", async ({
  cartApiClient,
  checkoutApiClient,
}) => {
  await addInStockItem(cartApiClient);
  await checkoutApiClient.setCustomerForOrder(guestCustomer());

  const { body } = await checkoutApiClient.setShippingAddress(address);

  const order = expectOrder(body.data?.setOrderShippingAddress);
  expect(order.shippingAddress?.fullName).toBe(address.fullName);
  expect(order.shippingAddress?.streetLine1).toBe(address.streetLine1);
  expect(order.shippingAddress?.city).toBe(address.city);
  expect(order.shippingAddress?.postalCode).toBe(address.postalCode);
});

test("Should offer shipping and payment methods once the order has an address", async ({
  cartApiClient,
  checkoutApiClient,
}) => {
  await addInStockItem(cartApiClient);
  await checkoutApiClient.setCustomerForOrder(guestCustomer());
  await checkoutApiClient.setShippingAddress(address);

  const { body } = await checkoutApiClient.getEligibleMethods();

  expect(body.data?.eligibleShippingMethods.length).toBeGreaterThan(0);
  expect(body.data?.eligiblePaymentMethods.length).toBeGreaterThan(0);
  for (const method of body.data?.eligibleShippingMethods ?? []) {
    expect(method.id).toBeTruthy();
    expect(method.priceWithTax).toBeGreaterThanOrEqual(0);
  }
});

test("Should add the shipping cost to the order total", async ({
  cartApiClient,
  checkoutApiClient,
}) => {
  const { order, shippingMethod } = await prepareOrder(
    cartApiClient,
    checkoutApiClient,
  );

  expect(order.shippingLines).toHaveLength(1);
  expect(order.shippingLines[0].shippingMethod.id).toBe(shippingMethod.id);
  expect(order.shippingWithTax).toBe(shippingMethod.priceWithTax);
  expect(order.totalWithTax).toBe(
    order.subTotalWithTax + order.shippingWithTax,
  );
});

test("Should place an order with the standard payment method", async ({
  cartApiClient,
  checkoutApiClient,
}) => {
  const { order: prepared } = await prepareOrder(
    cartApiClient,
    checkoutApiClient,
  );

  const transition = await checkoutApiClient.transitionToState(
    "ArrangingPayment",
  );
  expect(
    expectOrder(transition.body.data?.transitionOrderToState).state,
  ).toBe("ArrangingPayment");

  const { body } = await checkoutApiClient.addPayment("standard-payment", {
    shouldDecline: false,
    shouldError: false,
    shouldErrorOnSettle: false,
  });

  const order = expectOrder(body.data?.addPaymentToOrder);
  expect(order.state).toBe("PaymentAuthorized");
  expect(order.active).toBe(false);
  expect(order.code).toBeTruthy();
  expect(order.totalWithTax).toBe(prepared.totalWithTax);
  expect(order.payments).toHaveLength(1);
  expect(order.payments?.[0].method).toBe("standard-payment");

  // The finished order can be read back by its code.
  const fetched = await checkoutApiClient.getOrderByCode(order.code);
  expect(fetched.body.data?.orderByCode?.code).toBe(order.code);
  expect(fetched.body.data?.orderByCode?.totalWithTax).toBe(
    prepared.totalWithTax,
  );
});

test("Should leave the cart empty after the order is placed", async ({
  cartApiClient,
  checkoutApiClient,
}) => {
  await prepareOrder(cartApiClient, checkoutApiClient);
  await checkoutApiClient.transitionToState("ArrangingPayment");
  await checkoutApiClient.addPayment("standard-payment", {
    shouldDecline: false,
    shouldError: false,
    shouldErrorOnSettle: false,
  });

  const { body } = await cartApiClient.getActiveOrder();

  expect(body.data?.activeOrder).toBeNull();
});

test("Should reject a declined payment", async ({
  cartApiClient,
  checkoutApiClient,
}) => {
  await prepareOrder(cartApiClient, checkoutApiClient);
  await checkoutApiClient.transitionToState("ArrangingPayment");

  const { body } = await checkoutApiClient.addPayment("standard-payment", {
    shouldDecline: true,
    shouldError: false,
    shouldErrorOnSettle: false,
  });

  const result = body.data?.addPaymentToOrder;
  expect(result?.__typename).toBe("PaymentDeclinedError");
  const { body: active } = await cartApiClient.getActiveOrder();
  expect(active.data?.activeOrder?.state).toBe("ArrangingPayment");
});

test("Should not move to payment without a shipping address", async ({
  cartApiClient,
  checkoutApiClient,
}) => {
  await addInStockItem(cartApiClient);
  await checkoutApiClient.setCustomerForOrder(guestCustomer());

  const { body } = await checkoutApiClient.transitionToState(
    "ArrangingPayment",
  );

  const result = body.data?.transitionOrderToState;
  expect(result?.__typename).toBe("OrderStateTransitionError");
});

test("Should reject an unknown payment method", async ({
  cartApiClient,
  checkoutApiClient,
}) => {
  await prepareOrder(cartApiClient, checkoutApiClient);
  await checkoutApiClient.transitionToState("ArrangingPayment");

  const { body } = await checkoutApiClient.addPayment("no-such-method");

  // An unknown method is not a typed error result: Vendure answers with a
  // top-level GraphQL error and no order data.
  expect(body.errors?.length).toBeGreaterThan(0);
  expect(body.data?.addPaymentToOrder ?? null).toBeNull();
});

test("Should reject the checkout steps when there is no active order", async ({
  checkoutApiClient,
}) => {
  const { body } = await checkoutApiClient.setShippingAddress(address);

  expect(body.data?.setOrderShippingAddress.__typename).toBe(
    "NoActiveOrderError",
  );
});
