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
    this.shippingMethods = this.page.getByRole("radio");
    this.continueToPaymentButton = this.page.getByRole("button", {
      name: "Continue to payment",
    });
    this.paymentMethods = this.page.getByRole("radio");
    this.continueToReviewButton = this.page.getByRole("button", {
      name: "Continue to review",
    });
    this.placeOrderButton = this.page.getByRole("button", {
      name: "Place Order",
    });
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

  async chooseFirstShippingMethod(): Promise<void> {
    await this.shippingMethods.first().click();
    await this.continueToPaymentButton.click();
    await expect(this.paymentMethods.first()).toBeVisible({ timeout: 15000 });
  }

  async chooseFirstPaymentMethod(): Promise<void> {
    await this.paymentMethods.first().click();
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
    await this.placeOrderButton.click();
    await expect(this.page).toHaveURL(/\/order-confirmation\//, {
      timeout: 30000,
    });
  }

  getOrderConfirmedHeading(): Locator {
    return this.orderConfirmedHeading;
  }
}
