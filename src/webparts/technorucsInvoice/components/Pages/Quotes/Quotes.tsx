import React, { useState, useEffect, useMemo } from "react";
import CustomDropdown from "../../Common/DataTable/Dropdown/CustomDropdown";
import "../../../assets/CSS/style.css";
import "../../MainComponant.scss";
import CustomInputBox from "../../Common/DataTable/InputBox/CustomInputBox";
import CustomButton from "../../Common/DataTable/Button/CustomButton";
import CustomDataTable from "../../Common/DataTable/CustomDataTable";
import { LISTNAMES } from "../../../Config/Config";
import { SPGetItemsFilter, SPReadItems } from "../../CommonServices/SpService";
import AppLoader from "../../Common/Loader/Apploader";
import QuotesCardList from "./QuotesCardList";
import QuotesForm from "./QuotesForm";

import logoImg from "../../../assets/images/technorucslogo.png";
import { CreateQuoteZoho } from "../../CommonServices/zohoService";

// Fields searched by the text box
const SEARCH_FIELDS = ["QuoteNo", "CustomerDisplayname", "Status"];

// Helper for date formatting
const fmt = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB");
};

// Helper for status styling
const getStatusStyles = (status: string) => {
  const s = status?.toLowerCase() || "";
  if (s === "approved" || s === "accepted") {
    return {
      background: "#f0fdf4",
      color: "#166534",
      border: "1px solid #86efac",
    };
  }
  if (s === "pending" || s === "sent") {
    return {
      background: "#fffbeb",
      color: "#92400e",
      border: "1px solid #fde68a",
    };
  }
  if (s === "rejected" || s === "cancelled" || s === "declined") {
    return {
      background: "#fef2f2",
      color: "#991b1b",
      border: "1px solid #fecaca",
    };
  }
  // Draft / Default
  return {
    /*background: "#d5e0eddc",
    color: "#475569",
    border: "1px solid #e2e8f0",*/
    background: "#F3F4F8",//"#d5e0eddc",
    color: "#475569",
    border: "1px solid #D2D4DA", //#e2e8f0",
  };
};

