import { expect, Locator, Page } from "@playwright/test";
import { cartItemType } from "../../types/ui/shop/cartPage";

export class CartPage {
  private readonly emptyCart: Locator;
  private readonly emptyCartHeading: Locator;
  private readonly continueShoppingButton: Locator;
  private readonly cartItems: Locator;
  private readonly orderSummary: Locator;
  private readonly subtotal: Locator;
  private readonly shipping: Locator;
  private readonly total: Locator;
  private readonly proceedToCheckoutButton: Locator;
  private readonly summaryContinueShoppingButton: Locator;
  private readonly promotionCodeInput: Locator;
  private readonly applyPromotionCodeButton: Locator;
  private readonly appliedPromotionCodes: Locator;
  private readonly removePromotionCodeButton: Locator;

  constructor(private readonly page: Page) {
    this.emptyCart = this.page.getByTestId("emptyCart");
    this.emptyCartHeading = this.page.getByTestId("emptyCartHeading");
    this.continueShoppingButton = this.page.getByTestId("continueShopping");
    this.cartItems = this.page.getByTestId("cartItem");
    this.orderSummary = this.page.getByTestId("orderSummary");
    this.subtotal = this.page.getByTestId("cartSubtotal");
    this.shipping = this.page.getByTestId("cartShipping");
    this.total = this.page.getByTestId("cartTotal");
    this.proceedToCheckoutButton = this.page.getByTestId("proceedToCheckout");
    this.summaryContinueShoppingButton = this.page.getByTestId(
      "summaryContinueShopping",
    );
    this.promotionCodeInput = this.page.getByTestId("promotionCodeInput");
    this.applyPromotionCodeButton = this.page.getByTestId(
      "applyPromotionCode",
    );
    this.appliedPromotionCodes = this.page.getByTestId("appliedPromotionCode");
    this.removePromotionCodeButton = this.page.getByTestId(
      "removePromotionCode",
    );
  }

  async navigate(): Promise<void> {
    await this.page.goto("/cart");
    // The cart content streams in after the heading, so wait for either the
    // empty state or the first item before interacting.
    await expect(
      this.emptyCart.or(this.cartItems.first()),
    ).toBeVisible();
  }

  getEmptyCartInfo() {
    return {
      emptyCart: this.emptyCart,
      emptyCartHeading: this.emptyCartHeading,
      continueShoppingButton: this.continueShoppingButton,
    };
  }

  getCartItems(): Locator {
    return this.cartItems;
  }

  getCartItem(index: number): cartItemType {
    const item = this.cartItems.nth(index);
    return {
      name: item.getByTestId("cartItemName"),
      sku: item.getByTestId("cartItemSku"),
      quantity: item.getByTestId("cartItemQuantity"),
      // The mobile layout renders its own hidden price copies, so pick the
      // visible one whichever way the viewport renders.
      linePrice: item.getByTestId("cartItemLinePrice").first(),
      unitPrice: item.getByTestId("cartItemUnitPrice"),
      increaseButton: item.getByTestId("increaseQuantity"),
      decreaseButton: item.getByTestId("decreaseQuantity"),
      removeButton: item.getByTestId("removeCartItem"),
    };
  }

  async getQuantity(index: number): Promise<number> {
    const text = await this.getCartItem(index).quantity.textContent();
    return Number((text ?? "").trim()) || 0;
  }

  async increaseQuantity(index: number): Promise<void> {
    const before = await this.getQuantity(index);
    await this.getCartItem(index).increaseButton.click();
    // Quantity updates go through a server action and re-render, so wait for
    // the new value instead of returning right after the click.
    await expect
      .poll(() => this.getQuantity(index), { timeout: 15000 })
      .toBe(before + 1);
  }

  async decreaseQuantity(index: number): Promise<void> {
    const before = await this.getQuantity(index);
    await this.getCartItem(index).decreaseButton.click();
    await expect
      .poll(() => this.getQuantity(index), { timeout: 15000 })
      .toBe(before - 1);
  }

  async removeItem(index: number): Promise<void> {
    const before = await this.cartItems.count();
    await this.getCartItem(index).removeButton.click();
    await expect(this.cartItems).toHaveCount(before - 1, { timeout: 15000 });
  }

  getOrderSummary() {
    return {
      orderSummary: this.orderSummary,
      subtotal: this.subtotal,
      shipping: this.shipping,
      total: this.total,
      proceedToCheckoutButton: this.proceedToCheckoutButton,
      summaryContinueShoppingButton: this.summaryContinueShoppingButton,
    };
  }

  async proceedToCheckout(): Promise<void> {
    await this.proceedToCheckoutButton.click();
    await expect(this.page).toHaveURL(/\/checkout/, { timeout: 15000 });
  }

  async applyPromotionCode(code: string): Promise<void> {
    await this.promotionCodeInput.fill(code);
    await this.applyPromotionCodeButton.click();
    // Applying a code runs a server action and re-renders the summary; wait
    // for the round trip so the caller checks the settled page.
    await this.page.waitForLoadState("networkidle");
  }

  getAppliedPromotionCodes(): Locator {
    return this.appliedPromotionCodes;
  }

  // Prices render as "$1,234.00"; strip everything but digits and the dot.
  async getPrice(locator: Locator): Promise<number> {
    const text = await locator.textContent();
    const cleaned = (text ?? "").replace(/[^0-9.]/g, "");
    return Number(cleaned) || 0;
  }

  async getSubtotal(): Promise<number> {
    return this.getPrice(this.subtotal);
  }

  async getTotal(): Promise<number> {
    return this.getPrice(this.total);
  }

  async getLinePrice(index: number): Promise<number> {
    return this.getPrice(this.getCartItem(index).linePrice);
  }

  async getUnitPrice(index: number): Promise<number> {
    return this.getPrice(this.getCartItem(index).unitPrice);
  }
}
