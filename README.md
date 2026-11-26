# Vendure-Testing

[![Playwright Tests](https://github.com/karimselim/Vendure-Testing/actions/workflows/playwright.yml/badge.svg)](https://github.com/karimselim/Vendure-Testing/actions/workflows/playwright.yml)

Playwright + TypeScript test suite for a Vendure shop: UI tests against the Next.js storefront and API tests against the Shop GraphQL API.

## Structure

- `pages/` page objects, one class per page (`CartPage`, `CheckoutPage`, `ProductsPage`, ...). Locators are private, tests call methods.
- `api-clients/` one class per GraphQL area (`CartApiClient`, `CheckoutApiClient`, `ShopApiClient`, ...). The session token comes from the `vendure-auth-token` response header.
- `types/` types for page data and GraphQL responses.
- `fixtures/` Playwright fixtures that create the page objects and API clients.
- `tests/ui/` browser tests. `tests/api/` GraphQL tests.
- `storefront/` storefront files overlaid on the Vendure shop in CI (holds the `data-testid` attributes the tests use).

## Coverage

- Cart UI: add, quantity, remove, totals, promotion code, empty cart.
- Cart API: add, adjust, remove, totals, invalid input.
- Checkout API: shipping and payment methods, address, order transitions, payment errors.
- Checkout UI: field validation, empty cart redirect, guest order and logged in order to the confirmation page. The storefront always sends a successful payment, so declined and failed payments are covered in the API tests only.
- Auth API: wrong password, unknown user, empty password, weak password, no email leak on signup and forgot password, invalid reset token.
- Auth UI, products, product details and sorting.

## Known bugs the tests document

- `registerCustomerAccount` accepts an email with no `@` and returns success. The test for it is marked `test.fail`, so it passes while the bug exists and turns red when the bug is fixed.

## Run locally

1. Start a Vendure server (port 3000) and the storefront (port 3001).
2. `npm ci && npx playwright install chromium`
3. Create `.env` with `SIGNUP_PASSWORD=<password>` (and `BASE_URL` if the storefront is not at `http://localhost:3001/en`).
4. `npx playwright test` (all), `npx playwright test tests/api` (API only), `npx playwright test tests/ui` (UI only).

## CI

Every run uploads the Playwright HTML report as the `playwright-report` artifact (kept 30 days). Open any run on the [Actions page](https://github.com/karimselim/Vendure-Testing/actions/workflows/playwright.yml), scroll to "Artifacts", download it and open `index.html`. Failed tests also keep a screenshot, video and trace.

`.github/workflows/playwright.yml` runs on pushes to `main`, `master` and `ci/**`. It starts Vendure and the storefront, then runs the suite.
