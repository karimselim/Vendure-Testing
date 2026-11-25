import { sortingMethodType } from "./../../types/ui/shop/productsPage";
import { expect, Locator, Page } from "@playwright/test";

export class ProductsPage {
  private readonly shopNowButton: Locator;
  private readonly products: Locator;
  private readonly sortingMenu: Locator;
  private readonly ZToAOption: Locator;
  private readonly AToZOption: Locator;
  private readonly lowestToHighestOption: Locator;
  private readonly highestToLowestOption: Locator;

  constructor(private readonly page: Page) {
    this.shopNowButton = this.page.getByRole("button", {
      name: "Shop Now",
      exact: true,
    });

    //pay attention that these are all the products
    // Next.js keeps pages you left (like the home page) hidden in the DOM,
    // so only count the cards that are actually shown.
    this.products = this.page.getByTestId("product").filter({ visible: true });

    this.sortingMenu = this.page.getByRole("combobox");
    this.ZToAOption = this.page.getByRole("option", {
      name: "Name: Z to A",
      exact: true,
    });
    this.AToZOption = this.page.getByRole("option", {
      name: "Name: A to Z",
      exact: true,
    });
    this.highestToLowestOption = this.page.getByRole("option", {
      name: "Price: High to Low",
      exact: true,
    });
    this.lowestToHighestOption = this.page.getByRole("option", {
      name: "Price: Low to High",
      exact: true,
    });
  }

  getProducts(): Locator {
    return this.products;
  }

  async navigateToProductsPage(): Promise<void> {
    await this.page.goto("/");
    // The button can be clicked before the page is interactive, which does
    // nothing. Retry the click until the products page opens.
    await expect(async () => {
      await this.shopNowButton.click();
      await expect(this.page).toHaveURL(/\/search/, { timeout: 5000 });
    }).toPass({ timeout: 30000 });
    // Wait for the search page itself, so cards from the home page that are
    // still in the DOM during the page change are not counted.
    await expect(
      this.page.getByRole("heading", { name: "Search", level: 1 }),
    ).toBeVisible();
    await expect(this.products.first()).toBeVisible();
  }

  async navigateToFirstProductDetails(): Promise<void> {
    await this.products.first().click();
  }

  async navigateToLastProductDetails(): Promise<void> {
    await this.products.last().click();
  }

  getProductImage(product: Locator): Locator {
    return product.getByTestId("image");
  }

  getProductTitle(product: Locator): Locator {
    return product.getByTestId("title");
  }

  getProductPrice(product: Locator): Locator {
    return product.getByTestId("price");
  }

  async sortingProducts(sortingMethod: sortingMethodType): Promise<void> {
    await this.page.goto("/search");
    const options: Record<sortingMethodType, Locator> = {
      "A-Z": this.AToZOption,
      "Z-A": this.ZToAOption,
      "highest to lowest": this.highestToLowestOption,
      "lowest to highest": this.lowestToHighestOption,
    };

    // the click can be lost if the page isn't interactive yet, so retry it with proof it worked
    await expect(async () => {
      await this.sortingMenu.click();
      await expect(options[sortingMethod]).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15000 });
    await options[sortingMethod].click();
  }
}
