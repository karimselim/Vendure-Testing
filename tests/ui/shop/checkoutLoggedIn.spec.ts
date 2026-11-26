import { expect } from "@playwright/test";
import { test } from "../../../fixtures/base";
import { loginData } from "../../../test-data/auth/login";
import { addFirstInStockProductToCart } from "./helpers";

test.describe("Checkout UI as a logged in customer", () => {
  const address = {
    fullName: "Test Customer",
    streetLine1: "1 Tahrir Square",
    city: "Cairo",
    postalCode: "11511",
    phoneNumber: "+201000000000",
  };

  test("Should skip the contact step and place an order", async ({
    loginPage,
    cartPage,
    checkoutPage,
    productsPage,
    productDetailsPage,
    page,
  }) => {
    await loginPage.login(loginData);
    await page.waitForURL("http://localhost:3001/en");
    await addFirstInStockProductToCart(page, productsPage, productDetailsPage);
    await cartPage.navigate();
    await cartPage.proceedToCheckout();

    // A logged in customer already has contact details, so the address form comes first.
    await checkoutPage.fillAddress(address);
    await checkoutPage.chooseFirstShippingMethod();
    await checkoutPage.chooseFirstPaymentMethod();
    await checkoutPage.placeOrder();

    await expect(checkoutPage.getOrderConfirmedHeading()).toBeVisible();
    await expect(page).toHaveURL(/\/order-confirmation\/[A-Z0-9]+/);
  });

  test("Should not show the contact email field", async ({
    loginPage,
    cartPage,
    checkoutPage,
    productsPage,
    productDetailsPage,
    page,
  }) => {
    await loginPage.login(loginData);
    await page.waitForURL("http://localhost:3001/en");
    await addFirstInStockProductToCart(page, productsPage, productDetailsPage);
    await cartPage.navigate();
    await cartPage.proceedToCheckout();

    await expect(page).toHaveURL(/\/checkout/);
    await expect(checkoutPage.getEmailInput()).toHaveCount(0);
  });
});
