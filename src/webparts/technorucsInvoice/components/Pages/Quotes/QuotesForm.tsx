import React, { useEffect, useState } from "react";
// Using InvoiceForm.module.scss to ensure 100% theme & layout consistency
import stylesUntyped from "./QuotesForm.module.scss";
const styles: any = stylesUntyped;
import { NormalPeoplePicker } from "@fluentui/react";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";

import CustomInputBox from "../../Common/DataTable/InputBox/CustomInputBox";
import CustomDropdown from "../../Common/DataTable/Dropdown/CustomDropdown";
import CustomButton from "../../Common/DataTable/Button/CustomButton";
import CustomDatePicker from "../../Common/DataTable/DatePicker/CustomDatePicker";
import CustomDialog from "../../Common/CustomDialog/CustomDialog";
import { LISTNAMES } from "../../../Config/Config";
import {
  SPReadItems,
  SPCreateItem,
  SPUpdateItem,
  SPGetItemsFilter,
  SPDeleteItem,
} from "../../CommonServices/SpService";
import { LayoutPanelLeft } from "lucide-react";
import { log, sp } from "@pnp/pnpjs";
import { toast } from "react-toastify";
import { validateQuoteForm } from "./QuoteValidation";

interface QuotesFormProps {
  onCancel?: () => void;
  onSave?: (data: any) => void;
  initialData?: any;
  mode?: "view" | "edit" | "create";
  context?: any;
}

interface ItemDetails {
  QuotesId: number;
  isNew: boolean;
  SNo: number;
  isDelete: boolean;
  TempID: number;
  id: number;
  Category: string;
  ItemDetails: string;
  Quantity: number;
  Rate: number;
  Discount: number;
  DiscountType: "%" | "₹";
  Amount: number;
}

interface IQuoteData {
  CustomerDisplayName: string;
  QuoteNumber: string;
  QuoteDate: Date | string;
  ExpiryDate: Date | string | null;
  // Salesperson: [];
  Subject: string;
  CustomerNotes: string;
  Terms_x0026_Conditions: string;
  Subtotal: string;
  Adjustment: string;
  Total: string;
  Status: string;
  Tax: string;
}

interface IAttachment {
  FileName: string;
  ServerRelativeUrl: string;
  FileContent: Blob;
  isNew: boolean;
  isDelete: boolean;
}

