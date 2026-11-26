import { APIRequestContext } from "@playwright/test";

export class ShopApiClient {
  // Vendure returns the session token in this header on the first request;
  // sending it back keeps the same session (and the same active order).
  private sessionToken?: string;

  constructor(
    private request: APIRequestContext,
    private baseUrl = "http://localhost:3000/shop-api",
  ) {}

  async send<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<{ status: number; body: T }> {
    const headers: Record<string, string> = {};
    if (this.sessionToken) {
      headers["vendure-auth-token"] = this.sessionToken;
    }
    const response = await this.request.post(this.baseUrl, {
      data: { query, variables },
      headers,
    });
    const newToken = response.headers()["vendure-auth-token"];
    if (newToken) {
      this.sessionToken = newToken;
    }
    const body = await response.json();
    return { status: response.status(), body };
  }
}
