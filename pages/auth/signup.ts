import { Page, Locator, expect } from "@playwright/test";

export class SignupPage {
  private readonly email: Locator;
  private readonly firstName: Locator;
  private readonly lastName: Locator;
  private readonly phoneNumber: Locator;
  private readonly password: Locator;
  private readonly confirmPassword: Locator;
  private readonly createAccountButton: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel("Email Address");
    this.firstName = page.getByLabel("First Name");
    this.lastName = page.getByLabel("Last Name");
    this.phoneNumber = page.getByLabel("Phone Number (Optional)");
    this.password = page.getByRole("textbox", {
      name: "Password",
      exact: true,
    });
    this.confirmPassword = page.getByRole("textbox", {
      name: "Confirm Password",
      exact: true,
    });
    this.createAccountButton = page.getByRole("button", {
      name: "Create Account",
    });
  }

  async signup(signupData: SignupDataType) {
    const passwordInput = process.env.SIGNUP_PASSWORD;
    if (!passwordInput) {
      throw new Error(
        "the password that I should get from .env file is not existing",
      );
    }

    await this.page.goto("/register");
    //I've removed networkIdle as playwright docs it self descourage using it
    //networkidle' - DISCOURAGED consider operation to be finished when there are no network connections

    await this.email.fill(signupData.email);
    await this.firstName.fill(signupData.firstName);
    await this.lastName.fill(signupData.lastName);
    await this.phoneNumber.fill(signupData.phoneNumber);
    await this.password.fill(passwordInput);
    await this.confirmPassword.fill(passwordInput);

    //That's a double check for the first input ( email ) as that's a known problem
    //https://github.com/react/react/issues/12955
    await expect(async () => {
      if ((await this.email.inputValue()) !== signupData.email) {
        await this.email.fill(signupData.email);
      }
      await expect(this.email).toHaveValue(signupData.email);
    }).toPass({ timeout: 10_000 });
    await this.createAccountButton.click();
  }
}
