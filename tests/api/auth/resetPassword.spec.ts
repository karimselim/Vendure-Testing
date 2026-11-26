import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api-base";

test.describe("Reset password API", () => {
  test("Should reject a reset token that does not exist", async ({
    resetPasswordApiClient,
  }) => {
    const { body } = await resetPasswordApiClient.resetPassword(
      "not-a-real-token",
      "Abcdef#123456",
    );

    expect(body.data?.resetPassword).toMatchObject({
      errorCode: "PASSWORD_RESET_TOKEN_INVALID_ERROR",
    });
  });
});
