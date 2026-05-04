import { Currency } from "../../../constants/Currency";
import { ValidationSchema } from "../../Common/Utils/Validation";

export const customerValidationSchema: ValidationSchema<any> = {
  Firstname: { required: true, message: "First Name is required" },
  Lastname: { required: true, message: "Last Name is required" },
  Companyname: { required: true, message: "Company Name is required" },
  Customerdisplayname: { required: true, message: "Display Name is required" },
  Emailaddress: {
    required: true,
    pattern: /^\S+@\S+\.\S+$/,
    message: "Valid email is required",
  },
  PMDetailsId: {
    required: true,
    message: "Project Manager is required",
  },
  GSTTreatment: {
    required: true,
    message: "GST Treatment is required",
  },
  GSTnumber: {
    required: (data: any) =>
      data.GSTTreatment ===
      "Registered Business - Regular Business that is registered under GST",
    message: "GST Number is required",
  },
  Currency: {
    required: true,
    message: "Currency is required",
  },
  PaymentTerm: {
    required: true,
    message: "Payment Terms is required",
  },
  Country_x002f_Region: {
    required: true,
    message: "Country/Region is required",
  },
  Address1: {
    required: true,
    message: "Address is required",
  },
  // BillingCity:{
  //   required:true,message:"City is required"
  // },
  // BillingState:{
  //   required:true,message:"State is required"
  // },
  // BillingZipcode:{
  //   required:true,message:"Zip Code is required"
  // }
};

export const contactPersonValidationSchema: ValidationSchema<any> = {
  Salutation: { required: true, message: "Salutation is required" },
  FirstName: { required: true, message: "First Name is required" },
  LastName: { required: true, message: "Last Name is required" },
  EmailAddress: {
    required: true,
    pattern: /^\S+@\S+\.\S+$/,
    message: "Valid email is required",
  },
};

