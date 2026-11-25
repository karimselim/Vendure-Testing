import { expect, Locator } from "@playwright/test";
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

test("Should add an in-stock product to the cart", async ({
  productDetailsPage,
  productsPage,
  page,
}) => {
  await page.goto("/search");
  const products = productsPage.getProducts();
  await expect(products.first()).toBeVisible();
  const count = await products.count();

  let tested = false;
  for (let i = 0; i < count && !tested; i++) {
    await page.goto("/search");
    await expect(products.first()).toBeVisible();
    await products.nth(i).click();

    const { stockStatus, addToCartButton } =
      productDetailsPage.getProductDetails();
    await expect(stockStatus).toHaveText(/(In|Out of) Stock/i);

    const status = (await stockStatus.innerText()).trim();
    if (!/^in stock/i.test(status)) continue;

    await expect(addToCartButton).toBeVisible();
    const countBefore = await productDetailsPage.getCartCount();
    await addToCartButton.click();
    await expect
      .poll(() => productDetailsPage.getCartCount())
      .toBe(countBefore + 1);

    tested = true;
  }

  expect(tested, "No in-stock product found in the store").toBe(true);
});
