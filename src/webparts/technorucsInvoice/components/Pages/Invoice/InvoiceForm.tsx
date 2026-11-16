import React, { useEffect, useState } from "react";
import stylesUntyped from "./InvoiceForm.module.scss";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styles: any = stylesUntyped;

import CustomInputBox from "../../Common/DataTable/InputBox/CustomInputBox";
import CustomDropdown from "../../Common/DataTable/Dropdown/CustomDropdown";
import CustomButton from "../../Common/DataTable/Button/CustomButton";
import CustomDatePicker from "../../Common/DataTable/DatePicker/CustomDatePicker";
import {
  SPGetItemsFilter,
  SPReadItems,
  GetSPChoices,
  SPCreateItem,
  SPUpdateItem,
  SpGetItemByID,
} from "../../CommonServices/SpService";
import { validateInvoice } from "./InvoiceValidation";
import { LISTNAMES } from "../../../Config/Config";
import { log, sp } from "@pnp/pnpjs";
import { toast } from "react-toastify";
// import { Subject } from "@mui/icons-material";

interface InvoiceFormProps {
  onCancel?: () => void;
  onSave?: (data: any) => void;
  initialData?: any;
  mode?: "view" | "edit" | "create";
  context?: any;
}

interface ItemDetails {
  isNew: boolean;
  SNo: number;
  isDelete: boolean;
  TempID: number;
  id: number;
  mergeId?: number;
  ItemDeatils: string;
  Quantity: number;
  Rate: number;
  Amount: number;
  Tax: string;
  HSN: string;
}
interface IAttachment {
  FileName: string;
  ServerRelativeUrl: string;
  FileContent: Blob;
  isNew: boolean;
  isDelete: boolean;
}

interface IUser {
  email: string;
  id: number;
  username: string;
  isChecked: boolean;
}

interface IInvoiceData {
  CustomerDisplayName: string;
  InvoiceNumber: string;
  Invoice: string;
  InvoiceDate: Date;
  Terms: string;
  DueDate: Date;
  Subject: string;
  Department: string;
  Currency: string;
  Subtotal: string;
  IsUpdated: boolean;
  TaxableValue: string;
  TotalTax: string;
  Total: string;
  CustomerNotes: string;
  TermsAndConditions: string;
  Email: { FirstName: string; isChecked: boolean }[];
  Status: string;
  Financialyear: string;
  CEOProjectManagerId: IUser;
  ProjectManagersId: IUser[];
  paymentoptionPaypal: boolean;
}

