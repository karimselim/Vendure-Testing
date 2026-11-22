import { expect } from "@playwright/test";
import { test } from "../../../fixtures/base";

test("Should display all required info for the product", async ({
  productDetailsPage,
  productsPage,
  page,
}) => {
  await page.goto("/search");
  const cards = productsPage.getProducts();
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  const seen = { inStock: 0, outStock: 0 };

  for (let i = 0; i < count; i++) {
    await test.step(`product ${i + 1}`, async () => {
      await page.goto("/search");

      const card = cards.nth(i);
      await expect(card).toBeVisible();

      await card.click();

      const details = productDetailsPage.getProductDetails();
      await expect.soft(details.price).not.toBeEmpty();
      await expect.soft(details.title).not.toBeEmpty();
      await expect.soft(details.sku).not.toBeEmpty();
      await expect
        .soft(details.stockStatus)
        .toHaveText(/(In Stock|Out of Stock)/i);

      if ((await details.stockStatus.innerText()) === "Out of Stock") {
        await expect.soft(details.addToCartButton).toBeHidden();
        await expect.soft(details.outOfStockButton).toBeVisible();
        seen.outStock++;
      } else if ((await details.stockStatus.innerText()) === "In Stock") {
        await expect.soft(details.addToCartButton).toBeVisible();
        await expect.soft(details.outOfStockButton).toBeHidden();
        seen.inStock++;
      }
    });
  }
  expect(count).toEqual(seen.inStock + seen.outStock);
});
