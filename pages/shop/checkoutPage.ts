import { expect, Locator, Page } from "@playwright/test";
import {
  checkoutAddressType,
  checkoutContactType,
} from "../../types/ui/shop/checkoutPage";

export class CheckoutPage {
  private readonly emailInput: Locator;
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly contactContinueButton: Locator;
  private readonly fullNameInput: Locator;
  private readonly streetInput: Locator;
  private readonly cityInput: Locator;
  private readonly postalCodeInput: Locator;
  private readonly phoneInput: Locator;
  private readonly addressContinueButton: Locator;
  private readonly saveAddressButton: Locator;
  private readonly continueWithSelectedButton: Locator;
  private readonly shippingMethods: Locator;
  private readonly continueToPaymentButton: Locator;
  private readonly paymentMethods: Locator;
  private readonly continueToReviewButton: Locator;
  private readonly placeOrderButton: Locator;
  private readonly orderConfirmedHeading: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = this.page.locator("#emailAddress");
    this.firstNameInput = this.page.locator("#firstName");
    this.lastNameInput = this.page.locator("#lastName");
    this.contactContinueButton = this.page.getByRole("button", {
      name: "Continue",
      exact: true,
    });
    this.fullNameInput = this.page.locator("#fullName");
    this.streetInput = this.page.locator("#streetLine1");
    this.cityInput = this.page.locator("#city");
    this.postalCodeInput = this.page.locator("#postalCode");
    this.phoneInput = this.page.locator("#phoneNumber");
    this.addressContinueButton = this.page.getByRole("button", {
      name: "Continue",
      exact: true,
    });
    this.saveAddressButton = this.page.getByRole("button", {
      name: "Save address",
    });
    this.continueWithSelectedButton = this.page.getByRole("button", {
      name: "Continue with selected address",
    });
    this.shippingMethods = this.page.getByRole("radio");
    this.continueToPaymentButton = this.page.getByRole("button", {
      name: "Continue to payment",
    });
    this.paymentMethods = this.page.getByRole("radio");
    this.continueToReviewButton = this.page.getByRole("button", {
      name: "Continue to review",
    });
    // The accordion header is also named "Place Order", so match the action button only.
    this.placeOrderButton = this.page
      .locator('button[data-slot="button"]')
      .filter({ hasText: "Place Order" });
    this.orderConfirmedHeading = this.page.getByRole("heading", {
      name: "Order Confirmed!",
    });
  }

  async navigate(): Promise<void> {
    await this.page.goto("/checkout");
    await expect(this.emailInput).toBeVisible();
  }

  async fillContact(contact: checkoutContactType): Promise<void> {
    await this.emailInput.fill(contact.emailAddress);
    await this.firstNameInput.fill(contact.firstName);
    await this.lastNameInput.fill(contact.lastName);
    await this.contactContinueButton.click();
    // The address step replaces the contact form.
    await expect(this.fullNameInput).toBeVisible({ timeout: 15000 });
  }

  async fillAddress(address: checkoutAddressType): Promise<void> {
    await this.fullNameInput.fill(address.fullName);
    await this.streetInput.fill(address.streetLine1);
    await this.cityInput.fill(address.city);
    await this.postalCodeInput.fill(address.postalCode);
    await this.phoneInput.fill(address.phoneNumber);
    await this.addressContinueButton.click();
    await expect(this.shippingMethods.first()).toBeVisible({ timeout: 15000 });
  }

  // A logged in customer has no contact step. With no saved address the storefront
  // opens an "add address" dialog. With a saved address it lists it, so pick that one.
  async chooseCustomerAddress(address: checkoutAddressType): Promise<void> {
    await expect(
      this.fullNameInput
        .or(this.continueWithSelectedButton)
        .or(this.continueToPaymentButton),
    ).toBeVisible({ timeout: 30000 });

    // A logged in customer keeps the open order, so the address can already be set.
    if (await this.continueToPaymentButton.isVisible()) return;

    if (await this.fullNameInput.isVisible()) {
      await this.fullNameInput.fill(address.fullName);
      await this.streetInput.fill(address.streetLine1);
      await this.cityInput.fill(address.city);
      await this.postalCodeInput.fill(address.postalCode);
      await this.phoneInput.fill(address.phoneNumber);
      await this.saveAddressButton.click();
      await expect(this.continueWithSelectedButton).toBeVisible({
        timeout: 30000,
      });
    }

    await this.page.getByRole("radio").first().click();
    await expect(this.continueWithSelectedButton).toBeEnabled();
    await this.continueWithSelectedButton.click();
    await expect(this.shippingMethods.first()).toBeVisible({ timeout: 15000 });
  }

  async chooseFirstShippingMethod(): Promise<void> {
    // The page can re-render right after the previous step, which drops the
    // selection, so click again until "Continue to payment" is enabled.
    await expect(async () => {
      await this.shippingMethods.first().click();
      await expect(this.continueToPaymentButton).toBeEnabled({ timeout: 2000 });
    }).toPass({ timeout: 30000 });
    await this.continueToPaymentButton.click();
    await expect(this.paymentMethods.first()).toBeVisible({ timeout: 15000 });
  }

  async chooseFirstPaymentMethod(): Promise<void> {
    await expect(async () => {
      await this.paymentMethods.first().click();
      await expect(this.continueToReviewButton).toBeEnabled({ timeout: 2000 });
    }).toPass({ timeout: 30000 });
    await this.continueToReviewButton.click();
    await expect(this.placeOrderButton).toBeVisible({ timeout: 15000 });
  }

  getValidationError(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  async submitContactForm(): Promise<void> {
    await this.contactContinueButton.click();
  }

  getEmailInput(): Locator {
    return this.emailInput;
  }

  getPlaceOrderButton(): Locator {
    return this.placeOrderButton;
  }

  async placeOrder(): Promise<void> {
    await expect(this.placeOrderButton).toBeEnabled({ timeout: 15000 });
    await this.placeOrderButton.click();
    await expect(this.page).toHaveURL(/\/order-confirmation\//, {
      timeout: 30000,
    });
  }

  getOrderConfirmedHeading(): Locator {
    return this.orderConfirmedHeading;
  }
}
