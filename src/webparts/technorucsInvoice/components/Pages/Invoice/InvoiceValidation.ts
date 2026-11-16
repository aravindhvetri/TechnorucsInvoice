import { toast } from "react-toastify";

/**
 * Validates the Status Update popup in the Invoice module.
 * @param exchangeRate The value of the exchange rate input.
 * @param status The selected status from the dropdown.
 * @param currency The currency string (e.g., "USD - US Dollar").
 * @returns {boolean} True if valid, False otherwise.
 */
export const validateStatusUpdate = (
  exchangeRate: number,
  status: string,
  currency: string | undefined,
): boolean => {
  // 1. If currency is NOT INR, Exchange Rate is visible and required
  if (currency && !currency.includes("INR")) {
    if (exchangeRate === 0) {
      toast.error("Please fill the exchange rate.");
      return false;
    }
  }

  // 2. Status check
  if (!status || status.trim() === "") {
    toast.error("Please select a status.");
    return false;
  }

  return true;
};

export const validateInvoice = (
  invoiceForm: any,
  itemDetails: any[],
): boolean => {
  if (
    !invoiceForm.CustomerDisplayName ||
    invoiceForm.CustomerDisplayName.trim() === ""
  ) {
    toast.error("Please select a Customer.");
    return false;
  }
  if (!invoiceForm.Invoice || String(invoiceForm.Invoice).trim() === "") {
    toast.error("Invoice # is required.");
    return false;
  }
  if (!invoiceForm.InvoiceDate) {
    toast.error("Invoice Date is required.");
    return false;
  }
  if (!invoiceForm.Department || String(invoiceForm.Department).trim() === "") {
    toast.error("Department is required.");
    return false;
  }
  if (!invoiceForm.Terms || String(invoiceForm.Terms).trim() === "") {
    toast.error("Terms is required.");
    return false;
  }
  if (!invoiceForm.DueDate) {
    toast.error("Due Date is required.");
    return false;
  }

  const activeItems = itemDetails.filter((item: any) => !item.isDelete);
  if (activeItems.length === 0) {
    toast.error("At least one Item Details line is required.");
    return false;
  }

  const hasValidItem = activeItems.some(
    (item: any) => item.ItemDeatils && String(item.ItemDeatils).trim() !== "",
  );
  if (!hasValidItem) {
    toast.error("Please fill in the Item Details for at least one line item.");
    return false;
  }

  return true;
};
