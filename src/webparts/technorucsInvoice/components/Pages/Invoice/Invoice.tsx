import "../../../assets/CSS/style.css";
import "../../MainComponant.scss";
import logoImg from "../../../assets/images/technorucslogo.png";
// import { CircularProgress } from "@mui/material";
import CustomInputBox from "../../Common/DataTable/InputBox/CustomInputBox";
import CustomButton from "../../Common/DataTable/Button/CustomButton";
import React, { useState, useEffect, useMemo } from "react";
import { LISTNAMES } from "../../../Config/Config";
import CustomDataTable from "../../Common/DataTable/CustomDataTable";
import CustomDialog from "../../Common/CustomDialog/CustomDialog";
import {
  getCustomersZoho,
  exportToZoho,
  CreateInvoiceZoho,
  UpdateInvoiceZoho,
} from "../../CommonServices/zohoService";
import {
  SPReadItems,
  GetSPChoices,
  SPUpdateItem,
  SpGetItemByID,
  SPCreateItem,
  SPGetItemsFilter,
} from "../../CommonServices/SpService";
import CustomDropdown from "../../Common/DataTable/Dropdown/CustomDropdown";

import InvoiceCardList from "./InvoiceCardList";
import InvoiceForm from "./InvoiceForm";
import AppLoader from "../../Common/Loader/Apploader";
import { toast } from "react-toastify";
import { validateStatusUpdate } from "./InvoiceValidation";

import { RadioButton } from "primereact/radiobutton";
import CustomDatePicker from "../../Common/DataTable/DatePicker/CustomDatePicker";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { sp } from "@pnp/pnpjs";

// Fields searched by the text box
const SEARCH_FIELDS = [
  "InvoiceNumber",
  "Created",
  "Due_x0020_Date",
  "CustomerDisplayname",
  "Status",
  "Total",
  "PaymentStatus",
  "Author",
];

// Helper for date formatting
const fmt = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB");
};

// Helper for currency formatting
const fmtAmount = (
  currency: string,
  amount: number | null | undefined,
): string => {
  if (amount == null) return "—";
  return `${currency ?? ""} ${Number(amount).toFixed(2)}`;
};

// Helper for status styling
const getStatusStyles = (status: string) => {
  const s = status?.toLowerCase() || "";
  if (s === "approved" || s === "paid" || s === "added in zoho") {
    return {
      background: "#f0fdf4",
      color: "#166534",
      border: "1px solid #86efac",
    };
  }
  if (s === "pending" || s === "partially paid") {
    return {
      background: "#fffbeb",
      color: "#92400e",
      border: "1px solid #fde68a",
    };
  }
  if (s === "rejected" || s === "cancelled" || s === "edited") {
    return {
      background: "#fef2f2",
      color: "#991b1b",
      border: "1px solid #fecaca",
    };
  }
  // Draft / Default
  return {
    background: "#F3F4F8",//"#d5e0eddc",
    color: "#475569",
    border: "1px solid #D2D4DA", //#e2e8f0",
  };
};

