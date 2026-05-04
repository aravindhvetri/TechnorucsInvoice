// eslint-disable-next-line @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";
import { RadioButton } from "primereact/radiobutton";
import stylesUntyped from "./CustomerForm.module.scss";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styles: any = stylesUntyped;
import CustomInputBox from "../../Common/DataTable/InputBox/CustomInputBox";
import CustomDropdown from "../../Common/DataTable/Dropdown/CustomDropdown";
import CustomButton from "../../Common/DataTable/Button/CustomButton";
import {
  GetSPChoices,
  SPCreateItem,
  SPDeleteItem,
  SpGetItemByID,
  SPGetItemsFilter,
  SPUpdateItem,
  SpUsers,
} from "../../CommonServices/SpService";
import { ADGroups, LISTNAMES } from "../../../Config/Config";
import { country } from "../../../constants/Country";
import { Currency } from "../../../constants/Currency";
// import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

import { azureMembers } from "../../CommonServices/AzureService";
import AppLoader from "../../Common/Loader/Apploader";
import { NormalPeoplePicker } from "@fluentui/react";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { sp } from "@pnp/pnpjs";
import { validate, ValidationErrors } from "../../Common/Utils/Validation";
import {
  customerValidationSchema,
  contactPersonValidationSchema,
} from "./CustomerValidation";
import CustomTextArea from "../../Common/DataTable/TextArea/CustomTextArea";
import { toast } from "react-toastify";
import { sortBy } from "@microsoft/sp-lodash-subset/lib/index";
// import CustomPeoplePicker from "../Common/PeoplePicker/CustomPeoplePicker";
interface CustomerFormProps {
  onCancel?: () => void;
  onSave?: (data: any) => void;
  initialData?: any; // SP list row passed from the dashboard for view/edit
  mode?: "view" | "edit" | "create" | "new-customer";
  context?: any;
}

const salutationOptions = [
  { label: "Mr.", value: "Mr." },
  { label: "Mrs.", value: "Mrs." },
  { label: "Ms.", value: "Ms." },
  { label: "Dr.", value: "Dr." },
];

const defaultCustomerForm = {
  CustomerID: null,
  Customertype: "Business",
  Salutation: "",
  Firstname: "",
  Lastname: "",
  Companyname: "",
  Customerdisplayname: "",
  Emailaddress: "",
  WorkPhone: "",
  Mobile: "",
  Language: "English",
  GSTTreatment: "",
  PAN: "",
  Taxpreference: "",
  Currency: "",
  PaymentTerm: "",
  Designation: "",
  PMDetailsId: [],
  WebsiteURL: "",
  Department: "",
  Twitter: "",
  Facebook: "",
  Skyname_x002f_number: "",
  GSTnumber: "",
  Attention: "",
  Country_x002f_Region: null,
  Address1: "",
  Address2: "",
  City: "",
  State: "",
  ZipCode: "",
  Phone: "",
  Fixnumber: "",
  shippingAttention: "",
  shippingCountry_x002f_Region: "",
  shippingAddress1: "",
  shippingAddress2: "",
  shippingCity: "",
  shippingState: "",
  shippingZipcode: "",
  shippingPhone: "",
  shippingFixnumber: "",
  Remarks: "",
};

