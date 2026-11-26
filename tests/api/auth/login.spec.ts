import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api-base";
import { loginData } from "../../../test-data/auth/login";

test.describe("Login API", () => {
  test("valid login", async ({ loginApiClient }) => {
    const password = process.env.SIGNUP_PASSWORD;

    if (!password) {
      throw new Error("SIGNUP_PASSWORD is missing from the .env file");
    }

    const { body } = await loginApiClient.login(loginData.email, password);

    if (!body.data) {
      throw new Error("GraphQL response did not contain data");
    }

    const login = body.data.login;

    if ("errorCode" in login) {
      throw new Error(login.message);
    }

    expect(login.id).toBeTruthy();
    expect(login.identifier).toBe(loginData.email);
  });

  test("Should reject a wrong password for an existing user", async ({
    loginApiClient,
  }) => {
    const { body } = await loginApiClient.login(
      loginData.email,
      "WrongPassword#999",
    );

    expect(body.data?.login).toMatchObject({
      errorCode: "INVALID_CREDENTIALS_ERROR",
    });
  });

  test("Should reject an email that has no account", async ({
    loginApiClient,
  }) => {
    const { body } = await loginApiClient.login(
      `nobody-${Date.now()}@example.com`,
      "WrongPassword#999",
    );

    expect(body.data?.login).toMatchObject({
      errorCode: "INVALID_CREDENTIALS_ERROR",
    });
  });

  test("Should return the same error for a wrong password and an unknown email", async ({
    loginApiClient,
  }) => {
    const wrongPassword = await loginApiClient.login(
      loginData.email,
      "WrongPassword#999",
    );
    const unknownUser = await loginApiClient.login(
      `nobody-${Date.now()}@example.com`,
      "WrongPassword#999",
    );

    // Different messages would let an attacker find out which emails are registered.
    expect(wrongPassword.body.data?.login).toEqual(
      unknownUser.body.data?.login,
    );
  });

  test("Should reject an empty password", async ({ loginApiClient }) => {
    const { body } = await loginApiClient.login(loginData.email, "");

    expect(body.data?.login).toMatchObject({
      errorCode: "INVALID_CREDENTIALS_ERROR",
    });
  });
});