const Invoice: any = (context: any) => {
  console.log("context", context);
  const [items, setItems] = useState<any[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [view, setView] = useState<
    "List" | "NewInvoice" | "EditInvoice" | "ViewInvoice"
  >("List");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchText, setSearchText] = useState<any>("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("");
  const [selectedFYFilter, setSelectedFYFilter] = useState<string>("");
  const [statusOptions, setStatusOptions] = useState<any[]>([]);
  const [fyOptions, setFyOptions] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isStatusDialogVisible, setIsStatusDialogVisible] =
    useState<boolean>(false);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<string>("Added in Zoho");

  // Payment Dialog State
  const [isPaymentDialogVisible, setIsPaymentDialogVisible] =
    useState<boolean>(false);
  const [isMailDialogVisible, setIsMailDialogVisible] =
    useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [paidDate, setPaidDate] = useState<Date | null>(null);
  const [settledFromEEFC, setSettledFromEEFC] = useState<string>("Yes");
  const [openMenu, setOpenMenu] = useState<{
    rowId: number;
    x: number;
    y: number;
  } | null>(null);

  const loadData = async () => {
    try {
      const data = await SPReadItems(
        LISTNAMES.Invoice,
        [
          "*",
          "Author/Title",
          "Editor/Title",
          "ProjectManagers/Title",
          "CEOProjectManager/Title",
        ],
        [
          "Author",
          "Editor",
          "ProjectManagers",
          "CEOProjectManager",
          "CEOProjectManager",
          "Author/EMail",
          "Author/Id",
        ],
      );
      console.log("Fetchdata", data);
      const mapped = data.map((row: any) => ({
        ...row,
        InvoiceNumber: row.Invoice ?? row.Title ?? "",
        CustomerDisplayname:
          row.CustomerDisplayname ?? row.CustomerDisplayName ?? "",
        FinalAmount: row.FinalAmount ?? row.Total ?? 0,
        PaymentStatus: row.PaymentStatus ?? row.Payment_x0020_Status ?? "",
      }));
      setItems(mapped);
      debugger;
      const fyData = data.map((item: any) => {
        return {
          label: item.Financialyear,
          value: item.Financialyear,
        };
      });
      setFyOptions([{ label: "All FY", value: "" }, ...fyData]);
    } catch (error) {
      console.error("Error fetching list items:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChoices = async () => {
    try {
      const data = await GetSPChoices(LISTNAMES.Customer, "Currency");
      // Prepend a blank "All" option so user can clear the filter
      setCurrencyOptions([{ label: "All Currencies", value: "" }, ...data]);

      // Fetch Status choices from the Invoice list
      const statusData = await GetSPChoices(LISTNAMES.Invoice, "Status");
      setStatusOptions([{ label: "All Status", value: "" }, ...statusData]);
    } catch (error) {
      console.error("Error fetching choices:", error);
    }
  };

  const handleClone = async (rowId: number) => {
    try {
      setLoading(true);
      const getSPItem = await SpGetItemByID(
        LISTNAMES.Invoice,
        rowId,
        ["*", "ProjectManagers/Id", "CEOProjectManager/Id"],
        ["ProjectManagers", "CEOProjectManager"],
      );

      const JsonData: any = {
        Status: "Draft",
        PaymentStatus: "Pending",
        Subject: getSPItem?.Subject || "",
        Currency: getSPItem?.Currency || "",
        Invoice: getSPItem?.Invoice || "",
        InvoiceDate: getSPItem?.InvoiceDate || null,
        Terms: getSPItem?.Terms || "",
        Due_x0020_Date: getSPItem?.Due_x0020_Date || null,
        CustomerDisplayname: getSPItem?.CustomerDisplayname || "",
        Email: getSPItem?.Email || "",
        CEOProjectManagerId: {
          results: getSPItem?.CEOProjectManager?.Id
            ? [getSPItem.CEOProjectManager.Id]
            : [],
        },
        ProjectManagersId: {
          results: Array.isArray(getSPItem?.ProjectManagersId)
            ? getSPItem.ProjectManagersId
            : getSPItem?.ProjectManagersId
              ? [getSPItem.ProjectManagersId]
              : [],
        },
        Subtotal: getSPItem?.Subtotal?.toString() || "0",
        TaxableValue: getSPItem?.TaxableValue?.toString() || "0",
        TaxTotal: getSPItem?.TaxTotal?.toString() || "0",
        Total: getSPItem?.Total?.toString() || "0",
        CustomerNotes: getSPItem?.CustomerNotes || "",
        Terms_x0026_condition: getSPItem?.Terms_x0026_condition || "",
        IsUpdated: false,
        Financialyear: getSPItem?.Financialyear || "",
        paymentoptionPaypal: getSPItem?.paymentoptionPaypal || false,
      };

      const createItem = await SPCreateItem(LISTNAMES.Invoice, JsonData)
        .then(() => {
          toast.success("Invoice cloned successfully.");
          loadData();
        })
        .catch((error) => {
          console.error("Clone error:", error);
          toast.error("An error occurred while cloning the invoice.");
        })
        .finally(() => {
          setLoading(false);
          setOpenMenu(null);
        });
    } catch (error) {
      console.error("Clone error:", error);
      toast.error("An error occurred while cloning the invoice.");
    } finally {
      setLoading(false);
      setOpenMenu(null);
    }
  };

  useEffect(() => {
    void loadData();
    void loadChoices();
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ── Derived filtered list ──────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let result = items;

    // 1. Currency dropdown — exact match
    if (selectedCurrency) {
      result = result.filter((item) => item.Currency === selectedCurrency);
    }

    // 2. Status dropdown — exact match
    if (selectedStatusFilter) {
      result = result.filter((item) => item.Status === selectedStatusFilter);
    }

    // 3. FY dropdown — exact match
    if (selectedFYFilter) {
      result = result.filter((item) => item.Financialyear === selectedFYFilter);
    }

    // 4. Text search — case-insensitive, across all SEARCH_FIELDS
    const term = searchText.trim().toLowerCase();
    if (term) {
      result = result.filter((item) =>
        SEARCH_FIELDS.some((field) => {
          let val = item[field];
          if (field === "ProjectManager") val = item.ProjectManager?.Title;
          if (field === "Author") val = item.Author?.Title;
          if (field === "Created") val = fmt(item.Created);
          if (field === "Due_x0020_Date")
            val = item.Due_x0020_Date
              ? new Date(item.Due_x0020_Date).toLocaleDateString("en-GB")
              : "";
          if (field === "Total")
            val = `${item.Currency ? item.Currency.split("-")[0] : ""} - ${item.Total}`;

          return String(val ?? "")
            .toLowerCase()
            .includes(term);
        }),
      );
    }

    return result;
  }, [
    items,
    searchText,
    selectedCurrency,
    selectedStatusFilter,
    selectedFYFilter,
  ]);
  // ──────────────────────────────────────────────────────────────────────────

  if (loading) {
    return <AppLoader />;
  }

  // ── Customer Form view (new) ──
  if (view === "NewInvoice") {
    return (
      <InvoiceForm
        context={context.context}
        mode={"create"}
        onCancel={() => setView("List")}
      />
    );
  }

  // ── Customer Form view (view/edit existing) ──
  if (view === "ViewInvoice") {
    return (
      <InvoiceForm
        context={context.context}
        mode={"view"}
        onCancel={() => {
          setView("List");
          setSelectedItem(null);
        }}
        initialData={selectedItem}
      />
    );
  } else if (view === "EditInvoice") {
    return (
      <InvoiceForm
        context={context.context}
        mode={"edit"}
        onCancel={() => {
          setView("List");
          setSelectedItem(null);
        }}
        initialData={selectedItem}
      />
    );
  }

  const generateJson = async (data: any) => {
    let lineItemDeatils: any[] = [];

    const invoiceItems = await SPGetItemsFilter(
      LISTNAMES.ItemDetails,
      ["*"],
      [""],
      `merge/Id eq ${data.Id}`,
    );
    debugger;
    console.log("invoiceItems", invoiceItems);

    invoiceItems.map((item: any) => {
      lineItemDeatils.push({
        item_id: "",
        name: item.ItemDeatils,
        description: item.ItemDeatils,
        rate: item.Rate,
        quantity: item.Quantity,
        unit: "hrs",
        discount: "0%",
        tax_id: "",
        item_order: item.SNo,
      });
    });

    console.log("lineItemDeatils", lineItemDeatils);

    const formatDate = (dateStr: string): string => {
      if (!dateStr) return "";
      // Extract just "YYYY-MM-DD" from "2026-04-27T18:30:00Z"
      return dateStr.split("T")[0];
    };

    let jsonData = {
      customer_id: "3547653000000100001",
      invoice_number: data.InvoiceNumber,
      date: formatDate(data.InvoiceDate),
      due_date: formatDate(data.Due_x0020_Date),
      currency_code: "INR",
      gst_treatment: "overseas",
      tax_exemption_code: "GST_NOT_APPLICABLE",

      // currency_code: data.Currency.split("-")[0].trim(),
      is_discount_before_tax: true,
      notes: data.CustomerNotes,
      terms: data.TermsAndConditions,
      line_items: lineItemDeatils,
    };

    debugger;
    return jsonData;
  };

  const handleZoho = async (data: any) => {
    const FormatJson = await generateJson(data);
    try {
      setLoading(true);

      // ── Fetch SP attachments as Blobs ────────────────────────────────────
      let attachmentBlobs: Array<{ FileName: string; FileContent: Blob }> = [];
      if (data.Id) {
        try {
          const spFiles = await sp.web.lists
            .getByTitle(LISTNAMES.Invoice)
            .items.getById(data.Id)
            .attachmentFiles();

          attachmentBlobs = await Promise.all(
            spFiles.map(async (file: any) => ({
              FileName: file.FileName,
              FileContent: await sp.web
                .getFileByServerRelativeUrl(file.ServerRelativeUrl)
                .getBlob(),
            })),
          );
        } catch (err) {
          console.warn("Could not fetch SP attachments:", err);
        }
      }

      // ── Update or Create invoice ─────────────────────────────────────────
      if (data.ZohoInvoiceID) {
        // Update existing Zoho invoice
        await UpdateInvoiceZoho(
          context.context,
          data.ZohoInvoiceID,
          FormatJson,
          attachmentBlobs,
        );
        toast.success("Zoho Invoice Updated!");
      } else {
        // Create new Zoho invoice
        const res = await CreateInvoiceZoho(
          context.context,
          FormatJson,
          attachmentBlobs,
        );
        console.log("Zoho Invoice created:", res);
        const count = attachmentBlobs.length;
        toast.success(
          count > 0
            ? `Zoho Invoice created with ${count} attachment(s)!`
            : "Zoho Invoice created!",
        );
      }
    } catch (error) {
      console.error("Zoho fetch error:", error);
      toast.error(
        data.ZohoInvoiceID
          ? "Failed to update Zoho invoice"
          : "Failed to create Zoho invoice",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleView = (row: any) => {
    setSelectedItem(row);
    setView("ViewInvoice");
  };
  const handleEdit = (row: any) => {
    setSelectedItem(row);
    setView("EditInvoice");
  };

  const handleDownloadAttachments = async (row: any) => {
    try {
      setLoading(true);
      const attachments = await sp.web.lists
        .getByTitle(LISTNAMES.Invoice)
        .items.getById(row.Id)
        .attachmentFiles();

      if (attachments.length === 0) {
        toast.info("No attachments found for this invoice.");
        setLoading(false);
        return;
      }

      const zip = new JSZip();

      for (const file of attachments) {
        const fileContent = await sp.web
          .getFileByServerRelativeUrl(file.ServerRelativeUrl)
          .getBlob();
        zip.file(file.FileName, fileContent);
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Attachments_Invoice_${row.InvoiceNumber || row.Id}.zip`);
      toast.success("Attachments downloaded as ZIP successfully!");
    } catch (error) {
      console.error("Error downloading attachments:", error);
      toast.error("Failed to download attachments.");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (row: any) => {
    try {
      setLoading(true);
      await exportToZoho(context.context, row);
      toast.success("Invoice synced to Zoho!");
      await loadData();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Failed to sync to Zoho");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.info("Export functionality coming soon!");
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadData();
    await loadChoices();
    setSearchText("");
    setSelectedCurrency("");
    setSelectedStatusFilter("");
    setSelectedFYFilter("");
    setLoading(false);
  };

  return (
    <div>
      <div className="crm-header-section">
        {/* Top Bar with Logo */}
        <div className="crm-top-bar">
          <div className="crm-brand">
            <div className="crm-avatar">
              <img src={logoImg} alt="Technorucs Logo" />
            </div>
          </div>
        </div>

        <div className="crm-desktop-toolbar">
          <div className="crm-toolbar-row">
            <div className="crm-toolbar-search">
              <CustomInputBox
                value={searchText}
                onChange={(value) => setSearchText(value)}
                placeholder="Search invoices..."
                iconLeft="pi pi-search"
                iconRight={searchText ? "pi pi-times" : undefined}
                onIconRightClick={() => setSearchText("")}
              />
            </div>

            <button
              className="crm-action-btn-square crm-refresh-btn"
              // onClick={handleRefresh}

              title="Refresh Data"
            >
              <i
                className="pi pi-sync"
                //  onClick={handleZoho}
              />
            </button>

            <div className="crm-toolbar-action crm-new-btn-wrapper">
              <CustomButton
                label="New"
                icon="pi pi-plus"
                onClick={() => setView("NewInvoice")}
                variant="primary"
              />
            </div>
          </div>

          <div className="crm-toolbar-row">
            <div className="crm-toolbar-dropdown crm-currency-filter">
              <CustomDropdown
                value={selectedCurrency}
                onChange={(value) => setSelectedCurrency(value as string)}
                options={currencyOptions}
                placeholder="Currency"
                showClear={!!selectedCurrency}
                filter={true}
              />
            </div>
            <div className="crm-toolbar-dropdown crm-status-filter">
              <CustomDropdown
                value={selectedStatusFilter}
                onChange={(value) => setSelectedStatusFilter(value as string)}
                options={statusOptions}
                placeholder="Status"
                showClear={!!selectedStatusFilter}
                filter={true}
              />
            </div>
          </div>

          <div className="crm-toolbar-row">
            <div className="crm-toolbar-dropdown crm-fy-filter">
              <CustomDropdown
                value={selectedFYFilter}
                onChange={(value) => setSelectedFYFilter(value as string)}
                options={fyOptions}
                placeholder="FY"
                showClear={!!selectedFYFilter}
                filter={true}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="table-view">
        <CustomDataTable
          data={filteredItems}
          columns={[
            {
              field: "Created",
              header: "Date",
              width: "90px",
              renderBody: (row: any) => (
                <div className="truncate-text" title={fmt(row.Created)}>
                  {fmt(row.Created)}
                </div>
              ),
            },
            {
              field: "Invoice",
              header: "Invoice no",
              width: "120px",
              renderBody: (row: any) => (
                <div
                  className="truncate-text"
                  title={row.Invoice}
                  style={{ color: "#0f763c", fontWeight: "bold" }}
                >
                  {row.Invoice}
                </div>
              ),
            },
            {
              field: "Due_x0020_Date",
              header: "Due Date",
              width: "110px",
              renderBody: (row: any) => {
                const dateVal = row.Due_x0020_Date
                  ? new Date(row.Due_x0020_Date).toLocaleDateString("en-GB")
                  : "—";
                return (
                  <div className="truncate-text" title={dateVal}>
                    {dateVal}
                  </div>
                );
              },
            },
            {
              field: "CustomerDisplayname",
              header: "Display name",
              width: "180px",
              renderBody: (row: any) => (
                <div className="truncate-text" title={row.CustomerDisplayname}>
                  {row.CustomerDisplayname}
                </div>
              ),
            },
            {
              field: "Status",
              header: "Status",
              width: "140px",
              renderBody: (row: any) => (
                <div
                  onClick={() => {
                    if (row.Status === "Draft" || row.Status === "Edited") {
                      setSelectedItem(row);
                      setIsStatusDialogVisible(true);
                    }
                  }}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "50px", // Rounded pill look as per screenshot
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textAlign: "center",
                    cursor:
                      row.Status === "Draft" || row.Status === "Edited"
                        ? "pointer"
                        : "",
                    ...getStatusStyles(row.Status),
                  }}
                >
                  {row.Status || "—"}
                </div>
              ),
            },
            {
              field: "Total",
              header: "Final amount",
              width: "130px",
              renderBody: (row: any) => {
                const amount = `${row.Currency ? row.Currency.split("-")[0] : ""} - ${row.Total}`;
                return (
                  <div className="truncate-text" title={amount}>
                    {amount}
                  </div>
                );
              },
            },
            {
              field: "PaymentStatus",
              header: "Payment",
              width: "120px",
              renderBody: (row: any) => (
                <div
                  style={{
                    padding: "4px 12px",
                    borderRadius: "50px", // Rounded pill look as per screenshot
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textAlign: "center",
                    ...getStatusStyles(row.PaymentStatus),
                  }}
                  onClick={() => {
                    setSelectedItem(row);
                    //     setPaymentStatus(row.PaymentStatus || "Paid");
                    setPaidDate(
                      row.PaymentDate ? new Date(row.PaymentDate) : null,
                    );
                    setIsPaymentDialogVisible(true);
                    setSelectedItem(row);
                  }}
                >
                  {row.PaymentStatus || "—"}
                </div>
              ),
            },
            {
              field: "Author",
              header: "Created by",
              width: "180px",
              renderBody: (row: any) => {
                const name = row.Author?.Title || "Unknown";
                const email = row.Author?.EMail;
                const avatarUrl = email
                  ? `${context.pageContext.web.absoluteUrl}/_layouts/15/userphoto.aspx?size=S&accountname=${email}`
                  : "";

                return (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#d1d5db",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 600,
                        overflow: "hidden",
                      }}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <span>{name}</span>
                  </div>
                );
              },
            },
            {
              field: "Action",
              header: "Action",
              width: "130px",
              renderBody: (row: any) => (
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <i
                    className="pi pi-eye action-icon-smooth"
                    title="View Invoice"
                    onClick={() => handleView(row)}
                  ></i>
                  <i
                    className="pi pi-pencil action-icon-smooth"
                    title="Edit Invoice"
                    onClick={() => handleEdit(row)}
                  ></i>
                  <i
                    className="pi pi-sync action-icon-smooth"
                    title="Sync to Zoho"
                    onClick={() => handleZoho(row)}
                  ></i>
                  <i
                    className="pi pi-envelope action-icon-smooth"
                    title="Mail Details"
                    onClick={() => {
                      setSelectedItem(row);
                      setIsMailDialogVisible(true);
                    }}
                  ></i>
                  <i
                    className="pi pi-paperclip action-icon-smooth"
                    title="Attachments"
                    onClick={() => handleDownloadAttachments(row)}
                  ></i>
                  <div style={{ position: "relative" }}>
                    <i
                      className="pi pi-ellipsis-v action-icon-smooth"
                      title="More Options"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        if (openMenu?.rowId === row.Id) {
                          setOpenMenu(null);
                        } else {
                          setOpenMenu({
                            rowId: row.Id,
                            x: rect.right,
                            y: rect.bottom + 4,
                          });
                        }
                      }}
                    ></i>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
      <div className="card-view">
        <InvoiceCardList
          data={filteredItems}
          onView={handleView}
          onEdit={handleEdit}
          // onSync={handleSync}
          onClone={(item) => handleClone(item.Id)}
          onMailDetails={(item) => {
            setSelectedItem(item);
            setIsMailDialogVisible(true);
          }}
          onPdf={(item) => console.log("Pdf clicked", item.Id)}
          onExport={handleExport}
        />
      </div>

      {/* Demonstration of CustomDialog */}
      <CustomDialog
        header="Status Update"
        visible={isStatusDialogVisible}
        style={{ width: "max-content" }}
        onHide={() => setIsStatusDialogVisible(false)}
        onSave={async () => {
          // 1. Validate using external file
          const isValid = validateStatusUpdate(
            exchangeRate,
            selectedStatus,
            selectedItem?.Currency,
          );
          if (!isValid) return;

          try {
            // 2. Prepare base payload
            const updatePayload: any = {
              Status: selectedStatus,
              IsUpdated: true,
            };

            if (selectedItem?.Currency?.includes("INR")) {
              // INR case
              updatePayload.TaxableValue = selectedItem?.Subtotal;
              updatePayload.InvoiceRaisedINR = selectedItem?.Total;
              updatePayload.ReceviedAmount = selectedItem?.Total;
            } else {
              updatePayload.InvoiceRaisedExchangeRate = exchangeRate;
              updatePayload.InvoiceRaisedINR =
                selectedItem?.Total * exchangeRate;
              updatePayload.TaxableValue = selectedItem?.Total * exchangeRate;
              updatePayload.IsUpdated = true;
            }

            debugger;
            await SPUpdateItem(
              LISTNAMES.Invoice,
              selectedItem?.Id,
              updatePayload,
            );
            debugger;
            setIsStatusDialogVisible(false);
            toast.success("Status updated successfully");
            setLoading(true);
            setExchangeRate(0);
            await loadData();
          } catch (error) {
            console.error("Status Update Error:", error);
            toast.error("An error occurred during update.");
          }
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            padding: "10px 5px",
          }}
        >
          <div
            className="dialog-field"
            style={
              selectedItem?.Currency.includes("INR") ||
              selectedItem?.Status === "Edited"
                ? { display: "none" }
                : {}
            }
          >
            <label className="dialog-label">
              Invoice Raised - Exchange rate
            </label>
            <CustomInputBox
              value={exchangeRate}
              onChange={(v: any) => setExchangeRate(Number(v))}
              placeholder="Enter Exchange Rate"
            />
          </div>
          <div className="dialog-field">
            <label className="dialog-label">Status</label>
            <CustomDropdown
              options={[{ label: "Added in Zoho", value: "Added in Zoho" }]}
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val as string)}
            />
          </div>

          <div
            className="dialog-field"
            style={selectedItem?.Status === "Edited" ? {} : { display: "none" }}
          >
            <label className="dialog-label">Updated Columns</label>

            {(() => {
              let updatedColumns: {
                column: string;
                oldValue: string;
                newValue: string;
              }[] = [];
              try {
                const raw = selectedItem.UpdatedColoumnNames;
                if (typeof raw === "string" && raw.trim().startsWith("[")) {
                  updatedColumns = JSON.parse(raw);
                } else if (Array.isArray(raw)) {
                  updatedColumns = raw;
                }
              } catch {
                updatedColumns = [];
              }
              debugger;
              return updatedColumns.length > 0 ? (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: "8px",
                    fontSize: "0.82rem",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f1f5f9",
                        color: "#475569",
                        textAlign: "left",
                      }}
                    >
                      <th
                        style={{
                          padding: "8px 12px",
                          fontWeight: 600,
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        Column
                      </th>
                      <th
                        style={{
                          padding: "8px 12px",
                          fontWeight: 600,
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        Old Value
                      </th>
                      <th
                        style={{
                          padding: "8px 12px",
                          fontWeight: 600,
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        New Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {updatedColumns.map((item, index) => (
                      <tr
                        key={index}
                        style={{
                          background: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        <td
                          style={{
                            padding: "7px 12px",
                            fontWeight: 600,
                            color: "#1e293b",
                          }}
                        >
                          {item.column || "—"}
                        </td>
                        <td style={{ padding: "7px 12px", color: "#dc2626" }}>
                          {item.oldValue || "—"}
                        </td>
                        <td style={{ padding: "7px 12px", color: "#16a34a" }}>
                          {item.newValue || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div
                  style={{
                    color: "#94a3b8",
                    fontStyle: "italic",
                    marginTop: "6px",
                  }}
                >
                  No column updates recorded
                </div>
              );
            })()}
          </div>
        </div>
      </CustomDialog>

      {/* Payment Status Dialog */}
      <CustomDialog
        header="Payment Status"
        visible={isPaymentDialogVisible}
        className={paymentStatus === "Paid" ? "payment-dialog-wide" : ""}
        style={{
          width: paymentStatus === "Paid" ? "600px" : "380px",
          maxWidth: "95vw",
        }}
        onHide={() => setIsPaymentDialogVisible(false)}
        onSave={async () => {
          debugger;
          try {
            setLoading(true);
            const updatePayload: any = { PaymentStatus: paymentStatus };
            if (paidDate) {
              updatePayload.PaymentDate = paidDate;
            }
            if (
              paymentStatus === "Paid" &&
              selectedItem?.ReceivingAccount === "EEFC"
            ) {
              updatePayload.ReceivingAccount = selectedItem?.ReceivingAccount;
              updatePayload.PaymentStatus = "Paid";
              updatePayload.IsUpdated = true;
              updatePayload.BankCharges = selectedItem?.BankCharges;
              updatePayload.ExchangeRateOnReceivedDate =
                selectedItem?.ExchangeRateOnReceivedDate;
              updatePayload.EEFCDueDate = selectedItem?.EEFCDueDate;
              updatePayload.SettledFromEEFCtoICICI =
                selectedItem?.SettledFromEEFCtoICICI === "Yes" ? true : false;
              updatePayload.ReceviedAmount = selectedItem?.ReceviedAmount;
              updatePayload.TaxableValue = selectedItem?.Currency.includes(
                "INR",
              )
                ? selectedItem?.subTotal
                : selectedItem?.Total *
                  selectedItem?.ExchangeRateOnReceivedDate;
              updatePayload.PaidDate = selectedItem?.PaidDate;
            } else if (
              paymentStatus === "Paid" &&
              selectedItem?.ReceivingAccount === "ICICI"
            ) {
              updatePayload.PaymentStatus = "Paid";
              updatePayload.ReceivingAccount = selectedItem?.ReceivingAccount;
              updatePayload.BankCharges = selectedItem?.BankCharges;
              updatePayload.ICICIBankSettledAmountInINR =
                selectedItem?.ICICIBankSettledAmountInINR;
              updatePayload.ExchangeGainorLoss =
                selectedItem?.Currency.includes("INR")
                  ? selectedItem?.InvoiceRaisedINR -
                    selectedItem?.ICICIBankSettledAmountInINR
                  : 0;
              updatePayload.ICICIBankExchangeRateWhileSettlement =
                selectedItem?.ICICIBankExchangeRateWhileSettlement;
              updatePayload.SettledFromEEFCtoICICI =
                selectedItem?.SettledFromEEFCtoICICI === "Yes" ? true : false;
              updatePayload.ReceviedAmount = selectedItem?.ReceviedAmount;
              updatePayload.PaidDate = selectedItem?.PaidDate;
              updatePayload.TDSReceivable = selectedItem?.Currency.includes(
                "INR",
              )
                ? selectedItem?.TDSReceivable
                : 0;
            } else {
              updatePayload.PaymentStatus = selectedItem?.PaymentStatus;
              updatePayload.IsUpdated = true;
              updatePayload.PaymentDate = selectedItem?.PaymentDate;
            }

            await SPUpdateItem(
              LISTNAMES.Invoice,
              selectedItem?.Id,
              updatePayload,
            );
            setIsPaymentDialogVisible(false);
            toast.success("Payment status updated successfully");
            await loadData();
          } catch (error) {
            console.error("Payment Update Error:", error);
            toast.error("An error occurred during payment status update.");
            setLoading(false);
          }
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            padding: "10px 5px",
          }}
        >
          {/* Row 1: Payment (Full Width) */}
          <div className="dialog-field">
            <label className="dialog-label">Payment</label>
            <div
              style={{
                display: "flex",
                gap: "16px",
                alignItems: "center",
                flexWrap: "wrap",
                marginTop: "10px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <RadioButton
                  inputId="paid"
                  name="payment"
                  value="Paid"
                  onChange={(e) => setPaymentStatus(e.value)}
                  checked={paymentStatus === "Paid"}
                />
                <label
                  htmlFor="paid"
                  style={{
                    fontSize: "0.95rem",
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  Paid
                </label>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <RadioButton
                  inputId="void"
                  name="payment"
                  value="Void"
                  onChange={(e) => setPaymentStatus(e.value)}
                  checked={paymentStatus === "Void"}
                />
                <label
                  htmlFor="void"
                  style={{
                    fontSize: "0.95rem",
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  Void
                </label>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <RadioButton
                  inputId="cancelled"
                  name="payment"
                  value="Cancelled"
                  onChange={(e) => setPaymentStatus(e.value)}
                  checked={paymentStatus === "Cancelled"}
                />
                <label
                  htmlFor="cancelled"
                  style={{
                    fontSize: "0.95rem",
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  Cancelled
                </label>
              </div>
            </div>
          </div>

          {/* Balance of fields (2 columns if Paid, 1 column if Void/Cancelled) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: paymentStatus === "Paid" ? "1fr 1fr" : "1fr",
              gap: "20px",
            }}
          >
            <div className="dialog-field">
              <label className="dialog-label">Paid Date</label>
              <CustomDatePicker
                value={selectedItem?.PaidDate}
                onChange={(val) =>
                  setSelectedItem({
                    ...selectedItem,
                    PaidDate: val || null,
                  })
                }
              />
            </div>

            {paymentStatus === "Paid" &&
              selectedItem?.Currency.includes("INR") && (
                <>
                  <div className="dialog-field">
                    <label className="dialog-label">
                      Received at EEFC/ICICI
                    </label>
                    <CustomDropdown
                      options={
                        selectedItem?.Currency.includes("INR")
                          ? [{ label: "ICICI", value: "ICICI" }]
                          : [
                              { label: "EEFC", value: "EEFC" },
                              { label: "ICICI", value: "ICICI" },
                            ]
                      }
                      value={selectedItem?.ReceivingAccount}
                      onChange={(val) =>
                        setSelectedItem({
                          ...selectedItem,
                          ReceivingAccount: val as string,
                        })
                      }
                    />
                  </div>

                  <div className="dialog-field">
                    <label className="dialog-label">TDS</label>
                    <CustomInputBox
                      value={selectedItem?.TDSReceivable}
                      onChange={(val) =>
                        setSelectedItem({
                          ...selectedItem,
                          TDSReceivable: val || null,
                        })
                      }
                    />
                  </div>

                  <div className="dialog-field">
                    <label className="dialog-label">
                      ICIC Bank -Settled Amount in INR
                    </label>
                    <CustomInputBox
                      type="number"
                      value={
                        selectedItem?.InvoiceRaisedINR -
                        selectedItem?.TDSReceivable
                      }
                      onChange={(val: any) =>
                        setSelectedItem({
                          ...selectedItem,
                          ICICIBankSettledAmountInINR: val,
                        })
                      }
                    />
                  </div>

                  <div className="dialog-field">
                    <label className="dialog-label">
                      Settled from EEFC to ICICI
                    </label>
                    <CustomDropdown
                      options={[
                        { label: "Yes", value: "Yes" },
                        { label: "No", value: "No" },
                      ]}
                      value={settledFromEEFC}
                      onChange={(val) => setSettledFromEEFC(val as string)}
                    />
                  </div>
                </>
              )}

            {paymentStatus === "Paid" &&
              !selectedItem?.Currency?.includes("INR") && (
                <>
                  <div className="dialog-field">
                    <label className="dialog-label">
                      Received at EEFC/ICICI
                    </label>
                    <CustomDropdown
                      options={
                        selectedItem?.Currency?.includes("INR")
                          ? [{ label: "ICICI", value: "ICICI" }]
                          : [
                              { label: "EEFC", value: "EEFC" },
                              { label: "ICICI", value: "ICICI" },
                            ]
                      }
                      value={selectedItem?.ReceivingAccount}
                      onChange={(val) =>
                        setSelectedItem({
                          ...selectedItem,
                          ReceivingAccount: val as string,
                        })
                      }
                    />
                  </div>

                  <div className="dialog-field">
                    <label className="dialog-label">Bank Charges</label>
                    <CustomInputBox
                      type="number"
                      value={selectedItem?.BankCharges}
                      onChange={(val: any) =>
                        setSelectedItem({
                          ...selectedItem,
                          BankCharges: val ? val : null,
                          ReceviedAmount:
                            (Number(selectedItem.Total) || 0) -
                            (Number(val) || 0),
                        })
                      }
                    />
                  </div>

                  <div className="dialog-field">
                    <label className="dialog-label">Received Amount</label>
                    <CustomInputBox
                      type="number"
                      value={
                        selectedItem?.Total !== undefined &&
                        selectedItem?.BankCharges !== undefined
                          ? String(
                              (Number(selectedItem.Total) || 0) -
                                (Number(selectedItem.BankCharges) || 0),
                            )
                          : selectedItem?.ReceviedAmount
                            ? String(selectedItem.ReceviedAmount)
                            : ""
                      }
                      onChange={(val: any) =>
                        setSelectedItem({
                          ...selectedItem,
                          ReceviedAmount: val,
                        })
                      }
                    />
                  </div>

                  {selectedItem?.ReceivingAccount === "ICICI" && (
                    <div className="dialog-field">
                      <label className="dialog-label">
                        ICIC Bank -Exchange rate while settlement
                      </label>
                      <CustomInputBox
                        type="number"
                        value={
                          selectedItem?.ICICIBankExchangeRateWhileSettlement
                        }
                        onChange={(val: any) => {
                          const updatedValue = val ? Number(val) : null;

                          setSelectedItem({
                            ...selectedItem,
                            ICICIBankExchangeRateWhileSettlement: updatedValue,
                          });

                          console.log(
                            "va -ICICIBankExchangeRateWhileSettlement",
                            updatedValue,
                          );
                        }}
                      />
                    </div>
                  )}

                  {selectedItem?.ReceivingAccount === "EEFC" && (
                    <div className="dialog-field">
                      <label className="dialog-label">
                        Exchange Rate on received date
                      </label>
                      <CustomInputBox
                        type="number"
                        value={selectedItem?.ExchangeRateOnReceivedDate}
                        onChange={(val: any) => {
                          const updatedValue = val ? Number(val) : null;

                          setSelectedItem({
                            ...selectedItem,
                            ExchangeRateOnReceivedDate: updatedValue,
                          });

                          console.log(
                            "va -ExchangeRateOnReceivedDate",
                            updatedValue,
                          );
                        }}
                      />
                    </div>
                  )}

                  {selectedItem?.ReceivingAccount === "ICICI" && (
                    <div className="dialog-field">
                      <label className="dialog-label">
                        ICIC Bank -Settled Amount in INR
                      </label>
                      <CustomInputBox
                        type="number"
                        value={selectedItem?.ExchangeRateOnReceivedDate}
                        onChange={(val: any) =>
                          setSelectedItem({
                            ...selectedItem,
                            ExchangeRateOnReceivedDate: val
                              ? Number(val)
                              : null,
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="dialog-field">
                    <label className="dialog-label">EEFC Due Date</label>
                    <CustomDatePicker
                      value={selectedItem?.EEFCDueDate}
                      onChange={(val) =>
                        setSelectedItem({
                          ...selectedItem,
                          EEFCDueDate: val || null,
                        })
                      }
                    />
                  </div>

                  <div className="dialog-field">
                    <label className="dialog-label">
                      Settled from EEFC to ICICI
                    </label>
                    <CustomDropdown
                      options={[
                        { label: "Yes", value: "Yes" },
                        { label: "No", value: "No" },
                      ]}
                      value={settledFromEEFC}
                      onChange={(val) => setSettledFromEEFC(val as string)}
                    />
                  </div>
                </>
              )}
          </div>
        </div>
      </CustomDialog>

      {/* Mail Details Dialog */}
      <CustomDialog
        header="Mail & Manager Details"
        visible={isMailDialogVisible}
        className="payment-dialog-wide"
        style={{ width: "600px", maxWidth: "95vw" }}
        onHide={() => setIsMailDialogVisible(false)}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setIsMailDialogVisible(false)}
              className="btn-cancel"
              style={{
                backgroundColor: "#f5f5f5",
                color: "#333",
                border: "1px solid #ccc",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Close
            </button>
          </div>
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            padding: "10px 5px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <div className="dialog-field">
              <label className="dialog-label">CEO Manager</label>
              <div
                style={{
                  fontSize: "0.95rem",
                  color: "#334155",
                  padding: "8px 0",
                }}
              >
                {/*         {selectedItem?.CEOProjectManager?.Title || "—"} */}
                {selectedItem?.CEOProjectManager?.map(
                  (pm: any) => pm.Title,
                ).join(", ") || "—"}
              </div>
            </div>

            <div className="dialog-field">
              <label className="dialog-label">Project Manager</label>
              <div
                style={{
                  fontSize: "0.95rem",
                  color: "#334155",
                  padding: "8px 0",
                }}
              >
                {selectedItem?.ProjectManagers?.map((pm: any) => pm.Title).join(
                  ", ",
                ) || "—"}
              </div>
            </div>

            <div className="dialog-field">
              <label className="dialog-label">Payment to Paypal</label>
              <div
                style={{
                  fontSize: "0.95rem",
                  color: "#334155",
                  padding: "8px 0",
                }}
              >
                {selectedItem?.paymentoptionPaypal ? "Yes" : "No"}
              </div>
            </div>

            <div className="dialog-field">
              <label className="dialog-label">Email List</label>
              <div
                style={{
                  fontSize: "0.95rem",
                  color: "#334155",
                  padding: "8px 0",
                }}
              >
                {selectedItem?.Email ? selectedItem?.Email : "—"}

                {/* {(() => {
                  try {
                    const emails = JSON.parse(selectedItem?.Email || "[]");
                    if (emails && emails.length > 0) {
                      return emails.map((e: any) => e).join(", ");
                    }
                  } catch (e) {}
                  return "—";
                })()} */}
              </div>
            </div>
          </div>
        </div>
      </CustomDialog>

      {/* Action Menu (Pdf, Clone, Export) */}
      {openMenu && (
        <>
          <style>
            {`
              @keyframes menuFadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}
          </style>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              left: `${openMenu.x - 130}px`,
              top: `${openMenu.y}px`,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 9999,
              minWidth: "130px",
              overflow: "hidden",
              animation: "menuFadeIn 0.2s ease-out",
            }}
          >
            {[
              {
                label: "Pdf",
                icon: "pi-file-pdf",
                color: "#e11d48",
                onClick: () => console.log("Pdf clicked", openMenu.rowId),
              },
              {
                label: "Clone",
                icon: "pi-copy",
                color: "#0ea5e9",
                onClick: () => {
                  handleClone(openMenu.rowId);
                },
              },
              {
                label: "Export",
                icon: "pi-download",
                color: "#0f763c",
                onClick: () => console.log("Export clicked", openMenu.rowId),
              },
            ].map((opt) => (
              <div
                key={opt.label}
                onClick={() => {
                  opt.onClick();
                  setOpenMenu(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  color: opt.color,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f8fafc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <i
                  className={`pi ${opt.icon}`}
                  style={{ fontSize: "0.9rem" }}
                ></i>
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Invoice;