const Quotes: any = (props: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [view, setView] = useState<
    "List" | "NewQuote" | "EditQuote" | "ViewQuote"
  >("List");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const data = await SPReadItems(
        LISTNAMES.Quote,
        [
          "*",
          "Author/Title",
          "Editor/Title",
          "Author/EMail",
          "Author/Id",
          "Customer/Id",
          "Customer/Customerdisplayname",
        ],
        ["Author", "Editor", "Customer"],
      );
      console.log("Fetch Quotes Data", data);
      const mapped = data.map((row: any) => ({
        ...row,
        QuoteNo: row.QuoteNo ?? row.Title ?? "",
        CustomerDisplayname:
          row.Customer?.Customerdisplayname ||
          row.CustomerDisplayname ||
          row.CustomerDisplayName ||
          "",
      }));
      setItems(mapped);

      // Generate unique customer options for filter
      const uniqueCustomers = Array.from(
        new Set(mapped.map((item: any) => item.CustomerDisplayname)),
      )
        .filter(Boolean)
        .sort()
        .map((name) => ({ label: name, value: name }));
      setCustomerOptions(uniqueCustomers);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [view]);

  const generateJsona = async (data: any) => {
    debugger;
    let itemsData: any[] = [];
    const getSpItems = await SPGetItemsFilter(
      LISTNAMES.QuoteItemDetails,
      ["*"],
      [""],
      `QuotesId eq ${data.Id}`,
    );
    console.log("getSpItems", getSpItems);
    getSpItems.forEach((item) => {
      itemsData.push({
        name: item.Category,
        description: item.ItemDetails,
        rate: item.Rate,
        quantity: item.Quantity,
        discount: item.Discount + item.DiscountType,
        // discountType: item.DiscountType,
      });
    });
    const formatDate = (dateStr: string): string => {
      if (!dateStr) return "";
      // Extract just "YYYY-MM-DD" from "2026-04-27T18:30:00Z"
      return dateStr.split("T")[0];
    };

    let dataForJson = {
      customer_id: "3547653000000100001",
      estimate_number: data.QuoteNo,
      date: data.QuoteDate ? formatDate(data.QuoteDate) : "",
      expiry_date: data.ExpiryDate ? formatDate(data.ExpiryDate) : "",
      currency_code: data.CurrencyCode,

      notes: "Thank you for your business.",
      terms: data.Terms_x0026_Conditions,
      shipping_charge: 0,
      adjustment: 0,
      line_items: itemsData,
    };

    return dataForJson;
  };

  // ── Derived filtered list ──────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let result = items;

    // Text search — case-insensitive, across all SEARCH_FIELDS
    const term = searchText.trim().toLowerCase();
    if (term) {
      result = result.filter((item) =>
        SEARCH_FIELDS.some((field) => {
          const val = item[field];
          return String(val ?? "")
            .toLowerCase()
            .includes(term);
        }),
      );
    }

    // Customer Name filter
    if (selectedCustomerName) {
      result = result.filter(
        (item) => item.CustomerDisplayname === selectedCustomerName,
      );
    }

    return result;
  }, [items, searchText, selectedCustomerName]);
  // ──────────────────────────────────────────────────────────────────────────

  if (loading) {
    return <AppLoader />;
  }

  // Action handlers
  const handleView = (row: any) => {
    setSelectedItem(row);
    setView("ViewQuote");
  };
  const handleEdit = (row: any) => {
    setSelectedItem(row);
    setView("EditQuote");
  };

  const handleSync = async (row: any) => {
    const genJson = await generateJsona(row);
    debugger;
    console.log("genJson", genJson);
    //make service call to sync quote data toZoho
    const SaveToZoho = await CreateQuoteZoho(props.context, genJson);
    // console.log("Sync Quotes:", genJson);
  };

  // const handleRefresh = async () => {
  //   setLoading(true);
  //   await loadData();
  //   setSearchText("");
  //   setSelectedCustomerName("");
  //   setLoading(false);
  // };

  if (view !== "List") {
    return (
      <QuotesForm
        mode={
          view === "NewQuote"
            ? "create"
            : view === "EditQuote"
              ? "edit"
              : "view"
        }
        initialData={selectedItem}
        onCancel={() => {
          setView("List");
          setSelectedItem(null);
        }}
        context={props.context}
      />
    );
  }

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

        <div className="crm-desktop-toolbar quotes-toolbar-container">
          {/* Row 1: Search, Refresh, New Quote (Left to Right on Mobile Row 1) */}
          <div className="crm-toolbar-row">
            <div className="crm-toolbar-search">
              <CustomInputBox
                value={searchText}
                onChange={(value) => setSearchText((value as string) || "")}
                placeholder="Search quotes..."
                iconLeft="pi pi-search"
                iconRight={searchText ? "pi pi-times" : undefined}
                onIconRightClick={() => setSearchText("")}
              />
            </div>

            <div className="crm-refresh-btn">
              <button
                className="crm-action-btn-square"
                // onClick={handleRefresh}
                title="Refresh Data"
              >
                <i className="pi pi-sync" />
              </button>
            </div>

            <div className="crm-new-btn-wrapper">
              <CustomButton
                label="New"
                icon="pi pi-plus"
                onClick={() => setView("NewQuote")}
                variant="primary"
              />
            </div>
          </div>

          {/* Row 2: Customer (Mobile Row 2) */}
          <div className="crm-toolbar-row">
            <div className="crm-customer-filter">
              <CustomDropdown
                value={selectedCustomerName}
                onChange={(value) => setSelectedCustomerName(value as string)}
                options={customerOptions}
                placeholder="Filter by Customer"
                showClear={!!selectedCustomerName}
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
              field: "QuoteNo",
              header: "Quote No",
              width: "150px",
              renderBody: (row: any) => (
                <div
                  className="truncate-text"
                  title={row.QuoteNo}
                  style={{ color: "#0f763c", fontWeight: "bold" }}
                >
                  {row.QuoteNo}
                </div>
              ),
            },
            {
              field: "Created",
              header: "Date",
              width: "120px",
              renderBody: (row: any) => (
                <div className="truncate-text" title={fmt(row.Created)}>
                  {fmt(row.Created)}
                </div>
              ),
            },
            {
              field: "CustomerDisplayname",
              header: "Customer Name",
              width: "200px",
              renderBody: (row: any) => (
                <div className="truncate-text" title={row.CustomerDisplayname}>
                  {row.CustomerDisplayname}
                </div>
              ),
            },
            {
              field: "Status",
              header: "Status",
              width: "130px",
              renderBody: (row: any) => (
                <div
                  style={{
                    padding: "4px 12px",
                    borderRadius: "50px", // Rounded pill look as per screenshot
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textAlign: "center",
                    ...getStatusStyles(row.Status),
                  }}
                >
                  {row.Status || "—"}
                </div>
              ),
            },
            {
              field: "Author",
              header: "Created By",
              width: "200px",
              renderBody: (row: any) => {
                const name = row.Author?.Title || "Unknown";
                const email = row.Author?.EMail;
                const avatarUrl = email
                  ? `${props.context?.pageContext?.web?.absoluteUrl || ""}/_layouts/15/userphoto.aspx?size=S&accountname=${email}`
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
                    <span className="truncate-text" title={name}>
                      {name}
                    </span>
                  </div>
                );
              },
            },
            {
              field: "Action",
              header: "Action",
              width: "120px",
              renderBody: (row: any) => (
                <div
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <i
                    className="pi pi-sync action-icon-smooth"
                    title="Sync Quote"
                    onClick={() => handleSync(row)}
                  ></i>
                  <i
                    className="pi pi-pencil action-icon-smooth"
                    title="Edit Quote"
                    onClick={() => handleEdit(row)}
                  ></i>
                  <i
                    className="pi pi-eye action-icon-smooth"
                    title="View Quote"
                    onClick={() => handleView(row)}
                  ></i>
                </div>
              ),
            },
          ]}
        />
      </div>

      <div className="card-view">
        <QuotesCardList
          data={filteredItems}
          onView={handleView}
          onEdit={handleEdit}
          onSync={handleSync}
        />
      </div>
    </div>
  );
};

export default Quotes;
