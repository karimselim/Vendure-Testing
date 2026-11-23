import { Locator, Page } from "@playwright/test";

export class CartPage {
  private readonly continueShoppingButton: Locator;
  private readonly EmptyCartHeading: Locator;
  constructor(private readonly page: Page) {
    this.continueShoppingButton = this.page.getByRole("button", {
      name: "Continue Shopping",
      exact: true,
    });
    this.EmptyCartHeading = this.page.getByText("Your Cart is Empty", {
      exact: true,
    });
  }

  getEmptyCartInfo() {
    return {
      continueShoppingButton: this.continueShoppingButton,
      EmptyCartHeading: this.EmptyCartHeading,
    };
  }
}
