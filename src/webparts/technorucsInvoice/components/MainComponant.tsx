import React, { useEffect, useMemo, useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import SidebarNavigation from "./Common/Navigation/SidebarNavigation";
import {
  GetSPChoices,
  SPReadItems,
  SPUpdateItem,
} from "./CommonServices/SpService";
import { CircularProgress } from "@mui/material";
import { LISTNAMES } from "../Config/Config";
import "../assets/CSS/style.css";
import CustomDataTable from "./Common/DataTable/CustomDataTable";
import CustomerCardList from "./Pages/Customer/CustomerCardList";
import CustomerForm from "./Pages/Customer/CustomerForm";
import Invoice from "./Pages/Invoice/Invoice";
import Quotes from "./Pages/Quotes/Quotes";
import "./MainComponant.scss";
import CustomButton from "./Common/DataTable/Button/CustomButton";
import CustomInputBox from "./Common/DataTable/InputBox/CustomInputBox";
import CustomDropdown from "./Common/DataTable/Dropdown/CustomDropdown";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../assets/CSS/customToast.css";
import logoImg from "../assets/images/technorucslogo.png";
import {
  CreateCustomerZoho,
  UpdateCustomerZoho,
} from "./CommonServices/zohoService";

// Fields searched by the text box
const SEARCH_FIELDS = [
  "Customerdisplayname",
  "GSTTreatment",
  "Currency",
  "Emailaddress",
  "Firstname",
  "Lastname",
  "ProjectManager",
];

// ─────────────────────────────────────────────────────────────────────────────
// CustomerPage — lives INSIDE the router so useNavigate is available
// ─────────────────────────────────────────────────────────────────────────────
const CustomerPage: any = (props: any) => {
  const navigate = useNavigate();

  const [items, setItems] = useState<any[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [view, setView] = useState<
    "list" | "new-customer" | "view-customer" | "Edit-customer"
  >("list");
  const [searchText, setSearchText] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [openMenu, setOpenMenu] = useState<{
    row: any;
    x: number;
    y: number;
  } | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await SPReadItems(
        LISTNAMES.Customer,
        [
          "*",
          "Author/Title",
          "Editor/Title",
          "ProjectManager/Title",
          "ProjectManager/EMail",
          "PMDetails/Title",
          "PMDetails/EMail",
        ],
        ["Author", "Editor", "ProjectManager", "PMDetails"],
      );
      console.log("Fetchdata", data);
      setItems(data);
    } catch (error) {
      console.error("Error fetching list items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearchText("");
    setSelectedCountry("");
    setSelectedCurrency("");
    void loadData();
  };

  useEffect(() => {
    const loadChoices = async () => {
      try {
        const data = await GetSPChoices(LISTNAMES.Customer, "Currency");
        setCurrencyOptions([{ label: "All Currencies", value: "" }, ...data]);
      } catch (error) {
        console.error("Error fetching Currency choices:", error);
      }
      try {
        const countryData = await GetSPChoices(
          LISTNAMES.Customer,
          "Country_x002f_Region",
        );
        setCountryOptions([
          { label: "All Countries", value: "" },
          ...countryData,
        ]);
      } catch (error) {
        console.error("Error fetching Country choices:", error);
      }
    };

    void loadData();
    void loadChoices();
  }, []);

  // ── Derived filtered list
  const filteredItems = useMemo(() => {
    let result = items;

    if (selectedCurrency) {
      result = result.filter((item) => item.Currency === selectedCurrency);
    }
    if (selectedCountry) {
      result = result.filter(
        (item) => item.Country_x002f_Region === selectedCountry,
      );
    }

    const term = searchText.trim().toLowerCase();
    if (term) {
      result = result.filter((item) =>
        SEARCH_FIELDS.some((field) => {
          const val =
            field === "ProjectManager"
              ? (item.ProjectManager?.Title ?? "")
              : item[field];
          return String(val ?? "")
            .toLowerCase()
            .includes(term);
        }),
      );
    }

    return result;
  }, [items, searchText, selectedCurrency, selectedCountry]);

  if (loading) {
    return <CircularProgress />;
  }

  const handleView = (row: any) => {
    setSelectedCustomer(row);
    setView("view-customer");
  };

  const handleEdit = (row: any) => {
    setSelectedCustomer(row);
    setView("Edit-customer");
  };

  const generatejson = (data: any) => {
    const paymentText = data.PaymentTerm;
    const paymentNumber = paymentText.match(/\d+/)?.[0];
    let Josndata = {
      contact_name: data.Customerdisplayname,
      company_name: data.Companyname,
      contact_type: "customer",
      customer_sub_type: "business",
      contact_persons: [
        {
          salutation: data.Salutation,
          first_name: data.Firstname,
          last_name: data.Lastname,
          email: data.Emailaddress,
          phone: data.Phone,
          mobile: data.Phone,
          is_primary_contact: true,
        },
      ],
      phone: data.Phone,
      mobile: data.Phone,
      website: "www.google.com",
      notes: data.Remarks,
      payment_terms: paymentNumber,
      payment_terms_label: data.PaymentTerm,
      currency_code: data.Currency.split("-")[0].trim(),
      billing_address: {
        attention: data.Attention,
        address: data.Address1,
        street2: data.Address2,
        city: data.City,
        state: data.State,
        zip: data.ZipCode,
        country: data.Country_x002f_Region,
        phone: data.Phone,
      },
      shipping_address: {
        attention: data.shippingAttention,
        address: data.shippingAddress1,
        street2: data.shippingAddress2,
        city: data.shippingCity,
        state: data.shippingState,
        zip: data.shippingZipCode,
        country: data.shippingCountry_x002f_Region,
        phone: data.shippingPhone,
      },
    };
    return Josndata;
  };

  const handleSync = async (row: any) => {
    debugger;
    const GenerateJson = await generatejson(row);
    console.log(GenerateJson);
    debugger;

    if (row.ZohoCustomerID) {
      await UpdateCustomerZoho(props.context, row.ZohoCustomerID, GenerateJson)
        .then(() => {
          toast.success("Customer Updated Successfully!");
          debugger;
        })
        .catch(() => {
          toast.error("Failed to Update Customer!");
          debugger;
        });
      debugger;
    } else {
      await CreateCustomerZoho(props.context, GenerateJson)
        .then((result) => {
          console.log(result);
          debugger;
          console.log("Zoho Customer ID: " + result.contact.contact_id);
          debugger;
          SPUpdateItem(LISTNAMES.Customer, row.ID, {
            ZohoCustomerID: result.contact.contact_id,
          })
            .then((res) => {
              console.log(res);
              debugger;
            })
            .catch((error) => {
              console.error(error);
              debugger;
            });
          debugger;
        })
        .catch((error) => {
          console.error(error);
          debugger;
        });
      debugger;
    }
  };

  // ── Determine content ──
  if (view === "new-customer") {
    return (
      <CustomerForm
        context={props.context}
        mode="new-customer"
        onCancel={() => setView("list")}
      />
    );
  } else if (view === "view-customer") {
    return (
      <CustomerForm
        context={props.context}
        initialData={selectedCustomer}
        mode="view"
        onCancel={() => {
          setSelectedCustomer(null);
          setView("list");
        }}
      />
    );
  } else if (view === "Edit-customer") {
    return (
      <CustomerForm
        context={props.context}
        initialData={selectedCustomer}
        mode="edit"
        onCancel={() => {
          setSelectedCustomer(null);
          setView("list");
        }}
      />
    );
  }

  return (
    <>
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
          {/* Row 1: Search, Refresh, Add Customer */}
          <div className="crm-toolbar-row">
            <div className="crm-toolbar-search">
              <CustomInputBox
                value={searchText}
                onChange={(value) => setSearchText((value as string) || "")}
                placeholder="Search customers..."
                iconLeft="pi pi-search"
                iconRight={searchText ? "pi pi-times" : undefined}
                onIconRightClick={() => setSearchText("")}
              />
            </div>

            <div className="crm-refresh-btn">
              <button
                className="crm-action-btn-square"
                onClick={handleRefresh}
                title="Refresh Data"
              >
                <i className="pi pi-sync" onClick={handleRefresh} />
              </button>
            </div>

            <div className="crm-new-btn-wrapper">
              <CustomButton
                label="New"
                icon="pi pi-plus"
                onClick={() => setView("new-customer")}
                variant="primary"
              />
            </div>
          </div>

          {/* Row 2: Country, Currency */}
          <div className="crm-toolbar-row">
            <div className="crm-country-filter">
              <CustomDropdown
                value={selectedCountry}
                onChange={(value) => setSelectedCountry(value as string)}
                options={countryOptions}
                placeholder="Country"
                showClear={!!selectedCountry}
                filter={true}
              />
            </div>

            <div className="crm-currency-filter">
              <CustomDropdown
                value={selectedCurrency}
                onChange={(value) => setSelectedCurrency(value as string)}
                options={currencyOptions}
                placeholder="Currency"
                showClear={!!selectedCurrency}
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
              field: "Customerdisplayname",
              header: "Customer11",
              width: "200px",
              renderBody: (row: any) => (
                <div
                  className="truncate-text"
                  title={row.Customerdisplayname}
                  style={{ color: "#0f763c", fontWeight: "bold" }}
                >
                  {row.Customerdisplayname}
                </div>
              ),
            },
            {
              field: "GSTTreatment",
              header: "GST treatment",
              width: "200px",
              renderBody: (row: any) => (
                <span className="truncate-text" title={row.GSTTreatment}>
                  {row.GSTTreatment}
                </span>
              ),
            },
            {
              field: "Currency",
              header: "Currency",
              width: "200px",
              renderBody: (row: any) => (
                <span className="truncate-text" title={row.Currency}>
                  {row.Currency}
                </span>
              ),
            },
            {
              field: "Emailaddress",
              header: "Email",
              width: "200px",
              renderBody: (row: any) => (
                <span className="truncate-text" title={row.Emailaddress}>
                  {row.Emailaddress}
                </span>
              ),
            },
            {
              field: "ProjectManager",
              header: "Project Manager",
              width: "200px",
              renderBody: (row: any) => (
                <span
                  className="truncate-text"
                  title={row.ProjectManager?.Title}
                >
                  {row.ProjectManager?.Title}
                </span>
              ),
            },
            {
              field: "Action",
              header: "Action",
              width: "150px",
              renderBody: (row: any) => (
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <i
                    className="pi pi-eye action-icon-smooth"
                    title="View Customer"
                    onClick={() => handleView(row)}
                  ></i>
                  <i
                    className="pi pi-pencil action-icon-smooth"
                    title="Edit Customer"
                    onClick={() => handleEdit(row)}
                  ></i>
                  <i
                    className="pi pi-sync action-icon-smooth"
                    title="Sync Customer"
                    onClick={() => handleSync(row)}
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
                        if (openMenu?.row?.ID === row.ID) {
                          setOpenMenu(null);
                        } else {
                          setOpenMenu({
                            row: row,
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
        <CustomerCardList
          data={filteredItems}
          onView={handleView}
          onEdit={handleEdit}
          onSync={handleSync}
          onViewInvoices={(row: any) => {
            navigate("/invoices", { state: { newInvoiceCustomer: row } });
          }}
        />
      </div>

      {/* Action Menu */}
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
                label: "New invoice",
                icon: "pi-file-edit",
                color: "#0ea5e9",
                onClick: () => {
                  // Navigate to /invoices and pass the customer row via router state
                  navigate("/invoices", {
                    state: { newInvoiceCustomer: openMenu.row },
                  });
                },
              },
              {
                label: "Make inactive",
                icon: "pi-minus-circle",
                color: "#e11d48",
                onClick: () =>
                  SPUpdateItem(LISTNAMES.Customer, openMenu.row.ID, {
                    ActiveCustomer: false,
                  }).then(
                    () => {
                      toast.success("Customer made inactive successfully");
                      void loadData();
                    },
                    () => {
                      toast.error("Error making customer inactive");
                    },
                  ),
              },
              {
                label: "Export",
                icon: "pi-download",
                color: "#0f763c",
                onClick: () => console.log("Export clicked for:", openMenu.row),
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
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// InvoicePage wrapper — reads the customer from router location state
// ─────────────────────────────────────────────────────────────────────────────

const InvoicePage: any = (props: any) => {
  const location = useLocation();
  const navigate = useNavigate();
  const newInvoiceCustomer = location.state?.newInvoiceCustomer || null;
  console.log("newInvoiceCustomer: ", newInvoiceCustomer);
  return (
    <Invoice
      context={props.context}
      onBack={() => navigate("/customers")}
      newInvoiceCustomer={newInvoiceCustomer}
      onNewInvoiceCustomerConsumed={() => {
        // Clear state so navigating back and forth doesn't re-trigger
        navigate("/invoices", { replace: true, state: {} });
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MainComponent — owns the router
// ─────────────────────────────────────────────────────────────────────────────
const MainComponent: any = (props: any) => {
  console.log("context", props.context);

  return (
    <HashRouter>
      <SidebarNavigation>
        <Routes>
          <Route path="/" element={<Navigate to="/customers" replace />} />
          <Route
            path="/customers"
            element={<CustomerPage context={props.context} />}
          />
          <Route
            path="/invoices"
            element={<InvoicePage context={props.context} />}
          />
          <Route path="/quotes" element={<Quotes context={props.context} />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
        />
      </SidebarNavigation>
    </HashRouter>
  );
};

export default MainComponent;
