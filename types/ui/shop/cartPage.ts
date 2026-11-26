import { Locator } from "@playwright/test";

export type cartItemType = {
  name: Locator;
  sku: Locator;
  quantity: Locator;
  linePrice: Locator;
  unitPrice: Locator;
  increaseButton: Locator;
  decreaseButton: Locator;
  removeButton: Locator;
};
