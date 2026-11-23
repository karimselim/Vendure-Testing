import { expect } from "@playwright/test";
import { test } from "../../../fixtures/base";

test("Make sure cart is empty", async ({ cartPage, page }) => {
  await page.goto("/cart");
  const emptyCartInfo = cartPage.getEmptyCartInfo();
  await expect(emptyCartInfo.EmptyCartHeading).toHaveText("Your Cart is Empty");
  await expect(emptyCartInfo.continueShoppingButton).toBeEnabled();
  await emptyCartInfo.continueShoppingButton.click();
  await expect(page).toHaveURL("");
});