interface IUser {
  id: string;
  spID: number | null;
  email: string;
  displayName: string;
}
const QuotesForm: React.FC<QuotesFormProps> = ({
  context,
  onCancel,
  onSave,
  initialData,
  mode,
}) => {
  const [AzureMembers, setAzureMembers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  //   const [salespersons, setSalespersons] = useState<any[]>([]);
  console.log(initialData?.Customer);
  debugger;
  const [quoteForm, setQuoteForm] = useState<IQuoteData>({
    CustomerDisplayName: initialData?.Customer?.Customerdisplayname || "",
    QuoteNumber: initialData?.QuoteNo || "QT/25-26/001",
    QuoteDate: initialData?.Created || new Date().toISOString().split("T")[0],
    ExpiryDate: initialData?.ExpiryDate || "",
    // Salesperson: initialData?.Salesperson || "",
    Subject: initialData?.Subject || "",
    CustomerNotes: initialData?.CustomerNotes || "",
    Terms_x0026_Conditions: initialData?.Terms_x0026_Conditions || "",
    Subtotal: initialData?.Subtotal || "0.00",
    Adjustment: initialData?.Adjustment || "0.00",
    Total: initialData?.Total || "0.00",
    Status: initialData?.Status || "Draft",
    Tax: initialData?.Tax || "",
  });
  debugger;
  console.log("quoteForm", quoteForm);

  const [categories, setCategories] = useState<
    { label: string; value: string }[]
  >([]);
  const [isCategoryDialogVisible, setIsCategoryDialogVisible] = useState(false);
  const [SelectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [pendingCategoryRowId, setPendingCategoryRowId] = useState<
    number | null
  >(null);

  const [itemDetails, setItemDetails] = useState<ItemDetails[]>([]);
  // const [attachments, setAttachments] = useState<
  //   { FileName: string; Content: any; isDelete: boolean; id?: number }[]
  // >([]);
  const [attachments, setAttachments] = useState<IAttachment[]>([]);

  // Calculate Subtotal and Total
  const calculateTotals = () => {
    let subtotal = 0;
    itemDetails.forEach((item) => {
      if (!item.isDelete) {
        subtotal += item.Amount || 0;
      }
    });

    const taxRate = parseFloat(quoteForm.Tax) || 0;
    const taxAmt = (subtotal * taxRate) / 100;
    const subtotalWithTax = subtotal + taxAmt;

    let roundedTotal = subtotalWithTax;
    let decimalPart = Number(
      (subtotalWithTax - Math.floor(subtotalWithTax)).toFixed(2),
    );

    if (decimalPart > 0) {
      if (decimalPart <= 0.5) {
        roundedTotal = Math.floor(subtotalWithTax);
      } else {
        roundedTotal = Math.ceil(subtotalWithTax);
      }
    }

    const autoAdjustment = roundedTotal - subtotalWithTax;
    const total = roundedTotal;

    return { subtotal, total, autoAdjustment, taxAmt };
  };

  const totals = calculateTotals();

  const addNewItem = () => {
    setItemDetails((prev) => [
      ...prev,
      {
        QuotesId: 0,
        isNew: true,
        SNo: itemDetails.filter((item) => !item.isDelete).length + 1,
        isDelete: false,
        TempID: Date.now(),
        id: 0,
        Category: "",
        ItemDetails: "",
        Quantity: 1,
        Rate: 0,
        Discount: 0,
        DiscountType: "%",
        Amount: 0,
      },
    ]);
  };

  // const updateItem = (TempID: number, field: keyof ItemDetails, value: any) => {
  //   setItemDetails((prev) =>
  //     prev.map((item) => {
  //       if (item.TempID === TempID) {
  //         const updated = { ...item, [field]: value };
  //         if (
  //           field === "Quantity" ||
  //           field === "Rate" ||
  //           field === "Discount" ||
  //           field === "DiscountType"
  //         ) {
  //           const baseAmount = (updated.Quantity || 0) * (updated.Rate || 0);
  //           let discountAmt = 0;
  //           if (updated.DiscountType === "%") {
  //             discountAmt = (baseAmount * (updated.Discount || 0)) / 100;
  //           } else {
  //             discountAmt = updated.Discount || 0;
  //           }
  //           updated.Amount = baseAmount - discountAmt;
  //         }
  //         return updated;
  //       }
  //       return item;
  //     }),
  //   );
  // };

  const updateItem = (TempID: number, field: keyof ItemDetails, value: any) => {
    setItemDetails((prev) =>
      prev.map((item) => {
        if (item.TempID === TempID) {
          const updated = { ...item, [field]: value };

          if (
            field === "Quantity" ||
            field === "Rate" ||
            field === "Discount" ||
            field === "DiscountType"
          ) {
            const baseRate = updated.Rate || 0;
            const quantity = updated.Quantity || 0;

            let finalRate = baseRate;

            if (updated.DiscountType === "%") {
              finalRate = baseRate - (baseRate * (updated.Discount || 0)) / 100;
            } else {
              finalRate = baseRate - (updated.Discount || 0);
            }

            // Prevent negative rate
            if (finalRate < 0) finalRate = 0;

            updated.Amount = parseFloat((finalRate * quantity).toFixed(2));
          }

          return updated;
        }

        return item;
      }),
    );
  };

  const removeItem = (TempID: number) => {
    setItemDetails((prev) =>
      prev.map((item) =>
        item.TempID === TempID ? { ...item, isDelete: true } : item,
      ),
    );
  };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files) {
  //       const selectedFiles = Array.from(e.target.files);
  //             let _attachments = [...attachments];
  //     // const files = Array.from(e.target.files);
  //     const newAttachments = files.map((file) => ({
  //       FileName: file.name,

  //       Content: file,
  //       isDelete: false,
  //     }));
  //     setAttachments((prev) => [...prev, ...newAttachments]);
  //   }
  // };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      let _attachments = [...attachments];

      selectedFiles.forEach((file) => {
        _attachments.push({
          isDelete: false,
          isNew: true,
          FileName: file.name,
          ServerRelativeUrl: "",
          FileContent: file,
        });
      });

      setAttachments(_attachments);
    }

    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    let _attachments: IAttachment[] = [...attachments];

    if (_attachments[index].isNew) {
      _attachments = _attachments.filter((_, i) => i !== index);
    } else {
      _attachments[index].isDelete = true;
    }
    setAttachments(_attachments);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);

      let _attachments = [...attachments];

      droppedFiles.forEach((file) => {
        _attachments.push({
          isDelete: false,
          isNew: true,
          FileName: file.name,
          ServerRelativeUrl: "",
          FileContent: file,
        });
      });

      setAttachments(_attachments);
    }
  };

  const generateQuoteJson = (quoteDetails: any) => {
    return {
      CustomerId: SelectedCustomer?.Id,
      QuoteNo: quoteDetails.QuoteNumber,
      QuoteDate: quoteDetails.QuoteDate,
      ExpiryDate: quoteDetails.ExpiryDate,
      // Salesperson: quoteDetails.Salesperson ?? "",
      Subject: quoteDetails.Subject ?? "",
      CustomerNotes: quoteDetails.CustomerNotes ?? "",
      Terms_x0026_Conditions: quoteDetails.Terms_x0026_Conditions ?? "",
      Subtotal: totals.subtotal ?? 0,
      Total: totals.total ?? 0,
      Tax: quoteDetails.Tax ?? "",
      // TotalTax: quoteDetails.TotalTax ?? 0,
      // Total: quoteDetails.Total ?? 0,
      // Status: quoteDetails.Status ?? "",
      // TaxOption: quoteDetails.TaxOption ?? "",
      // TaxType: quoteDetails.TaxType ?? "",
    };
  };
  const generateItemDetailsjson = (itemDetails: any, quoteID: number) => {
    return itemDetails.map((item: any) => ({
      QuotesId: quoteID,
      Category: item.Category,
      ItemDetails: item.ItemDetails,
      Quantity: item.Quantity,
      Rate: item.Rate,
      Discount: item.Discount,
      DiscountType: item.DiscountType,
      HSN: "234568",
      Amount: item.Amount,
    }));
  };

  const SaveToSP = async (quoteForm: any) => {
    if (mode === "create") {
      const json = await generateQuoteJson(quoteForm);
      const activeItems = itemDetails.filter((item) => !item.isDelete);
      debugger;
      // const ItemDetailsJson = await generateItemDetailsJson(quoteForm);
      console.log("json", json);
      debugger;
      const result = await SPCreateItem(LISTNAMES.Quote, json);
      const LastID = result?.data?.Id;
      const UpdateQuoteNo = await SPReadItems(LISTNAMES.QuoteNo, [], []);

      const LastInvoieNoID = UpdateQuoteNo?.[0].ID;
      debugger;
      const UpdateInvoiceNO = await SPUpdateItem(
        LISTNAMES.QuoteNo,
        LastInvoieNoID,
        { Title: quoteForm?.QuoteNumber },
      );

      // Upload Attachments
      if (attachments && attachments.length > 0) {
        const newAttachments = attachments.filter(
          (file) => !file.isDelete && file.isNew,
        );

        debugger;
        for (const file of newAttachments) {
          try {
            await sp.web.lists
              .getByTitle(LISTNAMES.Quote)
              .items.getById(LastID)
              .attachmentFiles.add(file.FileName, file.FileContent);
          } catch (err) {
            console.error("Error uploading attachment:", file.FileName, err);
          }
        }
      }

      debugger;
      const itemDetailsJson = generateItemDetailsjson(activeItems, LastID);
      for (const item of itemDetailsJson) {
        try {
          await SPCreateItem(LISTNAMES.QuoteItemDetails, item);
        } catch (err) {
          console.error("Error creating item detail:", err);
        }
      }
      console.log("result", result);
    } else {
      const json = await generateQuoteJson(quoteForm);
      const ActiveItems = itemDetails.filter(
        (item) => !item.isDelete && item.isNew,
      );
      debugger;
      const updateToSP = await SPUpdateItem(
        LISTNAMES.Quote,
        quoteForm.Id,
        json,
      );
      debugger;

      for (const item of ActiveItems) {
        try {
          const itemDetailsJson = generateItemDetailsjson(item, quoteForm.Id);
          if (item.isDelete) {
            await SPDeleteItem(LISTNAMES.QuoteItemDetails, item.id);
          } else if (item.isNew) {
            await SPCreateItem(LISTNAMES.QuoteItemDetails, itemDetailsJson);
          } else {
            await SPUpdateItem(
              LISTNAMES.QuoteItemDetails,
              item.id,
              itemDetailsJson,
            );
          }
        } catch (err) {
          console.error("Error creating item detail:", err);
        }
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      if (mode === "create") {
        // Set invoice no
        debugger;
        const LastQuoteNumber = await SPReadItems(LISTNAMES.QuoteNo, ["*"], []);

        const currentQuotesNO = LastQuoteNumber[0].Title;
        // Example: QT/25-26/003

        const parts = currentQuotesNO.split("/");

        // Get last number part
        const lastNumber = parts[2];

        // Increment number
        const nextNumber = (parseInt(lastNumber, 10) + 1)
          .toString()
          .padStart(3, "0");

        // Create new quote number
        const newQuoteNumber = `${parts[0]}/${parts[1]}/${nextNumber}`;

        setQuoteForm((prev) => ({
          ...prev,
          QuoteNumber: newQuoteNumber,
        }));
      }

      await Promise.all([
        // azureMembers(),
        SPReadItems(LISTNAMES.Customer, ["*"], []),
      ]);
      setLoading(true);
      try {
        debugger;
        const custData = await SPReadItems(LISTNAMES.Customer, ["*"], []);
        setCustomers(custData);

        // if (mode === "create") {
        let _tempCategories: any[] = [];
        const getcategries = await SPReadItems(
          LISTNAMES.QuoteItemDetails,
          ["*"],
          [],
        );
        console.log("categries", getcategries);
        const categories = getcategries
          .filter((item: any) => item.Category)
          .map((item: any) => item.Category)
          .filter(
            (cat: any, index: number, arr: any[]) => arr.indexOf(cat) === index,
          )
          .map((cat: any) => {
            _tempCategories.push({ label: cat, value: cat });
          });
        _tempCategories.push({
          label: " Add Category",
          value: "ADD_NEW_CATEGORY",
        });
        setCategories(_tempCategories);

        let _attachments: IAttachment[] = await sp.web.lists
          .getByTitle(LISTNAMES.Quote)
          .items.getById(initialData.Id)
          .attachmentFiles.get();

        const list = sp.web.lists.getByTitle(LISTNAMES.Quote);
        const item = list.items.getById(initialData.Id);

        _attachments = await Promise.all(
          _attachments.map(async ({ FileName, ServerRelativeUrl }: any) => {
            const blob = await item.attachmentFiles
              .getByName(FileName)
              .getBlob();

            return {
              FileName,
              ServerRelativeUrl,
              FileContent: blob,
              isDelete: false,
              isNew: false,
            };
          }),
        );
        debugger;
        setAttachments(_attachments);

        if (mode === "edit" || mode === "view") {
          const ItemsDetailsbyID: any[] = [];
          const getQuoteItemDetails = await SPGetItemsFilter(
            LISTNAMES.QuoteItemDetails,
            ["*"],
            [],
            `QuotesId eq ${initialData?.Id}`,
          );
          getQuoteItemDetails.forEach((item: any) => {
            ItemsDetailsbyID.push({
              QuotesId: item.QuotesId,
              isNew: false,
              SNo: ItemsDetailsbyID.length + 1,
              isDelete: false,
              TempID: ItemsDetailsbyID.length + 1,
              id: item.id,
              Category: item.Category,
              ItemDetails: item.ItemDetails,
              Quantity: item.Quantity,
              Rate: item.Rate,
              Discount: item.Discount,
              DiscountType: item.DiscountType,
              Amount: item.Amount,
            });
          });

          setItemDetails(ItemsDetailsbyID);
        } else {
          addNewItem();
        }
      } catch (err) {
        console.error("Init Error", err);
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [initialData, mode]);

  if (loading) return <div className={styles.page}>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>
          {mode === "create"
            ? "New Quote"
            : mode === "edit"
              ? "Edit Quote"
              : "View Quote"}
        </h2>
        <div className={styles.headerActions}>
          <CustomButton label="Cancel" variant="secondary" onClick={onCancel} />
        </div>
      </div>

      {/* Top Form Info */}
      <div className={styles.formCard}>
        <div className={styles.infoGrid}>
          <div className={styles.infoLeft}>
            {/* 1. Customer Name */}
            <div className={styles.rowFull}>
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  Customer Name <span className={styles.required}>*</span>
                </div>
                <div className={styles.rowControl}>
                  <CustomDropdown
                    options={customers.map((c) => ({
                      label: c.Customerdisplayname,
                      value: c.Customerdisplayname,
                    }))}
                    value={quoteForm.CustomerDisplayName}
                    onChange={(val: any) => {
                      setQuoteForm((prev) => ({
                        ...prev,
                        CustomerDisplayName: val as string,
                      }));

                      const selectedCustomer = customers.find(
                        (c) => c.Customerdisplayname === val,
                      );

                      setSelectedCustomer(selectedCustomer || null);
                    }}
                    placeholder="Select or add a customer"
                    disabled={mode === "view"}
                    filter={true}
                  />
                </div>
              </div>
            </div>

            {/* 2. Currency Display */}
            {quoteForm.CustomerDisplayName && (
              <div className={styles.rowFull}>
                <div className={styles.fieldGroup}>
                  <div className={styles.fieldLabel}>Currency</div>
                  <div className={styles.currencyValueText}>
                    {customers.find(
                      (c) =>
                        c.Customerdisplayname === quoteForm.CustomerDisplayName,
                    )?.Currency || "N/A"}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Quote# */}
            <div className={styles.rowFull}>
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  Quote# <span className={styles.required}>*</span>
                </div>
                <div className={styles.rowControl}>
                  <CustomInputBox
                    value={quoteForm.QuoteNumber}
                    disabled={true}
                    onChange={() => {}}
                  />
                </div>
              </div>
            </div>

            {/* 4. Dates (Side-by-side on Desktop) */}
            <div className={styles.DaterowThree}>
              <div className={styles.datesRow}>
                <div className={styles.fieldGroup}>
                  <div className={styles.fieldLabel}>
                    Quote Date <span className={styles.required}>*</span>
                  </div>
                  <CustomDatePicker
                    value={
                      quoteForm.QuoteDate ? new Date(quoteForm.QuoteDate) : null
                    }
                    onChange={(val: any) =>
                      setQuoteForm((prev) => ({
                        ...prev,
                        QuoteDate: val ? val.toISOString() : "",
                      }))
                    }
                    disabled={mode === "view"}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.fieldLabel}>Expiry Date</div>
                  <CustomDatePicker
                    value={
                      quoteForm.ExpiryDate
                        ? new Date(quoteForm.ExpiryDate)
                        : null
                    }
                    onChange={(val: any) =>
                      setQuoteForm((prev) => ({
                        ...prev,
                        ExpiryDate: val ? val.toISOString() : "",
                      }))
                    }
                    disabled={mode === "view"}
                  />
                </div>
              </div>
            </div>

            <hr style={{ borderTop: "1px solid #f1f5f9", margin: "16px 0" }} />

            {/* 5. Subject */}
            <div className={styles.rowFull}>
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>Subject</div>
                <div className={styles.rowControl}>
                  <CustomInputBox
                    value={quoteForm.Subject}
                    onChange={(val) =>
                      setQuoteForm((prev) => ({
                        ...prev,
                        Subject: val as string,
                      }))
                    }
                    placeholder="Let your customer know what this Quote is for"
                    disabled={mode === "view"}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Item Table Grid */}
      <div className={styles.formCard}>
        <div className={styles.lineItemsContainer}>
          <h3 className={styles.lineItemsTitle}>Item Details</h3>
          <div className={styles.lineItemsGrid}>
            <div className={`${styles.gridHeader} ${styles.quotesGrid}`}>
              <div className={styles.headerCell}>S.NO</div>
              <div className={styles.headerCell}>CATEGORY</div>
              <div className={styles.headerCell}>ITEM DETAILS</div>
              <div className={styles.headerCell}>UNIT PRICE</div>
              <div className={styles.headerCell}>QTY</div>

              <div className={styles.headerCell}>DISCOUNT</div>
              <div className={styles.headerCell}>AMOUNT</div>
              <div className={styles.headerCell}></div>
            </div>

            {itemDetails
              .filter((i) => !i.isDelete)
              .map((item, idx) => (
                <div
                  key={item.TempID}
                  className={`${styles.gridRow} ${styles.quotesGrid} `}
                >
                  {/* Mobile Row Header */}
                  <div className={styles.mobileRowHeader}>
                    <div className={styles.itemCounter}>
                      <div className={styles.counterPill}>{idx + 1}</div>
                      <span>Quote Item</span>
                    </div>
                    <button
                      className={styles.deleteBtnModern}
                      onClick={() => removeItem(item.TempID)}
                      title="Delete Item"
                      disabled={mode === "view"}
                    >
                      <i className="pi pi-trash" />
                    </button>
                  </div>

                  {/* 1. S.NO (Desktop Only) */}
                  <div className={`${styles.rowCell} ${styles.desktopOnly}`}>
                    {idx + 1}
                  </div>

                  {/* 2. CATEGORY */}
                  <div className={styles.rowCell}>
                    <label className={styles.mobileCellLabel}>CATEGORY</label>
                    <CustomDropdown
                      value={item.Category || ""}
                      onChange={(val: any) => {
                        if (val === "ADD_NEW_CATEGORY") {
                          setPendingCategoryRowId(item.TempID);
                          setNewCategoryName("");
                          setIsCategoryDialogVisible(true);
                        } else {
                          updateItem(item.TempID, "Category", val);
                        }
                      }}
                      options={categories}
                      placeholder="Select..."
                      disabled={mode === "view"}
                      itemTemplate={(option: any) => {
                        if (option.value === "ADD_NEW_CATEGORY") {
                          return (
                            <div
                              style={{
                                color: "#0f763c",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <i
                                className="pi pi-plus-circle"
                                style={{ fontSize: "1rem" }}
                              />
                              <span>{option.label}</span>
                            </div>
                          );
                        }
                        return <span>{option.label}</span>;
                      }}
                    />
                  </div>

                  {/* 3. ITEM DETAILS */}
                  <div className={styles.rowCell}>
                    <label className={styles.mobileCellLabel}>
                      ITEM DETAILS
                    </label>
                    <CustomInputBox
                      value={item.ItemDetails}
                      onChange={(val: any) =>
                        updateItem(item.TempID, "ItemDetails", val)
                      }
                      placeholder="Enter details"
                      disabled={mode === "view"}
                    />
                  </div>

                  {/* Mobile Flex Row: QTY & RATE */}
                  <div className={styles.mobileFlexRow}>
                    <div
                      className={`${styles.rowCell} ${styles.mobileFlexItem}`}
                    >
                      <label className={styles.mobileCellLabel}>RATE</label>
                      <CustomInputBox
                        type="number"
                        value={item.Rate.toString()}
                        onChange={(val: any) =>
                          updateItem(item.TempID, "Rate", Number(val))
                        }
                        disabled={mode === "view"}
                      />
                    </div>

                    <div
                      className={`${styles.rowCell} ${styles.mobileFlexItem}`}
                    >
                      <label className={styles.mobileCellLabel}>QTY</label>
                      <CustomInputBox
                        type="number"
                        value={item.Quantity.toString()}
                        onChange={(val: any) =>
                          updateItem(item.TempID, "Quantity", Number(val))
                        }
                        disabled={mode === "view"}
                      />
                    </div>
                  </div>

                  {/* 4. DISCOUNT */}
                  <div className={styles.rowCell}>
                    <label className={styles.mobileCellLabel}>DISCOUNT</label>
                    <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                      <div style={{ flex: 1 }}>
                        <CustomInputBox
                          type="number"
                          value={item.Discount.toString()}
                          onChange={(val: any) =>
                            updateItem(item.TempID, "Discount", Number(val))
                          }
                          disabled={mode === "view"}
                        />
                      </div>
                      <div style={{ width: "70px" }}>
                        <CustomDropdown
                          options={[
                            { label: "%", value: "%" },
                            { label: "₹", value: "₹" },
                          ]}
                          value={item.DiscountType}
                          onChange={(val: any) =>
                            updateItem(item.TempID, "DiscountType", val)
                          }
                          disabled={mode === "view"}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mobile Divider */}
                  <div className={styles.mobileDivider} />

                  {/* 5. AMOUNT */}
                  <div className={styles.rowCell}>
                    <label className={styles.mobileCellLabel}>AMOUNT</label>
                    <div className={styles.amountPill}>
                      {(item.Amount || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>

                  {/* Desktop Delete Button */}
                  <button
                    className={`${styles.deleteBtnModern} ${styles.desktopOnly}`}
                    onClick={() => removeItem(item.TempID)}
                    title="Delete Item"
                  >
                    <i className="pi pi-trash" />
                  </button>
                </div>
              ))}
          </div>

          {mode !== "view" && (
            <button className={styles.addMoreBtn} onClick={addNewItem}>
              <i className="pi pi-plus-circle" /> Add New Row
            </button>
          )}
        </div>
      </div>

      {/* Footer Summary Card */}
      <div className={styles.formCard} style={{ margin: "24px 0" }}>
        <div
          style={{
            padding: "24px",
            display: "flex",
            gap: "60px",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {/* Left Side: Customer Notes */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <div
              style={{
                marginBottom: "10px",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              Customer Notes
            </div>
            <textarea
              className={styles.notesTextarea}
              value={quoteForm.CustomerNotes}
              onChange={(e) =>
                setQuoteForm((prev) => ({
                  ...prev,
                  CustomerNotes: e.target.value,
                }))
              }
              placeholder="Looking forward for your business."
              disabled={mode === "view"}
              style={{ minHeight: "120px" }}
            />
          </div>

          {/* Right Side: Totals Summary Container */}
          <div className={styles.summaryBox}>
            {/* 1. Sub Total Row */}
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Sub Total</span>
              <span className={styles.summaryValue}>
                ₹
                {totals.subtotal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Tax Selection Row */}
            <div className={styles.taxRowContainer}>
              <div className={styles.summaryActionCell}>
                <div className={styles.taxPillLabel}>Tax</div>
                <div style={{ width: "130px" }}>
                  <CustomDropdown
                    options={[
                      { label: "No Tax", value: "0" },
                      { label: "1% Tax", value: "1" },
                      { label: "2% Tax", value: "2" },
                      { label: "5% Tax", value: "5" },
                      { label: "10% Tax", value: "10" },
                      { label: "18% Tax", value: "18" },
                    ]}
                    placeholder="Select Tax"
                    value={quoteForm.Tax}
                    onChange={(val: any) =>
                      setQuoteForm((p) => ({ ...p, Tax: val }))
                    }
                    disabled={mode === "view"}
                  />
                </div>
              </div>

              <span className={styles.taxValueAmount}>
                + ₹
                {totals.taxAmt.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Auto Adjustment Row */}
            <div className={styles.summaryRow} style={{ padding: "0 4px" }}>
              <span className={styles.summaryLabel}>Round up</span>
              <span className={styles.adjustmentValueAmount}>
                {totals.autoAdjustment >= 0 ? "+ " : "− "}₹
                {Math.abs(totals.autoAdjustment).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Divider */}
            <div className={styles.summaryDivider} />

            {/* 4. Total Amount Row */}
            <div className={styles.totalHighlightRow}>
              <span className={styles.summaryTotalLabel}>Total (₹)</span>
              <span className={styles.summaryTotalValue}>
                ₹
                {totals.total.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info (Terms, Upload) */}
      <div className={styles.formCard}>
        <div className={styles.bottomGrid} style={{ padding: "0 24px" }}>
          <div className={styles.bottomCol}>
            <div
              className={styles.sectionTitle}
              style={{
                fontSize: "0.85rem",
                color: "#1e293b",
                marginBottom: "8px",
              }}
            >
              Terms & Conditions
            </div>
            <textarea
              className={styles.notesTextarea}
              value={quoteForm.Terms_x0026_Conditions}
              onChange={(e) =>
                setQuoteForm((prev) => ({
                  ...prev,
                  Terms_x0026_Conditions: e.target.value,
                }))
              }
              placeholder="Enter the terms and conditions of your business to be displayed in your transaction"
              disabled={mode === "view"}
            />
          </div>
          <div className={styles.bottomCol}>
            <div className={styles.sectionCard}>
              <div className={styles.attachmentsHeader}>
                <span className={styles.attachmentsTitle}>
                  Attach File(s) to Quote (
                  {attachments.filter((a) => !a.isDelete).length})
                </span>
                <button
                  className={styles.addButton}
                  onClick={() =>
                    document.getElementById("quoteFileUpload")?.click()
                  }
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0b4d53",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  disabled={mode === "view"}
                >
                  Add
                </button>
              </div>
              <div
                className={styles.attachmentsBox}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() =>
                  document.getElementById("quoteFileUpload")?.click()
                }
                style={{
                  border: "1px dashed #cbd5e1",
                  borderRadius: "8px",
                  padding: "20px",
                  textAlign: "center",
                  cursor: mode === "view" ? "default" : "pointer",
                  background: "#f8fafb",
                  marginTop: "8px",
                }}
              >
                <div
                  className={styles.uploadIconWrapper}
                  style={{ margin: "0 auto 12px auto" }}
                >
                  <i
                    className="pi pi-upload"
                    style={{ fontSize: "1.2rem", color: "#ffffff" }}
                  />
                </div>
                <div
                  className={styles.uploadText}
                  style={{ fontSize: "0.9rem", margin: "8px 0" }}
                >
                  <span style={{ color: "#0b4d53", fontWeight: 700 }}>
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </div>
                <div
                  className={styles.uploadSubtext}
                  style={{ fontSize: "0.75rem", color: "#64748b" }}
                >
                  Maximum file size 50MB
                </div>
                <input
                  id="quoteFileUpload"
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                  disabled={mode === "view"}
                />
              </div>

              {attachments.filter((a) => !a.isDelete).length > 0 && (
                <div
                  style={{
                    marginTop: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {attachments
                    .filter((a) => !a.isDelete)
                    .map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            overflow: "hidden",
                          }}
                        >
                          <i
                            className="pi pi-file"
                            style={{ color: "#0b4d53", fontSize: "1.1rem" }}
                          />
                          <span
                            style={{
                              fontSize: "0.85rem",
                              color: "#1e293b",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "200px",
                            }}
                          >
                            {file.FileName}
                          </span>
                        </div>
                        {mode !== "view" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAttachment(idx);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              padding: "4px",
                            }}
                            title="Remove file"
                          >
                            <i
                              className="pi pi-times"
                              style={{ fontSize: "0.9rem" }}
                            />
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "20px",
            marginTop: "20px",
          }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              style={{
                height: "35px",
                padding: "0 24px",
                border: "none",
                background: "#0f763c",
                borderRadius: "6px",
                color: "#ffffff",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={async () => {
                if (validateQuoteForm(quoteForm, itemDetails)) {
                  try {
                    await SaveToSP(quoteForm);
                    toast.success("Quote saved successfully");
                    setTimeout(() => {
                      if (onCancel) onCancel();
                    }, 1000);
                  } catch (error) {
                    console.error("Error saving quote:", error);
                    toast.error("Failed to save quote");
                  }
                }
              }}
              //   onClick={() => onSave?.(quoteForm)}
            >
              Save and Send
            </button>
            <button
              style={{
                height: "35px",
                padding: "0 24px",
                border: "1px solid #cbd5e1",
                background: "#f8fafb",
                borderRadius: "6px",
                color: "#334155",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>{" "}
      </div>

      {/* New Category Dialog */}
      <CustomDialog
        header="Add New Category"
        visible={isCategoryDialogVisible}
        onHide={() => setIsCategoryDialogVisible(false)}
        style={{ width: "400px" }}
        onSave={() => {
          if (newCategoryName.trim()) {
            setCategories((prev) => {
              const withoutAdd = prev.filter(
                (c) => c.value !== "ADD_NEW_CATEGORY",
              );
              return [
                ...withoutAdd,
                {
                  label: newCategoryName.trim(),
                  value: newCategoryName.trim(),
                },
                { label: "Add Category", value: "ADD_NEW_CATEGORY" },
              ];
            });
            if (pendingCategoryRowId) {
              updateItem(
                pendingCategoryRowId,
                "Category",
                newCategoryName.trim(),
              );
            }
            setIsCategoryDialogVisible(false);
          }
        }}
        saveLabel="Save"
      >
        <div className={styles.fieldGroup} style={{ padding: "10px 0" }}>
          <div className={styles.fieldLabel}>
            Category Name <span className={styles.required}>*</span>
          </div>
          <CustomInputBox
            value={newCategoryName}
            onChange={(val: any) => setNewCategoryName(val)}
            placeholder="Enter Category Name"
          />
        </div>
      </CustomDialog>
    </div>
  );
};

export default QuotesForm;
