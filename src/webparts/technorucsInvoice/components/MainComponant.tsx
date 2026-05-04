import React, { useEffect, useMemo, useState } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { WebPartContext } from "@microsoft/sp-webpart-base";
import {
  CreateCustomerZoho,
  UpdateCustomerZoho,
} from "./CommonServices/zohoService";
import { log } from "@pnp/pnpjs";

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

const MainComponent: any = (props: any) => {
  console.log("context", props.context);
  const [items, setItems] = useState<any[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [view, setView] = useState<
    "list" | "new-customer" | "view-customer" | "Edit-customer" | "invoice-list"
  >("list");
  const [searchText, setSearchText] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

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
  // ──────────────────────────────────────────────────────────────────────────

  if (loading) {
    return <CircularProgress />;
  }

  // ── Invoice list view ──
  // ── Invoice list view (Moved to Routing) ──
  // if (view === "invoice-list") { ... }

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
          is_primary_contact: true, // ✅ marks this as the main contact
        },
      ],
      // first_name: data.Firstname,
      // last_name: data.Lastname,
      // email: "yogeshm664@gmail.com",
      // email:
      //   data.Firstname.toLowerCase() +
      //   "." +
      //   data.Lastname.toLowerCase() +
      //   "@" +
      //   data.Emailaddress.split("@")[1],
      phone: data.Phone,
      mobile: data.Phone,
      //website: data.WebsiteURL,
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
      const zohoResopose = await UpdateCustomerZoho(
        props.context,
        row.ZohoCustomerID,
        GenerateJson,
      )
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
      const zohoResopose = await CreateCustomerZoho(props.context, GenerateJson)
        .then((result) => {
          console.log(result);
          debugger;
          console.log("Zoho Customer ID: " + result.contact.contact_id);
          debugger;
          const UpdateCusID = SPUpdateItem(LISTNAMES.Customer, row.ID, {
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
      console.log(zohoResopose);
      debugger;
    }
  };
  // Determine what content to show
  let content;
  if (view === "new-customer") {
    content = (
      <CustomerForm
        context={props.context}
        mode="new-customer"
        onCancel={() => setView("list")}
      />
    );
  } else if (view === "view-customer") {
    content = (
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
    content = (
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
  } else {
    content = (
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
            {/* Row 1: Search, Refresh, Add Customer (Left to Right on Mobile Row 1) */}
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

            {/* Row 2: Country, Currency (Left to Right on Mobile Row 2) */}
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
            onViewInvoices={(row) => {
              setSearchText(row.Customerdisplayname);
              setView("invoice-list");
            }}
          />
        </div>
      </>
    );
  }

  return (
    <HashRouter>
      <SidebarNavigation>
        <Routes>
          <Route path="/" element={<Navigate to="/customers" replace />} />
          <Route path="/customers" element={<div>{content}</div>} />
          <Route
            path="/invoices"
            element={<Invoice context={props.context} onBack={() => {}} />}
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
