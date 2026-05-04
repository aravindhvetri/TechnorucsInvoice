import { toast } from "react-toastify";

/**
 * Validates the Quote Form data and item details.
 * @param quoteForm The form data object.
 * @param itemDetails The list of items in the table.
 * @returns boolean True if all validations pass, false otherwise.
 */
export const validateQuoteForm = (quoteForm: any, itemDetails: any[]): boolean => {
  let isValid = true;

  // 1. Validate Form Level Fields
  if (!quoteForm.CustomerDisplayName || quoteForm.CustomerDisplayName.trim() === "") {
    toast.error("Customer Name is required.");
    isValid = false;
  }

  if (!quoteForm.QuoteNumber || quoteForm.QuoteNumber.trim() === "") {
    toast.error("Quote # is required.");
    isValid = false;
  }

  if (!quoteForm.QuoteDate) {
    toast.error("Quote Date is required.");
    isValid = false;
  }

  // 2. Validate Item Table
  const activeItems = itemDetails.filter((item) => !item.isDelete);

  if (activeItems.length === 0) {
    toast.error("At least one item is required in the Item table.");
    isValid = false;
  } else {
    activeItems.forEach((item, index) => {
      const rowNum = index + 1;

      if (!item.Category || item.Category.trim() === "") {
        toast.error(`Category is required for item row ${rowNum}.`);
        isValid = false;
      }

      if (!item.ItemDetails || item.ItemDetails.trim() === "") {
        toast.error(`Item Details are required for item row ${rowNum}.`);
        isValid = false;
      }

      if (item.Quantity === undefined || item.Quantity === null || item.Quantity <= 0) {
        toast.error(`Quantity must be greater than 0 for item row ${rowNum}.`);
        isValid = false;
      }

      if (item.Rate === undefined || item.Rate === null || item.Rate < 0) {
        toast.error(`Rate is required for item row ${rowNum}.`);
        isValid = false;
      }
    });
  }

  return isValid;
};