const TaxOptions = [
  { label: "IGST0 [0%]", value: "0" },
  { label: "IGST5 [5%]", value: "5" },
  { label: "IGST12 [12%]", value: "12" },
  { label: "IGST18 [18%]", value: "18" },
  { label: "IGST28 [28%]", value: "28" },
];

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  onCancel,
  onSave,
  initialData,
  mode,
}) => {
  console.log("initialDatinfinrce", initialData);
  const [currentFinYear, setCurrentFinYear] = useState<string>("");
  const [customerID, setcustomerID] = useState<string>("");
  const [invoiceForm, setInvoiceForm] = useState<IInvoiceData>({
    CustomerDisplayName:
      initialData?.CustomerDisplayname ||
      initialData?.Customerdisplayname ||
      "",
    InvoiceNumber: initialData?.Invoice,
    Invoice: initialData?.Invoice || "",
    InvoiceDate:
      initialData?.InvoiceDate || new Date().toISOString().split("T")[0],
    Terms: initialData?.Terms || "",
    DueDate: initialData?.Due_x0020_Date || "",
    Subject: initialData?.Subject || "Technorucs Invoice",
    Department: initialData?.Department || "",
    Currency: initialData?.Currency || "",
    Subtotal: initialData?.Subtotal || "",
    TaxableValue: initialData?.TaxableValue || "",
    TotalTax: initialData?.TotalTax || "",
    Total: initialData?.Total || "",
    CustomerNotes:
      initialData?.CustomerNotes ||
      "Thank You for your Support.We truly appreciate your business and look forward to serving you again ",
    TermsAndConditions: initialData?.Terms_x0026_condition || "",
    Email: initialData?.Email || [],
    Status: initialData?.Status || "",
    Financialyear: initialData?.Financialyear || "",
    CEOProjectManagerId: {
      id: initialData?.CEOProjectManagerId?.[0] || "",
      email: initialData?.CEOProjectManagerId?.[0] || "",
      username: initialData?.CEOProjectManagerId?.[0] || "",
      isChecked: false,
    },
    IsUpdated: initialData?.IsUpdated || false,
    ProjectManagersId: initialData?.ProjectManagersId || [],
    paymentoptionPaypal: initialData?.paymentoptionPaypal || false,
  });

  const [itemDetails, setItemDetails] = useState<ItemDetails[]>([]);
  const [attachments, setAttachments] = useState<IAttachment[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [itemOptions, setItemOptions] = useState<any[]>([]);
  const [termsOptions, setTermsOptions] = useState<any[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [addressType, setAddressType] = useState<"billing" | "shipping">(
    "billing",
  );
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean;
    tempId: number | null;
  }>({ visible: false, tempId: null });

  // ── Calculations ──
  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    itemDetails.forEach((item) => {
      if (!item.isDelete) {
        const amount = (item.Quantity || 0) * (item.Rate || 0);
        const taxRate = parseFloat(item.Tax) || 0;
        subtotal += amount;
        totalTax += amount * (taxRate / 100);
      }
    });
    return { subtotal, totalTax, total: subtotal + totalTax };
  };

  const { subtotal, totalTax, total } = calculateTotals();

  const calculateDueDate = (invoiceDateStr: string, termLabel: string) => {
    if (!invoiceDateStr) return invoiceDateStr;
    const dateObj = new Date(invoiceDateStr);
    if (isNaN(dateObj.getTime())) return invoiceDateStr;

    let daysToAdd = 0;
    if (termLabel) {
      const match = termLabel.match(/Net\s*(\d+)/i);
      if (match && match[1]) {
        daysToAdd = parseInt(match[1], 10);
      } else if (termLabel.toLowerCase().includes("receipt")) {
        daysToAdd = 0;
      }
    }

    if (daysToAdd > 0) {
      dateObj.setDate(dateObj.getDate() + daysToAdd);
    }
    return dateObj.toISOString().split("T")[0];
  };

  const handleDateOrTermChange = (
    dateVal: any,
    termStr: string,
    depStr: string,
  ) => {
    let dateStr = "";
    if (dateVal instanceof Date) {
      // Need to adjust for local timezone when getting date string
      const offset = dateVal.getTimezoneOffset() * 60000;
      dateStr = new Date(dateVal.getTime() - offset)
        .toISOString()
        .split("T")[0];
    } else if (typeof dateVal === "string") {
      dateStr = dateVal;
    } else if (dateVal) {
      dateStr = dateVal.toString();
    }

    const newDueDate = calculateDueDate(dateStr, termStr);
    setInvoiceForm((prev: any) => ({
      ...prev,
      InvoiceDate: dateStr,
      Terms: termStr,
      DueDate: newDueDate,
      Department: depStr,
    }));
  };

  // ── Line item handlers ──
  const addNewItem = () => {
    setItemDetails((prev) => [
      ...prev,
      {
        isNew: true,
        SNo: itemDetails.filter((item) => !item.isDelete).length + 1,
        isDelete: false,
        TempID: Date.now(),
        id: 0,
        ItemDeatils: "",
        Quantity: 1,
        Rate: 0,
        Amount: 0,
        Tax: "0",
        HSN: "998314",
      },
    ]);
  };

  const updateItem = (TempID: number, field: keyof ItemDetails, value: any) => {
    setItemDetails((prev) =>
      prev.map((item) => {
        if (item.TempID === TempID) {
          const updated = { ...item, [field]: value };
          if (field === "Quantity" || field === "Rate") {
            updated.Amount = (updated.Quantity || 0) * (updated.Rate || 0);
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

  const generateInvoicejson = async (
    invoiceItem: IInvoiceData,
    currentSubtotal: number,
    currentTotalTax: number,
    currentTotal: number,
  ) => {
    console.log("invoiceItem", invoiceItem);
    debugger;
    let newInvoiceNumber: string = "";

    let ceoId: number = invoiceItem?.CEOProjectManagerId?.id;

    if (mode === "create") {
      const LastInvoiceNumber = await SPReadItems(
        LISTNAMES.InvoiceNo,
        ["*"],
        [],
      );
      console.log("LastInvoiceNumber", LastInvoiceNumber[0].Title);
      const currentInvoice = LastInvoiceNumber[0].Title;

      const parts = currentInvoice.split("/");
      const lastValue = parseInt(parts[parts.length - 1], 10) + 1;

      newInvoiceNumber = `${parts[0]}/${parts[1]}/${lastValue}`;
    }

    let res = {
      InvoiceName: invoiceItem?.InvoiceNumber,
      Status:
        mode === "create"
          ? "Draft"
          : invoiceItem?.Status === "Added in Zoho"
            ? "Edited"
            : invoiceItem?.Status,
      Subject: invoiceItem?.Subject || "",
      Department: invoiceItem?.Department || "",
      Currency: invoiceItem?.Currency || "",
      Invoice:
        mode === "create" ? newInvoiceNumber : invoiceItem?.InvoiceNumber || "",
      InvoiceDate: invoiceItem?.InvoiceDate || null,
      Terms: invoiceItem?.Terms || "",
      Due_x0020_Date: invoiceItem?.DueDate || null,
      CustomerDisplayname: invoiceItem?.CustomerDisplayName || "",
      Email: Array.isArray(invoiceItem?.Email)
        ? invoiceItem.Email.filter((e) => e.isChecked)
            .map((e) => e.FirstName)
            .join(";")
        : invoiceItem?.Email || "",
      CEOProjectManagerId: { results: [ceoId] },
      ProjectManagersId: {
        results: (invoiceItem?.ProjectManagersId || [])
          .filter((user: any) => user.isChecked)
          .map((user: any) => user.spID || user.id || user.Id),
      },
      Subtotal: (currentSubtotal ? currentSubtotal : 0).toFixed(2),
      TaxableValue: (() => {
        if (invoiceItem?.Currency === "INR- Indian Rupee") {
          return currentSubtotal ? currentSubtotal.toFixed(2) : "0.00";
        } else {
          return "0.00";
        }
      })(),
      TaxTotal: (currentTotalTax ? currentTotalTax : 0).toFixed(2),
      Total: (currentTotal ? currentTotal : 0).toFixed(2),
      CustomerNotes: invoiceItem?.CustomerNotes || "",
      Terms_x0026_condition: invoiceItem?.TermsAndConditions || "",
      IsUpdated: mode === "create" ? false : true,
      Financialyear:
        mode === "create" ? currentFinYear : invoiceItem?.Financialyear || "",
      paymentoptionPaypal: invoiceItem?.paymentoptionPaypal || false,
    };

    debugger;
    return res;
  };

  const generateItemDetailsjson = (itemDetails: any[], invoiceID: number) => {
    return itemDetails.map((item) => ({
      mergeId: invoiceID,
      ItemDeatils: item?.ItemDeatils || "",
      Quantity: item?.Quantity.toString() || "",
      Rate: item?.Rate.toString() || "",
      Amount: (item?.Amount || 0).toFixed(2),
      Tax: item?.Tax.toString() || "0",
      HSN: item?.HSN.toString() || "998314",
    }));
  };
  // Save to SP
  const SaveToSP = async (
    currentSubtotal: number,
    currentTotalTax: number,
    currentTotal: number,
  ) => {
    const json = await generateInvoicejson(
      invoiceForm,
      currentSubtotal,
      currentTotalTax,
      currentTotal,
    );

    if (mode === "create") {
      const result = await SPCreateItem(LISTNAMES.Invoice, json);
      const invoiceID = result?.data?.ID || result?.ID;

      //   const parts = invoiceForm.Invoice.split("/");
      // const lastValue = parseInt(parts[parts.length - 1], 10) + 1;

      // const newInvoiceNumber = `${parts[0]}/${parts[1]}/${lastValue}`;

      const LastInvoiceNo = await SPReadItems(LISTNAMES.InvoiceNo, [], []);

      const LastInvoieNoID = LastInvoiceNo?.[0]?.ID || LastInvoiceNo?.[0]?.Id;
      debugger;
      if (LastInvoieNoID) {
        const UpdateInvoiceNO = await SPUpdateItem(
          LISTNAMES.InvoiceNo,
          LastInvoieNoID,
          { Title: invoiceForm?.Invoice },
        );
      }
      debugger;
      console.log("result", result);

      // Upload Attachments
      if (attachments && attachments.length > 0) {
        const newAttachments = attachments.filter(
          (file) => !file.isDelete && file.isNew,
        );

        debugger;
        for (const file of newAttachments) {
          try {
            await sp.web.lists
              .getByTitle(LISTNAMES.Invoice)
              .items.getById(invoiceID)
              .attachmentFiles.add(file.FileName, file.FileContent);
          } catch (err) {
            console.error("Error uploading attachment:", file.FileName, err);
          }
        }
      }

      const activeItems = itemDetails.filter((item) => !item.isDelete);
      debugger;
      const itemDetailsJson = generateItemDetailsjson(activeItems, invoiceID);
      debugger;
      for (const item of itemDetailsJson) {
        try {
          await SPCreateItem(LISTNAMES.ItemDetails, item);
        } catch (err) {
          console.error("Error creating item detail:", err);
        }
      }
      console.log("itemDetails saved successfully");
    } else {
      const updateinvoice = await SPUpdateItem(
        LISTNAMES.Invoice,
        initialData.Id,
        json,
      );
      // const invoiceID = result?.data?.ID || result?.ID;
      console.log("updateinvoice", updateinvoice);
    }
  };

  const handleCustomerChange = async (val: string | number, custData: any) => {
    let _customerID = null;
    let _tempcustData = custData;
    debugger;
    const found = _tempcustData.find(
      (c: any) => c.Customerdisplayname === val.toString(),
    );

    if (found) {
      _customerID = found.Id;
      setSelectedCustomer(found);
      debugger;
      const PMDetails = found.PMDetails.map((pm: any) => {
        return {
          FirstName: pm.Title,
          Email: pm.EMail,
          Id: pm.Id,
          isChecked: false,
        };
      });
      debugger;
      console.log("PMDetails", PMDetails);

      const initialPMIds = initialData?.ProjectManagersId || [];

      const updatedPMDetails = PMDetails.map((pm: any) => {
        const isSelected = initialPMIds.some((id: any) => id === pm.Id);
        return {
          ...pm,
          isChecked: isSelected,
        };
      });
      debugger;

      console.log("invoiceformafterProjectManager", invoiceForm);
      const getCustomerContactPersons = async () => {
        try {
          const contactPersons = await SPGetItemsFilter(
            LISTNAMES.Contactperson,
            ["*"],
            [],
            `mergeId eq ${found.Id}`,
          );

          let contactPersonsData: any[] = contactPersons.map((c: any) => {
            return {
              FirstName: c.FirstName,
              Email: c.Email,
              isChecked: false,
            };
          });
          if (contactPersonsData?.length === 0) {
            contactPersonsData = [
              {
                FirstName: found.Customerdisplayname,
                Email: found.Email,
                isChecked: false,
              },
            ];
          }

          return contactPersonsData;
        } catch (err) {
          console.error("Error fetching contact persons", err);
          return [];
        }
      };

      const contactPersonsData = await getCustomerContactPersons();

      const CeoMail = "Chandru@chandrudemo.onmicrosoft.com";
      const res = await sp.web.ensureUser(CeoMail);

      setInvoiceForm((prev: any) => {
        const firstRecord = prev.CEOProjectManagerId?.id;
        const isMatched = firstRecord === res.data.Id;
        const ceoUserDetails: IUser = {
          email: res.data.Email || CeoMail,
          id: res.data.Id,
          username: res.data.Title,
          isChecked: isMatched,
        };

        return {
          ...prev,
          ProjectManagersId:
            updatedPMDetails?.length > 0 ? updatedPMDetails : [],
          Email: contactPersonsData,
          CEOProjectManagerId: ceoUserDetails,
          CustomerDisplayName: val.toString(),
          Currency: found?.Currency || "",
        };
      });
      setcustomerID(_customerID);
    } else {
      const CeoMail = "Chandru@chandrudemo.onmicrosoft.com";
      const res = await sp.web.ensureUser(CeoMail);

      setInvoiceForm((prev: any) => {
        const firstRecord = prev.CEOProjectManagerId?.id;
        const isMatched = firstRecord === res.data.Id;
        const ceoUserDetails: IUser = {
          email: res.data.Email || CeoMail,
          id: res.data.Id,
          username: res.data.Title,
          isChecked: isMatched,
        };

        return {
          ...prev,
          CEOProjectManagerId: ceoUserDetails,
          CustomerDisplayName: val.toString(),
        };
      });
    }

    console.log("invoiceForm invoice Form", invoiceForm);
  };

  // ── Data Loading ──
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      let tempCustomers = [] as any;

      const custData = await SPReadItems(
        LISTNAMES.Customer,
        ["*", "PMDetails/Title", "PMDetails/EMail", "PMDetails/Id"],
        ["PMDetails"],
      );
      setCustomers(custData);
      tempCustomers = custData; // ← make available in both create and edit paths

      try {
        if (mode === "create") {
          //Set invoice no
          const LastInvoiceNumber = await SPReadItems(
            LISTNAMES.InvoiceNo,
            ["*"],
            [],
          );
          console.log("LastInvoiceNumber", LastInvoiceNumber[0].Title);
          const currentInvoice = LastInvoiceNumber[0].Title;

          const parts = currentInvoice.split("/");
          const lastPart = parts[parts.length - 1];
          const lastValue = parseInt(parts[parts.length - 1], 10) + 1;
          const paddedValue = String(lastValue).padStart(lastPart.length, "0");
          const newInvoiceNumber = `${parts[0]}/${parts[1]}/${paddedValue}`;

          let ceoUserDetails: any = null;

          try {
            const CeoMail = "Chandru@chandrudemo.onmicrosoft.com";
            const res = await sp.web.ensureUser(CeoMail);

            const isMatched =
              invoiceForm.CEOProjectManagerId?.id === res.data.Id;

            ceoUserDetails = {
              email: res.data.Email || CeoMail,
              id: res.data.Id,
              username: res.data.Title,
              isChecked: isMatched,
            };

            console.log("Ensured CEO User:", ceoUserDetails);
          } catch (e) {
            console.error("Error ensuring CEO user:", e);
          }

          const currentDate = new Date();
          const currentMonth = currentDate.getMonth() + 1;
          const currentYear = currentDate.getFullYear();
          let varFinYear = "";
          if (currentMonth < 4) {
            varFinYear = `${(currentYear - 1).toString().slice(-2)}-${currentYear.toString().slice(-2)}`;
          } else {
            varFinYear = `${currentYear.toString().slice(-2)}-${(currentYear + 1).toString().slice(-2)}`;
          }
          setCurrentFinYear(varFinYear);

          const updatedForm = {
            ...invoiceForm,
            Invoice: newInvoiceNumber,
            InvoiceNumber: newInvoiceNumber,
            CEOProjectManagerId: ceoUserDetails
              ? ceoUserDetails
              : { id: "", email: "", username: "", isChecked: false },
          };
          setInvoiceForm(updatedForm);
        }

        console.log("invoiceForm", invoiceForm);
        //Get customer details

        const itemData = await SPReadItems(LISTNAMES.ItemDetails, ["*"], []);
        setItemOptions(
          itemData.map((i: any) => ({
            label: i.Title || i.ItemDeatils || "No Name",
            value: i.Title || i.ItemDeatils || "No Name",
            raw: i,
          })),
        );

        try {
          const termsData = await GetSPChoices(LISTNAMES.Invoice, "Terms");
          setTermsOptions(termsData);
          const departmentsData = await GetSPChoices(
            LISTNAMES.Invoice,
            "Department",
          );
          setDepartmentOptions(departmentsData);
        } catch (err) {
          console.warn("Failed to fetch Terms choices", err);
        }
        debugger;
        if (initialData?.Id) {
          const items = await SPGetItemsFilter(
            LISTNAMES.ItemDetails,
            ["*"],
            [],
            `mergeId eq ${initialData.Id}`,
          );
          setItemDetails(
            items.map((i: any) => ({
              ...i,
              TempID: i.Id,
              isDelete: false,
              isNew: false,
              Amount: (i.Quantity || 0) * (i.Rate || 0),
            })),
          );
          tempCustomers = custData;

          let _attachments: IAttachment[] = await sp.web.lists
            .getByTitle(LISTNAMES.Invoice)
            .items.getById(initialData.Id)
            .attachmentFiles.get();

          const list = sp.web.lists.getByTitle(LISTNAMES.Invoice);
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

          const found = custData.find(
            (c: any) =>
              c.Customerdisplayname === initialData.CustomerDisplayname,
          );
          if (found) {
            setSelectedCustomer(found);
            debugger;
            if (mode === "edit" || mode === "view") {
              const CurrentInvoiceEmail = initialData?.Email || "";

              const _tempEMail = CurrentInvoiceEmail.split(";")
                .filter((name: string) => name.trim() !== "")
                .map((name: string) => ({
                  FirstName: name.trim(),
                }));
              let tempContactPerson: any[] = [];
              try {
                tempContactPerson = await SPGetItemsFilter(
                  LISTNAMES.Contactperson,
                  ["*"],
                  [],
                  `mergeId eq ${found.Id}`,
                );
              } catch (e) {
                tempContactPerson = await SPGetItemsFilter(
                  LISTNAMES.Contactperson,
                  ["*"],
                  [],
                  `mergeId eq ${found.Id}`,
                );
              }
              console.log("TempContactPerson", tempContactPerson);
              console.log("invoiceForm", invoiceForm);

              let finalEmails = tempContactPerson.map((cp) => ({
                FirstName: cp.FirstName,
                isChecked: false,
              }));

              _tempEMail.forEach((email: any) => {
                const _findIndex = finalEmails.findIndex(
                  (e: any) => e.FirstName === email.FirstName,
                );
                if (_findIndex === -1) {
                  finalEmails.push({
                    FirstName: email.FirstName,
                    isChecked: true,
                  });
                } else {
                  finalEmails[_findIndex].isChecked = true;
                }
              });

              finalEmails.push({
                FirstName: initialData.CustomerDisplayname,
                isChecked: false,
              });
              setLoading(false);

              if (mode === "view" || mode === "edit") {
                debugger;
                await handleCustomerChange(
                  initialData?.CustomerDisplayname,
                  tempCustomers,
                );
              }

              setInvoiceForm((prev: any) => ({
                ...prev,
                Email: finalEmails,
              }));
            }
          }
        } else {
          addNewItem();

          // Pre-select customer when opened via "New Invoice" from customer dashboard
          if (initialData?.Customerdisplayname) {
            await handleCustomerChange(
              initialData.Customerdisplayname,
              tempCustomers,
            );
          }
        }
        debugger;
      } catch (e) {
        console.error("Init error", e);
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [initialData]);

  if (loading) return <div className={styles.page}>Loading...</div>;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>
          {initialData ? "Edit Invoice" : "New Invoice"}
        </h2>
        <div className={styles.headerActions}>
          <CustomButton label="Cancel" variant="secondary" onClick={onCancel} />
        </div>
      </div>

      {/* Info Section — unified layout for desktop & mobile */}
      <div className={styles.formCard}>
        <div className={styles.infoGrid}>
          {/* Left: Customer inputs */}
          <div className={styles.infoLeft}>
            <h3 className={styles.formSectionTitle}>Invoice Information</h3>

            {/* Customer Dropdown */}
            <div className={styles.rowFull}>
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  Customer <span className={styles.required}>*</span>
                </div>
                <CustomDropdown
                  value={invoiceForm.CustomerDisplayName}
                  options={customers.map((c) => ({
                    label: c.Customerdisplayname,
                    value: c.Customerdisplayname,
                  }))}
                  disabled={mode === "view" || mode === "edit"}
                  onChange={(val) => handleCustomerChange(val, customers)}
                  placeholder="Select Customer"
                  filter
                />
              </div>
            </div>

            {/* Currency & Invoice # */}
            <div className={styles.rowSplit}>
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>Customer Currency</div>
                <div className={styles.currencyDisplay}>
                  {selectedCustomer?.Currency || "INR - Indian Rupee"}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  Invoice # <span className={styles.required}>*</span>
                </div>
                <CustomInputBox
                  value={invoiceForm.Invoice}
                  onChange={(v: any) =>
                    setInvoiceForm({ ...invoiceForm, Invoice: v })
                  }
                  disabled={true}
                />
              </div>
            </div>

            {/* Subject,Department */}
            <div className={styles.rowSplit}>
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>Subject</div>
                <CustomInputBox
                  value={invoiceForm.Subject}
                  onChange={(v: any) =>
                    setInvoiceForm({ ...invoiceForm, Subject: v })
                  }
                />
              </div>
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  Department <span className={styles.required}>*</span>
                </div>
                <CustomDropdown
                  value={invoiceForm.Department}
                  options={departmentOptions}
                  onChange={(v: any) =>
                    handleDateOrTermChange(
                      invoiceForm.InvoiceDate,
                      invoiceForm.Terms,
                      String(v),
                    )
                  }
                  placeholder="Select"
                />
              </div>
            </div>

            {/* Date, Terms, Due Date */}
            <div className={styles.rowThree}>
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  Invoice Date <span className={styles.required}>*</span>
                </div>
                <CustomDatePicker
                  value={invoiceForm.InvoiceDate}
                  onChange={(v: any) =>
                    handleDateOrTermChange(
                      v,
                      invoiceForm.Terms,
                      invoiceForm.Department,
                    )
                  }
                  dateFormat="dd/mm/yy"
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  Terms <span className={styles.required}>*</span>
                </div>
                <CustomDropdown
                  value={invoiceForm.Terms}
                  options={termsOptions}
                  onChange={(v: any) =>
                    handleDateOrTermChange(
                      invoiceForm.InvoiceDate,
                      String(v),
                      invoiceForm.Department,
                    )
                  }
                  placeholder="Select"
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  Due Date <span className={styles.required}>*</span>
                </div>
                <CustomDatePicker
                  value={invoiceForm.DueDate}
                  onChange={(v: any) =>
                    setInvoiceForm({ ...invoiceForm, DueDate: v || null })
                  }
                  dateFormat="dd/mm/yy"
                />
              </div>
            </div>
          </div>

          {/* Right: Address — same block for desktop & mobile */}
          <div className={styles.infoRight}>
            {selectedCustomer ? (
              <div className={styles.addressBox}>
                <div className={styles.addressTabs}>
                  <button
                    className={`${styles.addrTab} ${addressType === "billing" ? styles.activeTab : ""}`}
                    onClick={() => setAddressType("billing")}
                  >
                    Billing Address
                  </button>
                  <button
                    className={`${styles.addrTab} ${addressType === "shipping" ? styles.activeTab : ""}`}
                    onClick={() => setAddressType("shipping")}
                  >
                    Shipping Address
                  </button>
                </div>

                <div className={styles.addressContent}>
                  <div className={styles.custName}>
                    {selectedCustomer.Firstname} {selectedCustomer.Lastname}
                  </div>
                  <div className={styles.addrLine}>
                    {addressType === "billing"
                      ? selectedCustomer.Address1
                      : selectedCustomer.shippingAddress1}
                  </div>
                  <div className={styles.addrLine}>
                    {addressType === "billing"
                      ? selectedCustomer.Address2
                      : selectedCustomer.shippingAddress2}
                  </div>
                  <div className={styles.addrLine}>
                    {addressType === "billing"
                      ? `${selectedCustomer.City || ""}, ${selectedCustomer.State || ""} ${selectedCustomer.ZipCode || ""}`
                      : `${selectedCustomer.shippingCity || ""}, ${selectedCustomer.shippingState || ""} ${selectedCustomer.shippingZipcode || ""}`}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.addressPlaceholder}>
                Select a customer to view address
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Details */}
      <div className={styles.formCard}>
        <div className={styles.lineItemsContainer}>
          <h3 className={styles.lineItemsTitle}>Item Details</h3>
          <div className={styles.lineItemsGrid}>
            {/* Header (Desktop Only) */}
            <div className={`${styles.gridHeader} ${styles.desktopOnly}`}>
              <div className={styles.headerCell}>S.NO</div>
              <div className={styles.headerCell}>ITEM DETAILS</div>
              <div className={styles.headerCell}>HSN/SAC</div>
              <div className={styles.headerCell}>QTY</div>
              <div className={styles.headerCell}>RATE</div>
              <div className={styles.headerCell}>TAX</div>
              <div className={styles.headerCell}>TOTAL</div>
              <div className={styles.headerCell}></div>
            </div>

            {/* Rows */}
            {itemDetails
              .filter((i) => !i.isDelete)
              .map((item, idx) => {
                const taxableVal = (item.Quantity || 0) * (item.Rate || 0);
                const taxPercent = parseFloat(item.Tax) || 0;
                const taxAmt = taxableVal * (taxPercent / 100);
                const rowTotal = taxableVal + taxAmt;

                return (
                  <div key={item.TempID} className={styles.gridRow}>
                    {/* Mobile Row Header */}
                    <div className={styles.mobileRowHeader}>
                      <div className={styles.itemCounter}>
                        <span className={styles.counterPill}>{idx + 1}</span>
                        <span>Item Row</span>
                      </div>
                      {mode !== "view" && (
                        <button
                          type="button"
                          className={styles.deleteBtnModern}
                          onClick={(e) => {
                            e.preventDefault();
                            setDeleteConfirm({
                              visible: true,
                              tempId: item.TempID,
                            });
                          }}
                          title="Delete Item"
                        >
                          <i className="pi pi-trash" />
                        </button>
                      )}
                    </div>

                    {/* 1. S.No (Desktop Only) */}
                    <div className={`${styles.rowCell} ${styles.desktopOnly}`}>
                      <span style={{ fontWeight: 700 }}>{idx + 1}</span>
                    </div>

                    {/* 2. Item Details */}
                    <div className={styles.rowCell}>
                      <label className={styles.mobileCellLabel}>
                        ITEM DETAILS
                      </label>
                      <CustomInputBox
                        value={item.ItemDeatils}
                        onChange={(v) =>
                          updateItem(item.TempID, "ItemDeatils", v)
                        }
                        placeholder="Type or click to select an item..."
                        disabled={mode === "view"}
                      />
                    </div>

                    {/* 3. HSN/SAC */}
                    <div className={styles.rowCell}>
                      <label className={styles.mobileCellLabel}>HSN/SAC</label>
                      <CustomInputBox
                        value={item.HSN}
                        onChange={(v) => updateItem(item.TempID, "HSN", v)}
                        disabled={mode === "view"}
                      />
                    </div>

                    {/* Mobile Flex Row: Qty & Rate */}
                    <div className={styles.mobileFlexRow}>
                      <div
                        className={`${styles.rowCell} ${styles.mobileFlexItem}`}
                      >
                        <label className={styles.mobileCellLabel}>QTY</label>
                        <CustomInputBox
                          value={item.Quantity.toString()}
                          onChange={(v) =>
                            updateItem(item.TempID, "Quantity", Number(v))
                          }
                          type="number"
                          disabled={mode === "view"}
                        />
                      </div>
                      <div
                        className={`${styles.rowCell} ${styles.mobileFlexItem}`}
                      >
                        <label className={styles.mobileCellLabel}>RATE</label>
                        <CustomInputBox
                          value={item.Rate.toString()}
                          onChange={(v) =>
                            updateItem(item.TempID, "Rate", Number(v))
                          }
                          type="number"
                          disabled={mode === "view"}
                        />
                      </div>
                    </div>

                    {/* 4. Tax */}
                    <div className={styles.rowCell}>
                      <label className={styles.mobileCellLabel}>TAX</label>
                      <CustomDropdown
                        value={item.Tax}
                        options={TaxOptions}
                        onChange={(v) =>
                          updateItem(item.TempID, "Tax", String(v))
                        }
                        placeholder="Select"
                        disabled={mode === "view"}
                      />
                    </div>

                    <div
                      className={`${styles.mobileDivider} ${styles.mobileOnly}`}
                    ></div>

                    {/* 5. Total */}
                    <div className={styles.rowCell}>
                      <label className={styles.mobileCellLabel}>TOTAL</label>
                      <div className={styles.amountPill}>
                        {rowTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    {/* 6. Delete (Desktop Only) */}
                    <div className={`${styles.rowCell} ${styles.desktopOnly}`}>
                      {mode !== "view" && (
                        <button
                          type="button"
                          className={styles.deleteBtnModern}
                          onClick={(e) => {
                            e.preventDefault();
                            setDeleteConfirm({
                              visible: true,
                              tempId: item.TempID,
                            });
                          }}
                          title="Delete Item"
                        >
                          <i className="pi pi-trash" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {mode !== "view" && (
            <button className={styles.addMoreBtn} onClick={addNewItem}>
              <i className="pi pi-plus-circle" /> Add New Row
            </button>
          )}

          {/* Totals Summary */}
          <div className={styles.tableFooterTotals}>
            <table className={styles.totalsTable}>
              <thead>
                <tr>
                  <th>Sub Total</th>
                  <th>Tax Value</th>
                  <th className={styles.greenText}>
                    Total ({invoiceForm.Currency})
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{subtotal.toFixed(2)}</td>
                  <td>{totalTax.toFixed(2)}</td>
                  <td className={styles.totalValHighlight}>
                    {total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Section: Attachments, Notes, CC, Send Options — each in its own card */}
      <div className={styles.bottomGrid}>
        {/* Left Column */}
        <div className={styles.bottomCol}>
          {/* Attachments Card */}
          <div className={styles.sectionCard}>
            <div className={styles.attachmentsHeader}>
              <span className={styles.attachmentsTitle}>
                Attached Files ({attachments.filter((a) => !a.isDelete).length})
              </span>
              <button
                className={styles.addButton}
                onClick={() =>
                  document.getElementById("invoiceFileUpload")?.click()
                }
              >
                Add
              </button>
            </div>
            <div
              className={styles.attachmentsBox}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() =>
                document.getElementById("invoiceFileUpload")?.click()
              }
            >
              <div className={styles.uploadIconWrapper}>
                <i className="pi pi-upload" />
              </div>
              <div className={styles.uploadText}>
                <span className={styles.greenTextBold}>Click to upload</span> or
                drag and drop
              </div>
              <div className={styles.uploadSubtext}>Maximum file size 50MB</div>
              <input
                id="invoiceFileUpload"
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={handleFileChange}
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
                        padding: "10px 12px",
                        background: "#f8fafb",
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
                          style={{ color: "#0f763c", fontSize: "1.2rem" }}
                        />
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "#1e293b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "250px",
                          }}
                        >
                          {file.FileName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
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
                          style={{ fontSize: "1rem" }}
                        />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Customer Notes Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>Customer Notes</div>
            <textarea
              className={styles.notesTextarea}
              value={invoiceForm.CustomerNotes}
              onChange={(e: any) =>
                setInvoiceForm({
                  ...invoiceForm,
                  CustomerNotes: e.target.value,
                })
              }
            />
          </div>

          {/* Terms & Conditions Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>Terms & Conditions</div>
            <textarea
              className={styles.notesTextarea}
              value={invoiceForm.TermsAndConditions}
              onChange={(e: any) =>
                setInvoiceForm({
                  ...invoiceForm,
                  TermsAndConditions: e.target.value,
                })
              }
            />
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.bottomCol}>
          {/* CC To Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>CC To:</div>

            <div className={styles.ccList}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={invoiceForm.CEOProjectManagerId?.isChecked || false}
                  onChange={(e) => {
                    console.log("Clicked:", e.target.checked);
                    console.log("invoiceForm:", invoiceForm);
                    setInvoiceForm((prev) => {
                      const updated = {
                        ...prev,
                        CEOProjectManagerId: {
                          ...prev.CEOProjectManagerId,
                          isChecked: e.target.checked,
                        },
                      };

                      console.log("After:", updated.CEOProjectManagerId);

                      return updated;
                    });
                  }}
                />
                {invoiceForm.CEOProjectManagerId?.username || "-"}
              </label>

              {invoiceForm.ProjectManagersId &&
                Array.isArray(invoiceForm.ProjectManagersId) &&
                invoiceForm.ProjectManagersId.map(
                  (email: any, index: number) => (
                    <label key={index} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={email.isChecked || false}
                        onChange={(e) => {
                          const updatedEmails = [
                            ...invoiceForm.ProjectManagersId,
                          ];
                          updatedEmails[index].isChecked = e.target.checked;
                          setInvoiceForm({
                            ...invoiceForm,
                            ProjectManagersId: updatedEmails,
                          });
                        }}
                      />
                      {email.FirstName}
                    </label>
                  ),
                )}
            </div>
          </div>

          {/* Send Payment Link Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>Send Payment Link</div>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={invoiceForm.paymentoptionPaypal || false}
                onChange={(e) => {
                  setInvoiceForm({
                    ...invoiceForm,
                    paymentoptionPaypal: e.target.checked,
                  });
                }}
              />{" "}
              Paypal
            </label>
          </div>

          {/* Send Invoice Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>Send Invoice To:</div>
            <div className={styles.ccList}>
              {invoiceForm.Email &&
                Array.isArray(invoiceForm.Email) &&
                invoiceForm.Email.map((email: any, index: number) => (
                  <label key={index} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={email.isChecked || false}
                      onChange={(e) => {
                        const updatedEmails = [...invoiceForm.Email];
                        updatedEmails[index].isChecked = e.target.checked;
                        setInvoiceForm({
                          ...invoiceForm,
                          Email: updatedEmails,
                        });
                      }}
                    />
                    {email.FirstName}
                  </label>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.formFooter}>
        <CustomButton label="Cancel" variant="secondary" onClick={onCancel} />
        {/* <CustomButton label="Save as Draft" variant="secondary" /> */}
        {mode !== "view" && (
          <CustomButton
            label={mode === "edit" ? "Update" : "Save"}
            onClick={async () => {
              const isValid = validateInvoice(invoiceForm, itemDetails);
              if (!isValid) return;

              const activeItems = itemDetails.filter((item) => !item.isDelete);
              try {
                await SaveToSP(subtotal, totalTax, total);
                toast.success("Invoice saved successfully!");
                setTimeout(() => {
                  if (onSave) {
                    onSave({
                      ...invoiceForm,
                      itemDetails: activeItems,
                      subtotal,
                      totalTax,
                      total,
                    });
                  } else if (onCancel) {
                    onCancel();
                  }
                }, 1000);
              } catch (error) {
                console.error("Error saving invoice:", error);
                toast.error("Failed to save invoice");
              }
            }}
          />
        )}
      </div>
      {/* ── Delete Confirmation Dialog ── */}
      {deleteConfirm.visible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "32px 28px 24px",
              width: "340px",
              maxWidth: "90vw",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              textAlign: "center",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <i
                className="pi pi-trash"
                style={{ fontSize: "1.4rem", color: "#dc2626" }}
              />
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              Delete Item?
            </h3>
            <p
              style={{
                margin: "0 0 24px",
                fontSize: "0.875rem",
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to delete this item row? This action cannot
              be undone.
            </p>

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  setDeleteConfirm({ visible: false, tempId: null });
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: "8px",
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (deleteConfirm.tempId !== null) {
                    removeItem(deleteConfirm.tempId);
                  }
                  setDeleteConfirm({ visible: false, tempId: null });
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceForm;
