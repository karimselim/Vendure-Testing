import { expect, Page } from "@playwright/test";
import { ProductsPage } from "../../../pages/shop/productsPage";
import { ProductDetailsPage } from "../../../pages/shop/productDetailsPage";

// Finds the first in-stock product, adds it to the cart from its details
// page and returns what the cart should show for it. Several cart tests need
// a non-empty cart, and each test starts with a fresh empty session.
export async function addFirstInStockProductToCart(
  page: Page,
  productsPage: ProductsPage,
  productDetailsPage: ProductDetailsPage,
): Promise<{ title: string; sku: string }> {
  let added: { title: string; sku: string } | null = null;

  await page.goto("/search");
  const products = productsPage.getProducts();
  await expect(products.first()).toBeVisible();
  const count = await products.count();

  for (let i = 0; i < count && !added; i++) {
    await page.goto("/search");
    await expect(products.first()).toBeVisible();
    await products.nth(i).click();

    await productDetailsPage.selectFirstOptionIfPresent();
    const { title, sku, stockStatus, addToCartButton } =
      productDetailsPage.getProductDetails();
    await expect(stockStatus).toHaveText(/(In|Out of) Stock/i);
    if (!/^in stock/i.test((await stockStatus.innerText()).trim())) continue;

    const countBefore = await productDetailsPage.getCartCount();
    await addToCartButton.click();
    await expect
      .poll(() => productDetailsPage.getCartCount())
      .toBe(countBefore + 1);

    added = {
      title: (await title.first().innerText()).trim(),
      sku: (await sku.innerText()).trim(),
    };
  }

  if (!added) {
    throw new Error("No in-stock product found in the store");
  }
  return added;
}
