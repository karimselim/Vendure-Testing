import { graphResetPasswordResponse } from "../../types/api-types/auth/resetPassword-api";
import { ShopApiClient } from "../shop-api-client";

export class ResetPasswordApiClient {
  constructor(private client: ShopApiClient) {}

  async resetPassword(token: string, password: string) {
    const query = `#graphql
      mutation ResetPassword($token: String!, $password: String!) {
        resetPassword(token: $token, password: $password) {
          __typename
          ... on CurrentUser {
            id
            identifier
          }
          ... on ErrorResult {
            errorCode
            message
          }
        }
      }
    `;
    return this.client.send<graphResetPasswordResponse>(query, {
      token,
      password,
    });
  }
}
