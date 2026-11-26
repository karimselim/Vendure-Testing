import { signupData } from "./../../../test-data/auth/signup";
import { test } from "../../../fixtures/api-base";
import { expect } from "@playwright/test";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

function getPassword() {
  const password = process.env.SIGNUP_PASSWORD;
  if (!password)
    throw new Error("SIGNUP_PASSWORD is missing from the .env file");
  return password;
}

test.describe("Signup API", () => {
  test("Valid Signup Filling All Fields", async ({ signupApiClient }) => {
    const password = getPassword();

    const { body } = await signupApiClient.signup(
      signupData.email,
      signupData.firstName,
      signupData.lastName,
      signupData.phoneNumber,
      password,
    );

    if (!body.data) {
      throw new Error("GraphQL response did not contain data");
    }

    const signup = body.data.registerCustomerAccount;

    if ("errorCode" in signup) {
      throw new Error(signup.message);
    }

    expect(signup.success).toBe(true);
  });

  test("Should reject a password that is too short", async ({
    signupApiClient,
  }) => {
    const { body } = await signupApiClient.signup(
      uniqueEmail("weak"),
      signupData.firstName,
      signupData.lastName,
      signupData.phoneNumber,
      "x",
    );

    expect(body.data?.registerCustomerAccount).toMatchObject({
      errorCode: "PASSWORD_VALIDATION_ERROR",
    });
  });

  test("Should not reveal whether an email is already registered", async ({
    signupApiClient,
  }) => {
    const password = getPassword();

    const { body } = await signupApiClient.signup(
      signupData.email,
      signupData.firstName,
      signupData.lastName,
      signupData.phoneNumber,
      password,
    );

    // The email belongs to the seeded customer. A success reply with no error
    // keeps registered emails private.
    expect(body.data?.registerCustomerAccount).toMatchObject({ success: true });
  });

  test("Should reject an email address with no @", async ({
    signupApiClient,
  }) => {
    test.fail(
      true,
      "Known bug: registerCustomerAccount accepts 'not-an-email' and returns success",
    );
    const { body } = await signupApiClient.signup(
      "not-an-email",
      signupData.firstName,
      signupData.lastName,
      signupData.phoneNumber,
      getPassword(),
    );

    expect(body.errors ?? body.data?.registerCustomerAccount).toBeTruthy();
    expect(body.data?.registerCustomerAccount).not.toMatchObject({
      success: true,
    });
  });
});
