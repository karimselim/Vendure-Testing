import { expect } from "@playwright/test";
import { test } from "../../../fixtures/base";
import { addFirstInStockProductToCart } from "./helpers";

// A unique guest email per test, so repeated runs never collide.
function guestContact() {
  const id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  return {
    emailAddress: `ui-guest-${id}@example.com`,
    firstName: "Test",
    lastName: "Buyer",
  };
}

const address = {
  fullName: "Test Buyer",
  streetLine1: "1 Tahrir Square",
  city: "Cairo",
  postalCode: "11511",
  phoneNumber: "+201000000000",
};

test("Should show the empty cart message when checking out with no items", async ({
  page,
}) => {
  await page.goto("/checkout");

  await expect(page.getByText("Your cart is empty.")).toBeVisible();
});

test("Should require the contact details before continuing", async ({
  cartPage,
  checkoutPage,
  productsPage,
  productDetailsPage,
  page,
}) => {
  await addFirstInStockProductToCart(page, productsPage, productDetailsPage);
  await cartPage.navigate();
  await cartPage.proceedToCheckout();
  await expect(checkoutPage.getEmailInput()).toBeVisible();

  await checkoutPage.submitContactForm();

  await expect(checkoutPage.getValidationError("Email is required")).toBeVisible();
  await expect(
    checkoutPage.getValidationError("First name is required"),
  ).toBeVisible();
  await expect(
    checkoutPage.getValidationError("Last name is required"),
  ).toBeVisible();
});

test("Should reject an invalid email address", async ({
  cartPage,
  checkoutPage,
  productsPage,
  productDetailsPage,
  page,
}) => {
  await addFirstInStockProductToCart(page, productsPage, productDetailsPage);
  await cartPage.navigate();
  await cartPage.proceedToCheckout();

  await checkoutPage.getEmailInput().fill("not-an-email");
  await checkoutPage.submitContactForm();

  await expect(
    checkoutPage.getValidationError("Invalid email address"),
  ).toBeVisible();
});

test("Should place an order as a guest from the cart to the confirmation page", async ({
  cartPage,
  checkoutPage,
  productsPage,
  productDetailsPage,
  page,
}) => {
  await addFirstInStockProductToCart(page, productsPage, productDetailsPage);
  await cartPage.navigate();
  await cartPage.proceedToCheckout();

  await checkoutPage.fillContact(guestContact());
  await checkoutPage.fillAddress(address);
  await checkoutPage.chooseFirstShippingMethod();
  await checkoutPage.chooseFirstPaymentMethod();
  await checkoutPage.placeOrder();

  await expect(checkoutPage.getOrderConfirmedHeading()).toBeVisible();
  await expect(page).toHaveURL(/\/order-confirmation\/[A-Z0-9]+/);
});
