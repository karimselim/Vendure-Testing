import {
  addressInputType,
  customerInputType,
  graphAddPaymentResponse,
  graphEligibleMethodsResponse,
  graphOrderByCodeResponse,
  graphSetCustomerResponse,
  graphSetShippingAddressResponse,
  graphSetShippingMethodResponse,
  graphTransitionResponse,
} from "../../types/api-types/shop/checkout-api";
import { ShopApiClient } from "../shop-api-client";

const ORDER_FIELDS = `#graphql
  id
  code
  state
  active
  totalQuantity
  subTotalWithTax
  shippingWithTax
  totalWithTax
  customer {
    emailAddress
    firstName
    lastName
  }
  shippingAddress {
    fullName
    streetLine1
    city
    postalCode
    country
  }
  shippingLines {
    shippingMethod {
      id
      code
    }
  }
  payments {
    state
    method
  }
  lines {
    id
    quantity
  }
`;

const RESULT = `#graphql
  __typename
  ... on Order {
    ${ORDER_FIELDS}
  }
  ... on ErrorResult {
    errorCode
    message
  }
`;

export class CheckoutApiClient {
  constructor(private client: ShopApiClient) {}

  async setCustomerForOrder(input: customerInputType) {
    const query = `#graphql
      mutation SetCustomer($input: CreateCustomerInput!) {
        setCustomerForOrder(input: $input) {
          ${RESULT}
        }
      }
    `;
    return this.client.send<graphSetCustomerResponse>(query, { input });
  }

  async setShippingAddress(input: addressInputType) {
    const query = `#graphql
      mutation SetShippingAddress($input: CreateAddressInput!) {
        setOrderShippingAddress(input: $input) {
          ${RESULT}
        }
      }
    `;
    return this.client.send<graphSetShippingAddressResponse>(query, { input });
  }

  async getEligibleMethods() {
    const query = `#graphql
      query EligibleMethods {
        eligibleShippingMethods {
          id
          code
          name
          priceWithTax
        }
        eligiblePaymentMethods {
          code
          name
          isEligible
        }
      }
    `;
    return this.client.send<graphEligibleMethodsResponse>(query);
  }

  async setShippingMethod(shippingMethodId: string) {
    const query = `#graphql
      mutation SetShippingMethod($shippingMethodId: [ID!]!) {
        setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
          ${RESULT}
        }
      }
    `;
    return this.client.send<graphSetShippingMethodResponse>(query, {
      shippingMethodId: [shippingMethodId],
    });
  }

  async transitionToState(state: string) {
    const query = `#graphql
      mutation Transition($state: String!) {
        transitionOrderToState(state: $state) {
          ${RESULT}
        }
      }
    `;
    return this.client.send<graphTransitionResponse>(query, { state });
  }

  async addPayment(method: string, metadata: Record<string, unknown> = {}) {
    const query = `#graphql
      mutation AddPayment($input: PaymentInput!) {
        addPaymentToOrder(input: $input) {
          ${RESULT}
        }
      }
    `;
    return this.client.send<graphAddPaymentResponse>(query, {
      input: { method, metadata },
    });
  }

  async getOrderByCode(code: string) {
    const query = `#graphql
      query OrderByCode($code: String!) {
        orderByCode(code: $code) {
          ${ORDER_FIELDS}
        }
      }
    `;
    return this.client.send<graphOrderByCodeResponse>(query, { code });
  }
}
