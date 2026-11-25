import { Locator, Page } from "@playwright/test";
import { productDataType } from "../../types/ui/shop/productDetailsPage";

export class ProductDetailsPage {
  private readonly image: Locator;
  private readonly title: Locator;
  private readonly price: Locator;
  private readonly sku: Locator;
  private readonly stockStatus: Locator;
  private readonly addToCartButton: Locator;
  private readonly outOfStockButton: Locator;
  private readonly cartCount: Locator;

  constructor(private readonly page: Page) {
    this.image = this.page.getByTestId("productImg");
    this.title = this.page
      .getByTestId("productTitle")
      .filter({ visible: true });
    this.price = this.page
      .getByTestId("productPrice")
      .filter({ visible: true });
    this.sku = this.page.getByTestId("productSku");
    this.stockStatus = this.page.getByTestId("productStockStatus");
    this.addToCartButton = this.page.getByRole("button", {
      name: "Add to Cart",
    });
    this.outOfStockButton = this.page.getByRole("button", {
      name: "Out of Stock",
    });
    this.cartCount = this.page.getByTestId("cartCount");
  }

  getProductDetails(): productDataType {
    return {
      title: this.title,
      price: this.price,
      sku: this.sku,
      stockStatus: this.stockStatus,
      addToCartButton: this.addToCartButton,
      outOfStockButton: this.outOfStockButton,
    };
  }

  // Products with variants (for example sizes) only show price, SKU and stock
  // after an option is chosen, so pick the first one when a choice is offered.
  async selectFirstOptionIfPresent(): Promise<void> {
    await this.title.first().waitFor();
    const options = this.page.getByRole("radio");
    if ((await options.count()) > 0) {
      // A click can be intercepted by the fixed header or an overlay, so send
      // the click event straight to the option.
      await options.first().dispatchEvent("click");
    }
  }

  async getCartCount() {
    if (!(await this.cartCount.isVisible())) return 0;
    const value = await this.cartCount.textContent();
    const text = value ?? "";
    return Number(text.trim()) || 0;
  }
}
