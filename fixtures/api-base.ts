import { ShopApiClient } from "../api-clients/shop-api-client";
import { LoginApiClient } from "../api-clients/auth/login-api-client";
import { test as base } from "@playwright/test";
import { SignupApiClient } from "../api-clients/auth/signup-api-client";
import { ForgotPasswordApiClient } from "../api-clients/auth/forgotPassword-api-clients";
import { GetProductsApiClient } from "../api-clients/shop/getProducts-api-client";
import { ProductDetailsApiClient } from "../api-clients/shop/productDetails-api-client";
import { ResetPasswordApiClient } from "../api-clients/auth/resetPassword-api-client";
import { CartApiClient } from "../api-clients/shop/cart-api-client";
import { CheckoutApiClient } from "../api-clients/shop/checkout-api-client";

type MyFixtures = {
  loginApiClient: LoginApiClient;
  shopApiClient: ShopApiClient;
  signupApiClient: SignupApiClient;
  forgotPasswordApiClient: ForgotPasswordApiClient;
  getProductsApiClient: GetProductsApiClient;
  productDetailsApiClient: ProductDetailsApiClient;
  resetPasswordApiClient: ResetPasswordApiClient;
  cartApiClient: CartApiClient;
  checkoutApiClient: CheckoutApiClient;
};

export const test = base.extend<MyFixtures>({
  shopApiClient: async ({ request }, use) => {
    const shopApiClient = new ShopApiClient(request);
    await use(shopApiClient);
  },

  loginApiClient: async ({ shopApiClient }, use) => {
    const loginApiClient = new LoginApiClient(shopApiClient);
    await use(loginApiClient);
  },

  signupApiClient: async ({ shopApiClient }, use) => {
    const signupApiClient = new SignupApiClient(shopApiClient);
    await use(signupApiClient);
  },

  forgotPasswordApiClient: async ({ shopApiClient }, use) => {
    const forgotPasswordApiClient = new ForgotPasswordApiClient(shopApiClient);
    await use(forgotPasswordApiClient);
  },

  getProductsApiClient: async ({ shopApiClient }, use) => {
    const getProductsApiClient = new GetProductsApiClient(shopApiClient);
    await use(getProductsApiClient);
  },

  productDetailsApiClient: async ({ shopApiClient }, use) => {
    const productDetailsApiClient = new ProductDetailsApiClient(shopApiClient);
    await use(productDetailsApiClient);
  },

  resetPasswordApiClient: async ({ shopApiClient }, use) => {
    await use(new ResetPasswordApiClient(shopApiClient));
  },

  cartApiClient: async ({ shopApiClient }, use) => {
    const cartApiClient = new CartApiClient(shopApiClient);
    await use(cartApiClient);
  },

  checkoutApiClient: async ({ shopApiClient }, use) => {
    const checkoutApiClient = new CheckoutApiClient(shopApiClient);
    await use(checkoutApiClient);
  },
});
