import {
  graphActiveOrderResponse,
  graphAddToCartResponse,
  graphAdjustQuantityResponse,
  graphApplyCouponCodeResponse,
  graphProductVariantsResponse,
  graphRemoveCouponCodeResponse,
  graphRemoveItemResponse,
} from "../../types/api-types/shop/cart-api";
import { ShopApiClient } from "../shop-api-client";

const ORDER_FIELDS = `#graphql
  id
  code
  state
  totalQuantity
  subTotalWithTax
  shippingWithTax
  totalWithTax
  currencyCode
  couponCodes
  lines {
    id
    quantity
    unitPriceWithTax
    linePriceWithTax
    productVariant {
      id
      name
      sku
      product {
        name
        slug
      }
    }
  }
`;

export class CartApiClient {
  constructor(private client: ShopApiClient) {}

  async getActiveOrder() {
    const query = `#graphql
      query GetActiveOrder {
        activeOrder {
          ${ORDER_FIELDS}
        }
      }
    `;
    return this.client.send<graphActiveOrderResponse>(query);
  }

  async addToCart(productVariantId: string, quantity: number) {
    const query = `#graphql
      mutation AddToCart($productVariantId: ID!, $quantity: Int!) {
        addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
          __typename
          ... on Order {
            ${ORDER_FIELDS}
          }
          ... on ErrorResult {
            errorCode
            message
          }
        }
      }
    `;
    return this.client.send<graphAddToCartResponse>(query, {
      productVariantId,
      quantity,
    });
  }

  async adjustQuantity(orderLineId: string, quantity: number) {
    const query = `#graphql
      mutation AdjustQuantity($orderLineId: ID!, $quantity: Int!) {
        adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
          __typename
          ... on Order {
            ${ORDER_FIELDS}
          }
          ... on ErrorResult {
            errorCode
            message
          }
        }
      }
    `;
    return this.client.send<graphAdjustQuantityResponse>(query, {
      orderLineId,
      quantity,
    });
  }

  async removeItem(orderLineId: string) {
    const query = `#graphql
      mutation RemoveItem($orderLineId: ID!) {
        removeOrderLine(orderLineId: $orderLineId) {
          __typename
          ... on Order {
            ${ORDER_FIELDS}
          }
          ... on ErrorResult {
            errorCode
            message
          }
        }
      }
    `;
    return this.client.send<graphRemoveItemResponse>(query, { orderLineId });
  }

  async applyCouponCode(couponCode: string) {
    const query = `#graphql
      mutation ApplyCouponCode($couponCode: String!) {
        applyCouponCode(couponCode: $couponCode) {
          __typename
          ... on Order {
            ${ORDER_FIELDS}
          }
          ... on ErrorResult {
            errorCode
            message
          }
        }
      }
    `;
    return this.client.send<graphApplyCouponCodeResponse>(query, {
      couponCode,
    });
  }

  async removeCouponCode(couponCode: string) {
    const query = `#graphql
      mutation RemoveCouponCode($couponCode: String!) {
        removeCouponCode(couponCode: $couponCode) {
          __typename
          ... on Order {
            ${ORDER_FIELDS}
          }
          ... on ErrorResult {
            errorCode
            message
          }
        }
      }
    `;
    return this.client.send<graphRemoveCouponCodeResponse>(query, {
      couponCode,
    });
  }

  // Test setup helper: lists variants with their stock so tests can pick
  // in-stock ones to add to the cart.
  async getProductVariants() {
    const query = `#graphql
      query GetProductVariants {
        products(options: { take: 100 }) {
          items {
            id
            name
            slug
            variants {
              id
              name
              sku
              priceWithTax
              stockLevel
            }
          }
        }
      }
    `;
    return this.client.send<graphProductVariantsResponse>(query);
  }
}
