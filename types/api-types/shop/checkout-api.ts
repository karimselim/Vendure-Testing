export type checkoutOrderType = {
  id: string;
  code: string;
  state: string;
  active: boolean;
  totalQuantity: number;
  subTotalWithTax: number;
  shippingWithTax: number;
  totalWithTax: number;
  customer: { emailAddress: string; firstName: string; lastName: string } | null;
  shippingAddress: {
    fullName: string | null;
    streetLine1: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;
  shippingLines: { shippingMethod: { id: string; code: string } }[];
  payments: { state: string; method: string }[] | null;
  lines: { id: string; quantity: number }[];
};

export type checkoutErrorType = {
  errorCode: string;
  message: string;
};

export type checkoutResultType = (checkoutOrderType | checkoutErrorType) & {
  __typename: string;
};

export type addressInputType = {
  fullName: string;
  streetLine1: string;
  city: string;
  postalCode: string;
  countryCode: string;
  phoneNumber?: string;
  province?: string;
};

export type customerInputType = {
  emailAddress: string;
  firstName: string;
  lastName: string;
};

type gqlErrors = { message: string }[];

export type graphSetCustomerResponse = {
  data?: { setCustomerForOrder: checkoutResultType };
  errors?: gqlErrors;
};

export type graphSetShippingAddressResponse = {
  data?: { setOrderShippingAddress: checkoutResultType };
  errors?: gqlErrors;
};

export type graphSetShippingMethodResponse = {
  data?: { setOrderShippingMethod: checkoutResultType };
  errors?: gqlErrors;
};

export type graphTransitionResponse = {
  data?: { transitionOrderToState: checkoutResultType | null };
  errors?: gqlErrors;
};

export type graphAddPaymentResponse = {
  data?: { addPaymentToOrder: checkoutResultType };
  errors?: gqlErrors;
};

export type graphEligibleMethodsResponse = {
  data?: {
    eligibleShippingMethods: {
      id: string;
      code: string;
      name: string;
      priceWithTax: number;
    }[];
    eligiblePaymentMethods: {
      code: string;
      name: string;
      isEligible: boolean;
    }[];
  };
  errors?: gqlErrors;
};

export type graphOrderByCodeResponse = {
  data?: { orderByCode: checkoutOrderType | null };
  errors?: gqlErrors;
};