const CustomerForm: React.FC<CustomerFormProps> = ({
  onCancel,
  onSave,
  initialData,
  mode,
  context,
}) => {
  const [errors, setErrors] = useState<ValidationErrors<any>>({});
  const [gstTreatmentOptions, setGstTreatmentOptions] = useState<any[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [arrADGroupUsers, setArrADGroupUsers] = useState<any[]>([]);
  const [currency, setCurrency] = useState<string>("");
  const [PaymentTermsOptions, setPaymentTermsOptions] = useState<any[]>([]);
  const [isCurrencyDialogVisible, setIsCurrencyDialogVisible] = useState(false);
  const [newCurrencyCode, setNewCurrencyCode] = useState("");
  const [newCurrencyName, setNewCurrencyName] = useState("");
  const [customerForm, setCustomerForm] = useState<any>(defaultCustomerForm);
  const [loader, setLoader] = useState(true);
  const [AzureMembers, setAzureMembers] = useState<IUser[]>([]);
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
  const [CustomerID, setCustomerID] = useState<number>(0);

  const generateCustomerjson: any = async (customerItem: any) => {
    console.log("customerItem", customerItem);
    debugger;
    let finalCustomerID = customerItem?.CustomerID;
    if (mode === "new-customer") {
      debugger;
      const items = await sp.web.lists
        .getByTitle(LISTNAMES.Customer)
        .items.orderBy("ID", false) // false = descending
        .top(1)();
      const lastId = items.length > 0 ? Number(items[0].CustomerID) : 0;
      setCustomerID(lastId);
      finalCustomerID = String(lastId + 1);
    }
    return {
      CustomerID: finalCustomerID,
      Customertype: customerItem?.Customertype || "Business",
      Salutation: customerItem?.Salutation || "",
      Firstname: customerItem?.Firstname || "",
      Lastname: customerItem?.Lastname || "",
      Companyname: customerItem?.Companyname || "",
      Customerdisplayname: customerItem?.Customerdisplayname || "",
      Emailaddress: customerItem?.Emailaddress || "",
      Customerphone: customerItem?.WorkPhone + ":" + customerItem?.Mobile,
      GSTnumber: customerItem?.GSTnumber || "",
      GSTTreatment: customerItem?.GSTTreatment || "",
      PAN: customerItem?.PAN || "",
      Taxpreference: customerItem?.Taxpreference || "",
      Currency: customerItem?.Currency || "",
      PaymentTerm: customerItem?.PaymentTerm || "",
      Designation: customerItem?.Designation || "",
      PMDetailsId: {
        results: customerItem?.PMDetailsId?.map((user: any) => user.spID),
      },
      WebsiteURL: customerItem?.WebsiteURL || "",
      Department: customerItem?.Department || "",
      Twitter: customerItem?.Twitter || "",
      Facebook: customerItem?.Facebook || "",
      Skyname_x002f_number: customerItem?.Skyname_x002f_number || "",

      Attention: customerItem?.Attention || "",
      Country_x002f_Region: customerItem?.Country_x002f_Region || null,
      Address1: customerItem?.Address1 || "",
      Address2: customerItem?.Address2 || "",
      City: customerItem?.City || "",
      State: customerItem?.State || "",
      ZipCode: customerItem?.ZipCode || "",
      Phone: customerItem?.Phone || "",
      Fixnumber: customerItem?.Fixnumber || "",
      shippingAttention: customerItem?.shippingAttention || "",
      shippingCountry_x002f_Region:
        customerItem?.shippingCountry_x002f_Region || "",
      shippingAddress1: customerItem?.shippingAddress1 || "",
      shippingAddress2: customerItem?.shippingAddress2 || "",
      shippingCity: customerItem?.shippingCity || "",
      shippingState: customerItem?.shippingState || "",
      shippingZipcode: customerItem?.shippingZipcode || "",
      shippingPhone: customerItem?.shippingPhone || "",
      shippingFixnumber: customerItem?.shippingFixnumber || "",
      Remarks: customerItem?.Remarks || "",
    };
  };

  const generateContactPersonjson = (
    contactPersonItems: any[],
    mergeId: any,
  ) => {
    return contactPersonItems
      .map((item: any) => {
        if (item?.isDelete && item?.id) {
          return {
            id: item.id,
            isDelete: true,
            mergeId: mergeId,
            Salutation: item.Salutation || "",
            FirstName: item.FirstName || "",
            LastName: item.LastName || "",
            EmailAddress: item.EmailAddress || "",
            WorkPhone: item.WorkPhone || "",
            Mobile: item.Mobile || "",
          };
        } else if (item.isDelete && !item.id) {
          return null;
        }

        return {
          id: item.id || null, // null for new items
          mergeId: mergeId,
          Salutation: item.Salutation || "",
          FirstName: item.FirstName || "",
          LastName: item.LastName || "",
          EmailAddress: item.EmailAddress || "",
          WorkPhone: item.WorkPhone || "",
          Mobile: item.Mobile || "",
        };
      })
      .filter(Boolean);
  };

  // Copy Billing Address
  const handleCopyBillingAddress = () => {
    setCustomerForm({
      ...customerForm,
      shippingAttention: customerForm?.Attention,
      shippingCountry_x002f_Region: customerForm?.Country_x002f_Region,
      shippingAddress1: customerForm?.Address1,
      shippingAddress2: customerForm?.Address2,
      shippingCity: customerForm?.City,
      shippingState: customerForm?.State,
      shippingZipcode: customerForm?.ZipCode,
      shippingPhone: customerForm?.Phone,
      shippingFixnumber: customerForm?.Fixnumber,
    });
  };

  // ── Contact Persons ──
  interface ContactPerson {
    isDelete: boolean;
    TempID: number;
    id: number | null;
    merge: number;
    Salutation: string;
    FirstName: string;
    LastName: string;
    EmailAddress: string;
    WorkPhone: string;
    Mobile: string;
  }

  interface IUser {
    id: string;
    spID: number | null;
    email: string;
    displayName: string;
  }
  const newContactRow = (): ContactPerson => {
    console.log(contactPersons?.length, "lenght");
    return {
      isDelete: false,
      TempID: contactPersons?.length + 1,
      id: null,
      merge: 0,
      Salutation: "",
      FirstName: "",
      LastName: "",
      EmailAddress: "",
      WorkPhone: "",
      Mobile: "",
    };
  };

  const addContactRow = () =>
    setContactPersons((prev) => [...prev, newContactRow()]);

  const removeContactRow = (TempID: number) =>
    // setContactPersons((prev) => prev.filter((p) => p.TempID !== TempID));
    setContactPersons((prev) =>
      prev.map((p) => (p.TempID === TempID ? { ...p, isDelete: true } : p)),
    );

  const GetUserDetails = (filterText: string, persona: any): any[] => {
    return AzureMembers?.filter((user: any) =>
      user.displayName.toLowerCase().includes(filterText.toLowerCase()),
    );
  };
  const updateContactRow = (
    TempID: number,
    field: keyof ContactPerson,
    value: string,
  ) =>
    setContactPersons((prev) =>
      prev.map((p) => (p.TempID === TempID ? { ...p, [field]: value } : p)),
    );

  // ── Remarks ──
  // const [remarks, setRemarks] = useState("");

  // ── Load SP choices ──

  const getSpItem = async (listName: string, itemId: number): Promise<any> => {
    if (!itemId) return null;

    const item = await SpGetItemByID(listName, itemId, ["*"], []);
    return item;
  };

  useEffect(() => {
    const init = async (): Promise<void> => {
      await Promise.all([
        azureMembers(),
        SpUsers(),
        getSpItem(LISTNAMES.Customer, initialData?.ID),
      ]).then(async ([azureRes, spRes, customerItem]) => {
        if (customerItem !== null) {
          const fetchedData: any = {
            CustomerID: customerItem?.CustomerID || "",
            Customertype: customerItem?.Customertype || "Business",
            Salutation: customerItem?.Salutation || "",
            Firstname: customerItem?.Firstname || "",
            Lastname: customerItem?.Lastname || "",
            Companyname: customerItem?.Companyname || "",
            Customerdisplayname: customerItem?.Customerdisplayname || "",
            Emailaddress: customerItem?.Emailaddress || "",
            WorkPhone: customerItem?.Customerphone?.split(":")[0] || "",
            Mobile: customerItem?.Customerphone?.split(":")[1] || "",
            // Language: "English",
            GSTTreatment: customerItem?.GSTTreatment || "",
            PAN: customerItem?.PAN || "",
            Taxpreference: customerItem?.Taxpreference || "",
            Currency: customerItem?.Currency || "",
            PaymentTerm: customerItem?.PaymentTerm || "",
            Designation: customerItem?.Designation || "",
            PMDetailsId: customerItem?.PMDetailsId || [],
            WebsiteURL: customerItem?.WebsiteURL || "",
            Department: customerItem?.Department || "",
            Twitter: customerItem?.Twitter || "",
            Facebook: customerItem?.Facebook || "",
            Skyname_x002f_number: customerItem?.Skyname_x002f_number || "",
            GSTnumber: customerItem?.GSTnumber || "",

            Attention: customerItem?.Attention || "",
            Country_x002f_Region: customerItem?.Country_x002f_Region || null,
            Address1: customerItem?.Address1 || "",
            Address2: customerItem?.Address2 || "",
            City: customerItem?.City || "",
            State: customerItem?.State || "",
            ZipCode: customerItem?.ZipCode || "",
            Phone: customerItem?.Phone || "",
            Fixnumber: customerItem?.Fixnumber || "",
            shippingAttention: customerItem?.shippingAttention || "",
            shippingCountry_x002f_Region:
              customerItem?.shippingCountry_x002f_Region || "",
            shippingAddress1: customerItem?.shippingAddress1 || "",
            shippingAddress2: customerItem?.shippingAddress2 || "",
            shippingCity: customerItem?.shippingCity || "",
            shippingState: customerItem?.shippingState || "",
            shippingZipcode: customerItem?.shippingZipcode || "",
            shippingPhone: customerItem?.shippingPhone || "",
            shippingFixnumber: customerItem?.shippingFixnumber || "",
            Remarks: customerItem?.Remarks || "",
          };

          setCustomerForm(fetchedData);

          const defaultUsers: IUser[] = await Promise.all(
            (fetchedData?.PMDetailsId || []).map(
              async (spId: number): Promise<IUser> => {
                const spUser = await sp.web.siteUsers.getById(spId)();

                return {
                  id: "",
                  spID: spUser.Id,
                  email: spUser.Email,
                  displayName: spUser.Title,
                };
              },
            ),
          );
          setCustomerForm((prev: any) => ({
            ...prev,
            PMDetailsId: defaultUsers,
          }));
        } else {
          setCustomerForm(defaultCustomerForm);
        }

        const azUsers: IUser[] = await Promise.all(
          azureRes.map(async (user: any): Promise<IUser> => {
            const _spID: number = await sp.web
              .ensureUser(user.secondaryText)
              .then((res) => res.data.Id);

            return {
              id: user.ID,
              spID: _spID,
              email: user.secondaryText,
              displayName: user.text,
            };
          }),
        );

        setAzureMembers(azUsers);
      });

      try {
        const gstOptions = await GetSPChoices(
          LISTNAMES.Customer,
          "GSTTreatment",
        );
        setGstTreatmentOptions(gstOptions);

        const currencyOptions = await GetSPChoices(
          LISTNAMES.Customer,
          "Currency",
        );
        setCurrencyOptions(currencyOptions);

        const paymentOptions = await GetSPChoices(
          LISTNAMES.Customer,
          "PaymentTerm",
        );
        setPaymentTermsOptions(paymentOptions);
        if (mode === "view" || mode === "edit") {
          const contactRes = await SPGetItemsFilter(
            LISTNAMES.Contactperson,
            ["*", "merge/Id"],
            ["merge", "merge/Id"],
            `merge/Id eq ${initialData?.Id}`,
          );

          const contactData: ContactPerson[] = contactRes.map(
            (item: any, index: number) => ({
              TempID: index + 1,
              isDelete: false,
              id: item.Id,
              mergeId: item.mergeId,
              Salutation: item.Salutation || "",
              FirstName: item.FirstName || "",
              LastName: item.LastName || "",
              EmailAddress: item.EmailAddress || "",
              WorkPhone: item.WorkPhone || "",
              Mobile: item.Mobile || "",
              merge: item.merge.Id || null,
            }),
          );

          setContactPersons(contactData);
        }

        setLoader(false);
      } catch (error) {
        console.error("Error loading customer data:", error);
      }
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.ID, mode]);

  const getSelectedPMDetails = (
    AzureMembers: any[],
    selectedUsers: number[],
  ) => {
    return AzureMembers.filter((user: any) =>
      selectedUsers.some((item: any) => item.ID === user.ID),
    );
  };

  const handleAddCurrency = () => {
    // In a real app, you'd save this to the list. For now, we'll adds it to the options.
    const newOption = {
      label: newCurrencyName,
      value: newCurrencyCode,
    };

    setCurrencyOptions([...currencyOptions, newOption]);
    setCustomerForm({ ...customerForm, Currency: newCurrencyCode });
    setIsCurrencyDialogVisible(false);
    setNewCurrencyCode("");
    setNewCurrencyName("");
  };

  const currencyDropdownFooter = (
    <div className={styles.dropdownFooter}>
      <button
        type="button"
        className={styles.addNewBtn}
        onClick={() => setIsCurrencyDialogVisible(true)}
      >
        <i className="pi pi-plus-circle" /> Add new currency
      </button>
    </div>
  );

  const SaveToSP = async () => {
    debugger;
    const mainErrors = validate(customerForm, customerValidationSchema);

    // Validate Contact Persons
    const activeContacts = contactPersons.filter((p) => !p.isDelete);
    const contactErrors: any[] = activeContacts.map((p) =>
      validate(p, contactPersonValidationSchema),
    );
    const hasContactErrors = contactErrors.some(
      (err) => Object.keys(err).length > 0,
    );
    const noContacts = activeContacts.length === 0;

    if (Object.keys(mainErrors).length > 0 || hasContactErrors || noContacts) {
      setErrors({
        ...(mainErrors as any),
        contactPersons: contactErrors,
        contactPersonGeneral: noContacts
          ? "At least one contact person is required"
          : "",
      });

      if (hasContactErrors || noContacts) {
        setActiveIndex(2);
      }
      toast.error("Please fill mandatory fields");
      return;
    }
    setErrors({});

    if (mode === "edit") {
      debugger;
      setLoader(true);
      const json = await generateCustomerjson(customerForm);

      await SPUpdateItem(LISTNAMES.Customer, initialData?.ID, json);

      const customerId = initialData?.ID;

      const contactPersonJson = generateContactPersonjson(
        contactPersons,
        customerId,
      );

      for (const contact of contactPersonJson) {
        if (!contact) continue;
        // Sanitize payload: remove internal logic fields like id and isDelete
        const { id, isDelete, ...payload } = contact;

        if (isDelete) {
          await SPDeleteItem(LISTNAMES.Contactperson, id);
        } else if (id) {
          await SPUpdateItem(LISTNAMES.Contactperson, id, payload);
        } else {
          await SPCreateItem(LISTNAMES.Contactperson, payload);
        }
      }
      setLoader(false);
      toast.success("Customer updated successfully!");
      if (onCancel) onCancel();
    } else {
      setLoader(true);
      debugger;
      const json = await generateCustomerjson(customerForm);
      debugger;
      const customerRes = await SPCreateItem(LISTNAMES.Customer, json);
      const customerId = customerRes?.data?.ID || customerRes?.ID;
      debugger;
      const contactPersonJson = generateContactPersonjson(
        contactPersons,
        customerId,
      );

      for (const contact of contactPersonJson) {
        if (!contact) continue;
        const { id, isDelete, ...payload } = contact;
        await SPCreateItem(LISTNAMES.Contactperson, payload);
      }
      setLoader(false);
      toast.success("Customer created successfully!");
      if (onCancel) onCancel();
    }
  };

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        {mode === "view" ? (
          <h2 className={styles.pageTitle}>Customer Details</h2>
        ) : mode === "edit" ? (
          <h2 className={styles.pageTitle}>Edit Customer</h2>
        ) : (
          <h2 className={styles.pageTitle}>New Customer</h2>
        )}
        <div className={styles.headerActions}>
          <CustomButton
            label="Back"
            variant="secondary"
            onClick={() => onCancel && onCancel()}
          />
        </div>
      </div>

      {/* Form Card */}
      <div className={styles.formCard}>
        {/* Customer Type */}
        <div className={styles.formRow}>
          <label className={styles.rowLabel}>
            Customer Type <span style={{ color: "red" }}>*</span>
          </label>
          <div className={styles.rowControl}>
            <div className={styles.radioGroup}>
              {["Business", "Individual"].map((type) => {
                console.log("type", type);
                console.log("checked", customerForm?.Customertype == type);

                return (
                  <label key={type} className={styles.radioLabel}>
                    <RadioButton
                      inputId={`type-${type}`}
                      value={type}
                      checked={customerForm?.Customertype == type}
                      disabled={mode === "view"}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          Customertype: e.value,
                        })
                      }
                    />
                    <span>{type}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Primary Contact */}
        <div className={styles.formRow}>
          <label className={styles.rowLabel}>
            Primary Contact <span style={{ color: "red" }}>*</span>
          </label>
          <div className={`${styles.rowControl} ${styles.inlineGroup}`}>
            <CustomDropdown
              value={customerForm?.Salutation}
              onChange={(v) =>
                setCustomerForm({ ...customerForm, Salutation: v })
              }
              options={salutationOptions}
              placeholder="Salutation"
              width="130px"
              error={errors.Salutation}
              disabled={mode === "view"}
            />
            <CustomInputBox
              value={customerForm?.Firstname}
              onChange={(v) =>
                setCustomerForm({ ...customerForm, Firstname: v })
              }
              placeholder="First Name"
              error={errors.Firstname}
              disabled={mode === "view"}
            />
            <CustomInputBox
              value={customerForm?.Lastname}
              onChange={(v) =>
                setCustomerForm({ ...customerForm, Lastname: v })
              }
              placeholder="Last Name"
              error={errors.Lastname}
              disabled={mode === "view"}
            />
          </div>
        </div>

        {/* Company Name */}
        <div className={styles.formRow}>
          <label className={styles.rowLabel}>
            Company Name <span style={{ color: "red" }}>*</span>
          </label>
          <div className={styles.rowControl}>
            <CustomInputBox
              value={customerForm?.Companyname}
              onChange={(v) =>
                setCustomerForm({ ...customerForm, Companyname: v })
              }
              disabled={mode === "view"}
              error={errors.Companyname}
            />
          </div>
        </div>

        {/* Display Name* */}
        <div className={styles.formRow}>
          <label className={styles.rowLabel}>
            <label className={styles.rowLabel}>
              Display Name<span style={{ color: "red" }}>*</span>
            </label>
          </label>
          <div className={styles.rowControl}>
            <CustomInputBox
              value={customerForm?.Customerdisplayname}
              onChange={(v) =>
                setCustomerForm({ ...customerForm, Customerdisplayname: v })
              }
              disabled={mode === "view"}
              error={errors.Customerdisplayname}
            />
          </div>
        </div>

        {/* Email Address */}
        <div className={styles.formRow}>
          <label className={styles.rowLabel}>
            Email Address <span style={{ color: "red" }}>*</span>
          </label>
          <div className={styles.rowControl}>
            <CustomInputBox
              value={customerForm?.Emailaddress}
              onChange={(v) =>
                setCustomerForm({ ...customerForm, Emailaddress: v })
              }
              type="email"
              iconLeft="pi pi-envelope"
              error={errors.Emailaddress}
              disabled={mode === "view"}
            />
          </div>
        </div>

        {/* ProjectManager */}
        <div className={styles.formRow}>
          <label className={styles.rowLabel}>
            Project Manager <span style={{ color: "red" }}>*</span>
          </label>
          <div className={styles.rowControl}>
            {/* <CustomADUsersPeoplePicker
              selectedItem={getSelectedPMDetails(
                AzureMembers,
                customerForm?.PMDetailsId,
              )}
              onChange={(v: any) => {
                console.log("v Azure people", v);
                setCustomerForm({
                  ...customerForm,
                  PMDetailsId: v?.map((val: any) => val?.key),
                });
              }}
              disabled={false}
              GetUserDetails={(filterText: string, persona: any) =>
                AzureMembers.filter((val: any) =>
                  val?.displayName
                    ?.toLowerCase()
                    ?.includes(filterText?.toLowerCase()),
                )
              }
            /> */}

            <PeoplePicker
              context={context}
              webAbsoluteUrl={context.pageContext.web.absoluteUrl}
              personSelectionLimit={2}
              groupName={""} // Leave this blank in case you want to filter from all users
              showtooltip={true}
              // required={true}
              // disabled={true}
              ensureUser={true}
              disabled={mode === "view"}
              searchTextLimit={2}
              defaultSelectedUsers={customerForm?.PMDetailsId?.map(
                (val: any) => val?.email,
              )}
              onChange={(people: any) => {
                console.log("people", people);
                setCustomerForm({
                  ...customerForm,
                  PMDetailsId: people.map((p: any) => {
                    return {
                      spID: p.id,
                      email: p?.secondaryText?.toLowerCase(),
                      displayName: p?.text,
                      id: null,
                    };
                  }),
                });
              }}
              // customerForm.PMDetailsId.map((a)=>a.id)
              showHiddenInUI={false}
              principalTypes={[PrincipalType.User]}
              resolveDelay={100}
              // suggestionsLimit={2}
              resultFilter={(people: any) => {
                return people.filter((val: any) =>
                  AzureMembers.some(
                    (item: IUser) =>
                      item.email?.toLowerCase() ===
                      val.secondaryText?.toLowerCase(),
                  ),
                );
              }}
            />
            {errors.PMDetailsId && (
              <div
                style={{
                  color: "#ef4444",
                  fontSize: "0.75rem",
                  marginTop: "4px",
                  fontWeight: 500,
                }}
              >
                {errors.PMDetailsId}
              </div>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className={styles.formRow}>
          <label className={styles.rowLabel}>Phone</label>
          <div className={`${styles.rowControl} ${styles.phoneRow}`}>
            <div className={styles.phoneSet}>
              <CustomInputBox
                value={customerForm?.WorkPhone}
                onChange={(v) =>
                  setCustomerForm({ ...customerForm, WorkPhone: v })
                }
                placeholder="Work Phone"
                disabled={mode === "view"}
              />
            </div>
            <div className={styles.phoneSet}>
              <CustomInputBox
                value={customerForm?.Mobile}
                onChange={(v) =>
                  setCustomerForm({ ...customerForm, Mobile: v })
                }
                placeholder="Mobile"
                disabled={mode === "view"}
              />
            </div>
          </div>
        </div>
        <div className="card">
          {/* ── Step Progress Indicator ── */}
          <div className={styles.stepperContainer}>
            {["Others", "Address", "Contact Person", "Remarks"].map(
              (label, idx) => (
                <React.Fragment key={label}>
                  <div
                    className={styles.stepItem}
                    onClick={() => setActiveIndex(idx)}
                  >
                    <div
                      className={`${styles.stepCircle} ${
                        idx < activeIndex
                          ? styles.stepCompleted
                          : idx === activeIndex
                            ? styles.stepActive
                            : ""
                      }`}
                    >
                      {idx < activeIndex ? (
                        <i className="pi pi-check" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`${styles.stepLabel} ${
                        idx === activeIndex ? styles.stepLabelActive : ""
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div
                      className={`${styles.stepLine} ${
                        idx < activeIndex ? styles.stepLineCompleted : ""
                      }`}
                    />
                  )}
                </React.Fragment>
              ),
            )}
          </div>

          {/* Step Content — rendered based on activeIndex without tab headers */}
          {activeIndex === 0 && (
            <div>
              {/* GST Treatment */}
              <div className={styles.formRow}>
                <label className={styles.rowLabel}>
                  GST Treatment <span style={{ color: "red" }}>*</span>
                </label>
                <div className={styles.rowControl}>
                  <CustomDropdown
                    value={customerForm?.GSTTreatment}
                    onChange={(v) =>
                      setCustomerForm({ ...customerForm, GSTTreatment: v })
                    }
                    options={gstTreatmentOptions}
                    placeholder="Select"
                    error={errors.GSTTreatment}
                    disabled={mode === "view"}
                  />
                </div>
              </div>

              {/* GST Number */}
              <div
                className={styles.formRow}
                style={
                  customerForm?.GSTTreatment !==
                  "Registered Business - Regular Business that is registered under GST"
                    ? { display: "none" }
                    : {}
                }
              >
                <label className={styles.rowLabel}>
                  GST Number <span style={{ color: "red" }}>*</span>
                </label>
                <div className={styles.rowControl}>
                  <CustomInputBox
                    value={customerForm?.GSTnumber}
                    onChange={(v) =>
                      setCustomerForm({ ...customerForm, GSTnumber: v })
                    }
                    placeholder="GST Number"
                    error={errors.GSTnumber}
                    disabled={mode === "view"}
                  />
                </div>
              </div>

              {/* PAN */}
              <div className={styles.formRow}>
                <label className={styles.rowLabel}>PAN</label>
                <div className={styles.rowControl}>
                  <CustomInputBox
                    value={customerForm?.PAN}
                    onChange={(v) =>
                      setCustomerForm({ ...customerForm, PAN: v })
                    }
                    type="PAN"
                    disabled={mode === "view"}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <label className={styles.rowLabel}>Place of supply</label>
                <div className={styles.rowControl}>
                  <CustomDropdown
                    value={customerForm?.gstTreatment}
                    onChange={(v) =>
                      setCustomerForm({ ...customerForm, gstTreatment: v })
                    }
                    options={gstTreatmentOptions}
                    placeholder="Select"
                    disabled={true}
                  />
                </div>
              </div>
              {/* Tax type */}

              <div className={styles.formRow}>
                <label className={styles.rowLabel}>
                  Tax preference <span style={{ color: "red" }}>*</span>
                </label>
                <div className={styles.rowControl}>
                  <div className={styles.radioGroup}>
                    {["Taxable", "Tax Exampt"].map((type) => (
                      <label key={type} className={styles.radioLabel}>
                        <RadioButton
                          inputId={`type-${type}`}
                          value={type}
                          checked={customerForm?.Taxpreference === type}
                          disabled={mode === "view"}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              Taxpreference: e.value,
                            })
                          }
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Currency */}
              <div className={styles.formRow}>
                <label className={styles.rowLabel}>
                  Currency <span style={{ color: "red" }}>*</span>
                </label>
                <div className={styles.rowControl}>
                  <CustomDropdown
                    value={customerForm?.Currency}
                    onChange={(v) =>
                      setCustomerForm({ ...customerForm, Currency: v })
                    }
                    options={currencyOptions}
                    placeholder="Select"
                    panelFooterTemplate={currencyDropdownFooter}
                    error={errors.Currency}
                    disabled={mode === "view"}
                  />
                </div>
              </div>
              {/* Opening Balance */}
              <div className={styles.formRow}>
                <label className={styles.rowLabel}>
                  Opening Balance <span style={{ color: "red" }}>*</span>
                </label>
                <div className={styles.rowControl}>
                  <CustomInputBox
                    value={customerForm?.OpeningBalance}
                    onChange={(v) =>
                      setCustomerForm({ ...customerForm, OpeningBalance: v })
                    }
                    type="Opening Balance"
                    disabled={true}
                    // iconLeft="pi pi-envelope"
                  />
                </div>
              </div>

              {/* Payment Trerms */}
              <div className={styles.formRow}>
                <label className={styles.rowLabel}>
                  Payment Terms <span style={{ color: "red" }}>*</span>
                </label>
                <div className={styles.rowControl}>
                  <CustomDropdown
                    value={customerForm?.PaymentTerm}
                    onChange={(v) =>
                      setCustomerForm({ ...customerForm, PaymentTerm: v })
                    }
                    options={PaymentTermsOptions}
                    placeholder="Select"
                    disabled={mode === "view"}
                    error={errors.PaymentTerm}
                  />
                </div>
              </div>

              {/* Website URL */}
              <div className={styles.formRow}>
                <label className={styles.rowLabel}>Website URL </label>
                <div className={styles.rowControl}>
                  <CustomInputBox
                    value={customerForm?.WebsiteURL}
                    onChange={(v) =>
                      setCustomerForm({ ...customerForm, WebsiteURL: v })
                    }
                    disabled={mode === "view"}
                    type="Website URL"
                    // iconLeft="pi pi-envelope"
                  />
                </div>
              </div>

              {/* Department */}
              <div className={styles.formRow}>
                <label className={styles.rowLabel}>Department </label>
                <div className={styles.rowControl}>
                  <CustomInputBox
                    value={customerForm?.Department}
                    onChange={(v) =>
                      setCustomerForm({ ...customerForm, Department: v })
                    }
                    disabled={mode === "view"}
                    type="Department  "
                    // iconLeft="pi pi-envelope"
                  />
                </div>
              </div>

              {/* Designation */}
              <div className={styles.formRow}>
                <label className={styles.rowLabel}>Designation </label>
                <div className={styles.rowControl}>
                  <CustomInputBox
                    value={customerForm?.Designation}
                    onChange={(v) =>
                      setCustomerForm({ ...customerForm, Designation: v })
                    }
                    disabled={mode === "view"}
                    type="Designation"
                    // iconLeft="pi pi-envelope"
                  />
                </div>
              </div>

              {/* Twitter */}
              <div className={styles.formRow}>
                <label className={styles.rowLabel}>Twitter </label>
                <div className={styles.rowControl}>
                  <CustomInputBox
                    value={customerForm?.Twitter}
                    onChange={(v) =>
                      setCustomerForm({ ...customerForm, Twitter: v })
                    }
                    disabled={mode === "view"}
                    type="Twitter"
                    // iconLeft="pi pi-envelope"
                  />
                </div>
              </div>

              {/* Skype name/number  */}
              <div className={styles.formRow}>
                <label className={styles.rowLabel}>Skype name/number</label>
                <div className={styles.rowControl}>
                  <CustomInputBox
                    value={customerForm?.Skyname_x002f_number}
                    onChange={(v) =>
                      setCustomerForm({
                        ...customerForm,
                        Skyname_x002f_number: v,
                      })
                    }
                    disabled={mode === "view"}
                    type="Skype name/number "
                    // iconLeft="pi pi-envelope"
                  />
                </div>
              </div>

              {/* Facebook  */}
              <div className={styles.formRow}>
                <label className={styles.rowLabel}>Facebook</label>
                <div className={styles.rowControl}>
                  <CustomInputBox
                    value={customerForm?.Facebook}
                    onChange={(v) =>
                      setCustomerForm({ ...customerForm, Facebook: v })
                    }
                    disabled={mode === "view"}
                    type="Facebook"
                    // iconLeft="pi pi-envelope"
                  />
                </div>
              </div>
            </div>
          )}

          {activeIndex === 1 && (
            <div>
              <div className={styles.addressContainer}>
                {/* ── Billing Address ── */}
                <div>
                  <h4 className={styles.addressSectionTitle}>
                    Billing Address
                  </h4>

                  {/* Attention */}
                  <div className={styles.addressRow}>
                    <label className={styles.rowLabel}>Attention</label>
                    <div className={styles.rowControl}>
                      <CustomInputBox
                        disabled={mode === "view"}
                        value={customerForm?.Attention}
                        onChange={(v) =>
                          setCustomerForm({ ...customerForm, Attention: v })
                        }
                        placeholder=""
                      />
                    </div>
                  </div>

                  {/* Country/Region */}
                  <div className={styles.addressRow}>
                    <label className={styles.rowLabel}>
                      Country/Region <span className={styles.required}> *</span>
                    </label>
                    <div className={styles.rowControl}>
                      <CustomDropdown
                        // value={customerForm?.Country_x002f_Region}
                        value={
                          country.find(
                            (item) =>
                              item.value == customerForm?.Country_x002f_Region,
                          )?.value || null
                        }
                        onChange={(v) =>
                          setCustomerForm({
                            ...customerForm,
                            Country_x002f_Region: v,
                          })
                        }
                        options={country}
                        disabled={mode === "view"}
                        placeholder="Select"
                        filter
                      />
                    </div>
                  </div>

                  {/* Address Street 1 */}
                  <div className={styles.addressRow}>
                    <label className={styles.rowLabel}>
                      Address<span className={styles.required}> *</span>
                    </label>
                    <div className={styles.rowControl}>
                      <CustomTextArea
                        value={customerForm?.Address1}
                        onChange={(v) =>
                          setCustomerForm({
                            ...customerForm,
                            Address1: v,
                          })
                        }
                        placeholder="Street 1"
                        rows={2}
                        error={errors.Address1}
                        disabled={mode === "view"}
                      />
                      <CustomTextArea
                        value={customerForm?.Address2}
                        onChange={(v) =>
                          setCustomerForm({
                            ...customerForm,
                            Address2: v,
                          })
                        }
                        placeholder="Street 2"
                        rows={2}
                        disabled={mode === "view"}
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div className={styles.addressRow}>
                    <label className={styles.rowLabel}>
                      City <span className={styles.required}> *</span>
                    </label>
                    <div className={styles.rowControl}>
                      <CustomInputBox
                        value={customerForm?.City}
                        onChange={(v) =>
                          setCustomerForm({ ...customerForm, City: v })
                        }
                        placeholder=""
                        disabled={mode === "view"}
                      />
                    </div>
                  </div>

                  {/* State */}
                  <div className={styles.addressRow}>
                    <label className={styles.rowLabel}>
                      State <span className={styles.required}> *</span>
                    </label>
                    <div className={styles.rowControl}>
                      <CustomInputBox
                        value={customerForm?.State}
                        onChange={(v) =>
                          setCustomerForm({ ...customerForm, State: v })
                        }
                        placeholder=""
                        disabled={mode === "view"}
                      />
                    </div>
                  </div>

                  {/* Pin Code */}
                  <div className={styles.addressRow}>
                    <label className={styles.rowLabel}>
                      Pin Code<span className={styles.required}> *</span>
                    </label>
                    <div className={styles.rowControl}>
                      <CustomInputBox
                        value={customerForm?.ZipCode}
                        onChange={(v) =>
                          setCustomerForm({ ...customerForm, ZipCode: v })
                        }
                        placeholder=""
                        disabled={mode === "view"}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className={styles.addressRow}>
                    <label className={styles.rowLabel}>Phone</label>
                    <div className={`${styles.rowControl} ${styles.phoneRow}`}>
                      <div className={styles.phoneSet}>
                        <CustomInputBox
                          value={customerForm?.Phone}
                          onChange={(v) =>
                            setCustomerForm({ ...customerForm, Phone: v })
                          }
                          placeholder=""
                          type="number"
                          disabled={mode === "view"}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fax Number */}
                  <div className={styles.addressRow}>
                    <label className={styles.rowLabel}>Fax Number</label>
                    <div className={styles.rowControl}>
                      <CustomInputBox
                        value={customerForm?.Fixnumber}
                        onChange={(v) =>
                          setCustomerForm({ ...customerForm, Fixnumber: v })
                        }
                        placeholder=""
                        disabled={mode === "view"}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Shipping Address ── */}
                <div>
                  <h4 className={styles.addressSectionTitle}>
                    Shipping Address{" "}
                    <button
                      type="button"
                      onClick={handleCopyBillingAddress}
                      className={styles.copyBillingBtn}
                    >
                      ({" "}
                      <i
                        className="pi pi-copy"
                        style={{ fontSize: "0.75rem" }}
                      />{" "}
                      Copy billing address )
                    </button>
                  </h4>

                  {/* Attention */}
                  <div className={styles.addressRow}>
                    <label className={styles.rowLabel}>Attention</label>
                    <div className={styles.rowControl}>
                      <CustomInputBox
                        value={customerForm?.shippingAttention}
                        onChange={(v) =>
                          setCustomerForm({
                            ...customerForm,
                            shippingAttention: v,
                          })
                        }
                        disabled={mode === "view"}
                        placeholder=""
                      />
                    </div>
                  </div>

                  {/* Country/Region */}
                  <div className={styles.addressRow}>
                    <label className={styles.rowLabel}>Country/Region</label>
                    <div className={styles.rowControl}>
                      <CustomDropdown
                        value={customerForm?.shippingCountry_x002f_Region}
                        onChange={(v) =>
                          setCustomerForm({
                            ...customerForm,
                            shippingCountry_x002f_Region: v,
                          })
                        }
                        options={country}
                        placeholder="Select"
                        filter
                        error={errors.shippingCountry_x002f_Region}
                        disabled={mode === "view"}
                      />
                    </div>
                  </div>

                  {/* Address Street 1 & 2 */}
                  <div className={styles.addressRow}>
                    <label className={styles.rowLabel}>Address</label>
                    <div className={styles.rowControl}>
                      <CustomTextArea
                        value={customerForm?.shippingAddress1}
                        onChange={(v) =>
                          setCustomerForm({
                            ...customerForm,
                            shippingAddress1: v,
                          })
                        }
                        placeholder="Street 1"
                        rows={2}
                        error={errors.shippingAddress1}
                      />
                      <CustomTextArea
                        value={customerForm?.shippingAddress2}
                        onChange={(v) =>
                          setCustomerForm({
                            ...customerForm,
                            shippingAddress2: v,
                          })
                        }
                        disabled={mode === "view"}
                        placeholder="Street 2"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div className={styles.addressRow}>
                    <label className={styles.rowLabel}>City</label>
                    <div className={styles.rowControl}>
                      <CustomInputBox
                        value={customerForm?.shippingCity}
                        onChange={(v) =>
                          setCustomerForm({ ...customerForm, shippingCity: v })
                        }
                        disabled={mode === "view"}
                        placeholder=""
                        error={errors.BillingCity}
                      />
                    </div>
                  </div>

                  {/* State */}
                  <div className={styles.addressRow}>
                    <label className={styles.rowLabel}>State</label>
                    <div className={styles.rowControl}>
                      <CustomInputBox
                        value={customerForm?.shippingState}
                        onChange={(v) =>
                          setCustomerForm({ ...customerForm, shippingState: v })
                        }
                        disabled={mode === "view"}
                        placeholder=""
                        error={errors.BillingState}
                      />
                    </div>
                  </div>

                  {/* Pin Code */}
                  <div className={styles.addressRow}>
                    <label className={styles.rowLabel}>Pin Code</label>
                    <div className={styles.rowControl}>
                      <CustomInputBox
                        value={customerForm?.shippingZipcode}
                        onChange={(v) =>
                          setCustomerForm({
                            ...customerForm,
                            shippingZipcode: v,
                          })
                        }
                        disabled={mode === "view"}
                        placeholder=""
                        error={errors.BillingZipcode}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div
                    className={styles.formRow}
                    style={{ border: "none", padding: "6px 0" }}
                  >
                    <label className={styles.rowLabel}>Phone</label>
                    <div className={`${styles.rowControl} ${styles.phoneRow}`}>
                      <div className={styles.phoneSet}>
                        <CustomInputBox
                          value={customerForm?.shippingPhone}
                          onChange={(v) =>
                            setCustomerForm({
                              ...customerForm,
                              shippingPhone: v,
                            })
                          }
                          disabled={mode === "view"}
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fax Number */}
                  <div
                    className={styles.formRow}
                    style={{ border: "none", padding: "6px 0" }}
                  >
                    <label className={styles.rowLabel}>Fax Number</label>
                    <div className={styles.rowControl}>
                      <CustomInputBox
                        value={customerForm?.shippingFixnumber}
                        onChange={(v) =>
                          setCustomerForm({
                            ...customerForm,
                            shippingFixnumber: v,
                          })
                        }
                        disabled={mode === "view"}
                        placeholder=""
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeIndex === 2 && (
            <div>
              <div className={styles.contactPersonContainer}>
                {/* Table header */}
                <div
                  className={`${styles.contactGrid} ${styles.contactHeader}`}
                >
                  {[
                    "SALUTATION",
                    "FIRST NAME",
                    "LAST NAME",
                    "EMAIL ADDRESS",
                    "WORK PHONE",
                    "MOBILE",
                    "",
                  ].map((h) => (
                    <span key={h} className={styles.contactHeaderCell}>
                      {h}
                    </span>
                  ))}
                </div>

                {/* Rows */}
                {contactPersons
                  .filter((person) => person.isDelete === false)
                  .map((person, idx) => {
                    const rowError =
                      (errors.contactPersons as any)?.[idx] || {};
                    return (
                      <div
                        key={person.TempID}
                        className={`${styles.contactGrid} ${styles.contactRow}`}
                      >
                        {/* Mobile Card Header */}
                        <div className={styles.mobileRowHeader}>
                          <div className={styles.itemCounter}>
                            <span className={styles.counterPill}>{idx + 1}</span>
                            <span>Contact Person</span>
                          </div>
                          {mode !== "view" && (
                            <button
                              type="button"
                              onClick={() => removeContactRow(person.TempID)}
                              title="Remove contact"
                              className={styles.deleteBtnModern}
                            >
                              <i className="pi pi-trash" />
                            </button>
                          )}
                        </div>

                        {/* Salutation */}
                        <div className={styles.rowCell}>
                          <label className={styles.mobileCellLabel}>
                            SALUTATION
                          </label>
                          <CustomDropdown
                            value={person.Salutation}
                            onChange={(v) =>
                              updateContactRow(
                                person.TempID,
                                "Salutation",
                                v as string,
                              )
                            }
                            options={salutationOptions}
                            placeholder=""
                            error={rowError.Salutation}
                            disabled={mode === "view"}
                          />
                        </div>

                        {/* First Name */}
                        <div className={styles.rowCell}>
                          <label className={styles.mobileCellLabel}>
                            FIRST NAME
                          </label>
                          <CustomInputBox
                            value={person.FirstName}
                            onChange={(v: any) =>
                              updateContactRow(person.TempID, "FirstName", v)
                            }
                            placeholder="First Name"
                            error={rowError.FirstName}
                            disabled={mode === "view"}
                          />
                        </div>

                        {/* Last Name */}
                        <div className={styles.rowCell}>
                          <label className={styles.mobileCellLabel}>
                            LAST NAME
                          </label>
                          <CustomInputBox
                            value={person.LastName}
                            onChange={(v: any) =>
                              updateContactRow(person.TempID, "LastName", v)
                            }
                            placeholder="Last Name"
                            error={rowError.LastName}
                            disabled={mode === "view"}
                          />
                        </div>

                        {/* Email */}
                        <div className={styles.rowCell}>
                          <label className={styles.mobileCellLabel}>
                            EMAIL ADDRESS
                          </label>
                          <CustomInputBox
                            value={person.EmailAddress}
                            onChange={(v: any) =>
                              updateContactRow(person.TempID, "EmailAddress", v)
                            }
                            placeholder="Email Address"
                            type="email"
                            error={rowError.EmailAddress}
                            disabled={mode === "view"}
                          />
                        </div>

                        {/* Work Phone */}
                        <div className={styles.rowCell}>
                          <label className={styles.mobileCellLabel}>
                            WORK PHONE
                          </label>
                          <CustomInputBox
                            value={person.WorkPhone}
                            onChange={(v: any) =>
                              updateContactRow(person.TempID, "WorkPhone", v)
                            }
                            placeholder="Work Phone"
                            disabled={mode === "view"}
                          />
                        </div>

                        {/* Mobile */}
                        <div className={styles.rowCell}>
                          <label className={styles.mobileCellLabel}>
                            MOBILE
                          </label>
                          <CustomInputBox
                            value={person.Mobile}
                            onChange={(v: any) =>
                              updateContactRow(person.TempID, "Mobile", v)
                            }
                            placeholder="Mobile"
                            disabled={mode === "view"}
                          />
                        </div>

                        {/* Delete (Desktop Column) */}
                        <div
                          className={`${styles.rowCell} ${styles.desktopOnly}`}
                        >
                          {mode !== "view" && (
                            <button
                              type="button"
                              onClick={() => removeContactRow(person.TempID)}
                              title="Remove contact"
                              style={{
                                cursor: "pointer",
                                color: "#ef4444",
                                border: "none",
                                background: "none",
                                fontSize: "1.4rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                width: "100%",
                              }}
                            >
                              <i className="pi pi-times-circle" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {/* Add Contact Person */}
                {mode !== "view" && (
                  <button
                    type="button"
                    onClick={addContactRow}
                    className={styles.addContactBtn2}
                  >
                    <i
                      className="pi pi-plus-circle"
                      style={{ fontSize: "0.9rem" }}
                    />
                    Add Contact Person
                  </button>
                )}
              </div>
              {errors.contactPersonGeneral && (
                <div
                  style={{
                    color: "#ef4444",
                    fontSize: "0.85rem",
                    marginTop: "12px",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  <i
                    className="pi pi-exclamation-circle"
                    style={{ marginRight: "6px" }}
                  />
                  {errors.contactPersonGeneral}
                </div>
              )}
            </div>
          )}

          {activeIndex === 3 && (
            <div>
              <div className={styles.remarksContainer}>
                <h4 className={styles.remarksTitle}>
                  Remarks{" "}
                  <span className={styles.remarksSubtitle}>
                    (For Internal Use)
                  </span>
                </h4>
                <CustomTextArea
                  value={customerForm?.Remarks}
                  onChange={(v) =>
                    setCustomerForm({
                      ...customerForm,
                      Remarks: v,
                    })
                  }
                  disabled={mode === "view"}
                  style={{ minHeight: "120px" }}
                />

                {/* Attachments Section */}
                {/* <div
                  className={styles.attachmentSection}
                  style={{ marginTop: "20px" }}
                >
                  <h4 className={styles.remarksTitle}>Attachments</h4>
                  <div className={styles.fileUploadBox}>
                    <input
                      type="file"
                      id="customerAttachments"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => {
                        // Handle file logic
                        console.log("Files selected:", e.target.files);
                      }}
                    />
                    <label
                      htmlFor="customerAttachments"
                      className={styles.uploadLabel}
                    >
                      <i
                        className="pi pi-upload"
                        style={{ marginRight: "8px" }}
                      />
                      Click to upload or drag and drop files here
                    </label>
                  </div>
                </div> */}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className={styles.mobileTabNav}>
            <button
              type="button"
              className={`${styles.mobileTabBtn} ${styles.mobileTabBtnOutline}`}
              onClick={() =>
                activeIndex === 0
                  ? onCancel && onCancel()
                  : setActiveIndex((prev) => prev - 1)
              }
            >
              {activeIndex === 0 ? "Back" : "Previous"}
            </button>
            {activeIndex < 3 ? (
              <button
                type="button"
                className={`${styles.mobileTabBtn} ${styles.mobileTabBtnFilled}`}
                onClick={() => setActiveIndex((prev) => prev + 1)}
              >
                Next
              </button>
            ) : (
              mode !== "view" && (
                <CustomButton
                  label="Save"
                  loading={loader}
                  disabled={loader}
                  onClick={SaveToSP}
                  className={`${styles.mobileTabBtn} ${styles.mobileTabBtnFilled}`}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* New Currency Dialog */}
      <Dialog
        header="New Currency"
        visible={isCurrencyDialogVisible}
        style={{ width: "400px" }}
        onHide={() => setIsCurrencyDialogVisible(false)}
        draggable={false}
        resizable={false}
      >
        <div className={styles.dialogContent}>
          <div className={styles.dialogField}>
            <label className={styles.dialogLabel}>Currency Code*</label>
            <CustomDropdown
              value={newCurrencyCode}
              onChange={(v) => {
                setNewCurrencyCode(v as string);
                const selected = Currency.find((c) => c.value === v);
                if (selected) setNewCurrencyName(selected.label);
              }}
              options={Currency}
              placeholder="Select"
              filter
            />
          </div>
          <div className={styles.dialogFooter}>
            <CustomButton
              label="Save and Select"
              variant="primary"
              onClick={handleAddCurrency}
              disabled={!newCurrencyCode}
            />
            <CustomButton
              label="Cancel"
              variant="secondary"
              onClick={() => setIsCurrencyDialogVisible(false)}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default CustomerForm;

function SPGetItem(Customer: string, ID: any) {
  throw new Error("Function not implemented.");
}
