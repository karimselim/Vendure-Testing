import { expect } from "@playwright/test";
import { test } from "../../../fixtures/base";
import { addFirstInStockProductToCart } from "./helpers";

test.describe("Cart UI", () => {
  test("Make sure cart is empty", async ({ cartPage, page }) => {
    await cartPage.navigate();
    const emptyCartInfo = cartPage.getEmptyCartInfo();
    await expect(emptyCartInfo.emptyCartHeading).toHaveText(
      "Your Cart is Empty",
    );
    await expect(emptyCartInfo.continueShoppingButton).toBeVisible();
    await emptyCartInfo.continueShoppingButton.click();
    await expect(page).toHaveURL("");
  });

  test("Should show the added product in the cart with its details", async ({
    cartPage,
    productsPage,
    productDetailsPage,
    page,
  }) => {
    const added = await addFirstInStockProductToCart(
      page,
      productsPage,
      productDetailsPage,
    );

    await cartPage.navigate();
    await expect(cartPage.getCartItems()).toHaveCount(1);

    const item = cartPage.getCartItem(0);
    await expect(item.name).toHaveText(added.title);
    await expect(item.sku).toHaveText(added.sku);
    await expect(item.quantity).toHaveText("1");

    const unitPrice = await cartPage.getUnitPrice(0);
    expect(unitPrice).toBeGreaterThan(0);
    expect(await cartPage.getLinePrice(0)).toBeCloseTo(unitPrice, 2);

    const summary = cartPage.getOrderSummary();
    await expect(summary.orderSummary).toBeVisible();
    expect(await cartPage.getSubtotal()).toBeCloseTo(unitPrice, 2);
    // Nothing is shipped yet, so the total equals the subtotal.
    expect(await cartPage.getTotal()).toBeCloseTo(await cartPage.getSubtotal(), 2);
  });

  test("Should update the quantity and prices with the plus and minus buttons", async ({
    cartPage,
    productsPage,
    productDetailsPage,
    page,
  }) => {
    await addFirstInStockProductToCart(page, productsPage, productDetailsPage);
    await cartPage.navigate();

    const item = cartPage.getCartItem(0);
    const unitPrice = await cartPage.getUnitPrice(0);

    // Minus is disabled at the minimum quantity of 1.
    await expect(item.decreaseButton).toBeDisabled();

    await cartPage.increaseQuantity(0);
    expect(await cartPage.getLinePrice(0)).toBeCloseTo(unitPrice * 2, 2);
    expect(await cartPage.getSubtotal()).toBeCloseTo(unitPrice * 2, 2);
    expect(await cartPage.getTotal()).toBeCloseTo(unitPrice * 2, 2);

    await cartPage.decreaseQuantity(0);
    expect(await cartPage.getLinePrice(0)).toBeCloseTo(unitPrice, 2);
    expect(await cartPage.getSubtotal()).toBeCloseTo(unitPrice, 2);
    await expect(item.decreaseButton).toBeDisabled();
  });

  test("Should remove the item and show the empty cart", async ({
    cartPage,
    productsPage,
    productDetailsPage,
    page,
  }) => {
    await addFirstInStockProductToCart(page, productsPage, productDetailsPage);
    await cartPage.navigate();
    await expect(cartPage.getCartItems()).toHaveCount(1);

    await cartPage.removeItem(0);

    const emptyCartInfo = cartPage.getEmptyCartInfo();
    await expect(emptyCartInfo.emptyCartHeading).toHaveText(
      "Your Cart is Empty",
    );
  });

  test("Should navigate to checkout from the cart", async ({
    cartPage,
    productsPage,
    productDetailsPage,
    page,
  }) => {
    await addFirstInStockProductToCart(page, productsPage, productDetailsPage);
    await cartPage.navigate();

    await cartPage.proceedToCheckout();
    await expect(page).toHaveURL(/\/checkout/);
  });

  test("Should not apply an invalid promotion code", async ({
    cartPage,
    productsPage,
    productDetailsPage,
    page,
  }) => {
    await addFirstInStockProductToCart(page, productsPage, productDetailsPage);
    await cartPage.navigate();
    const totalBefore = await cartPage.getTotal();

    await cartPage.applyPromotionCode("NOT-A-REAL-CODE");

    // An invalid code is rejected: no coupon shows up, the entry form stays
    // and the total does not move.
    await expect(cartPage.getAppliedPromotionCodes()).toHaveCount(0);
    expect(await cartPage.getTotal()).toBeCloseTo(totalBefore, 2);
  });
});
