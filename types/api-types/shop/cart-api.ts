export type orderLineType = {
  id: string;
  quantity: number;
  unitPriceWithTax: number;
  linePriceWithTax: number;
  productVariant: {
    id: string;
    name: string;
    sku: string;
    product: {
      name: string;
      slug: string;
    };
  };
};

export type activeOrderType = {
  id: string;
  code: string;
  state: string;
  totalQuantity: number;
  subTotalWithTax: number;
  shippingWithTax: number;
  totalWithTax: number;
  currencyCode: string;
  couponCodes: string[];
  lines: orderLineType[];
};

export type orderErrorType = {
  errorCode: string;
  message: string;
};

// Mutations return the order on success or an ErrorResult on failure.
export type orderResultType = (activeOrderType | orderErrorType) & {
  __typename: string;
};

export type graphActiveOrderResponse = {
  data?: {
    activeOrder: activeOrderType | null;
  };
  errors?: {
    message: string;
  }[];
};

export type graphAddToCartResponse = {
  data?: {
    addItemToOrder: orderResultType;
  };
  errors?: {
    message: string;
  }[];
};

export type graphAdjustQuantityResponse = {
  data?: {
    adjustOrderLine: orderResultType;
  };
  errors?: {
    message: string;
  }[];
};

export type graphRemoveItemResponse = {
  data?: {
    removeOrderLine: orderResultType;
  };
  errors?: {
    message: string;
  }[];
};

export type graphApplyCouponCodeResponse = {
  data?: {
    applyCouponCode: orderResultType;
  };
  errors?: {
    message: string;
  }[];
};

export type graphRemoveCouponCodeResponse = {
  data?: {
    removeCouponCode: orderResultType;
  };
  errors?: {
    message: string;
  }[];
};

export type productVariantType = {
  id: string;
  name: string;
  sku: string;
  priceWithTax: number;
  stockLevel: string;
};

export type graphProductVariantsResponse = {
  data?: {
    products: {
      items: {
        id: string;
        name: string;
        slug: string;
        variants: productVariantType[];
      }[];
    };
  };
  errors?: {
    message: string;
  }[];
};
