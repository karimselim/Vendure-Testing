import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api-base";
import { loginData } from "../../../test-data/auth/login";

test.describe("Forgot password API", () => {
  test("Valid Forgot Passwor", async ({ forgotPasswordApiClient }) => {
    const { body } = await forgotPasswordApiClient.ForgotPassword(
      loginData.email,
    );

    if (!body.data) {
      throw new Error(body.errors[0].message);
    }

    const forgotPassword = body.data.requestPasswordReset;
    if ("errorCode" in forgotPassword) {
      throw new Error(forgotPassword.message);
    }
    expect(forgotPassword.success).toBe(true);
  });

  test("Should answer the same for an email that has no account", async ({
    forgotPasswordApiClient,
  }) => {
    const { body } = await forgotPasswordApiClient.ForgotPassword(
      `nobody-${Date.now()}@example.com`,
    );

    // A different reply would show which emails are registered.
    expect(body.data?.requestPasswordReset).toMatchObject({ success: true });
  });
});
