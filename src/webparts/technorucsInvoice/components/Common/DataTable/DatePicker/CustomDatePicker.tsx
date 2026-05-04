import React from "react";
import { Calendar, CalendarProps } from "primereact/calendar";
import { classNames } from "primereact/utils";
import "./CustomDatePicker.css";

interface CustomDatePickerProps extends Omit<
  CalendarProps,
  "onChange" | "value"
> {
  label?: string;
  value: Date | null | undefined;
  onChange: (value: Date | null | undefined) => void;
  error?: string;
  required?: boolean;
  width?: string;
  dateFormat?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder,
  id,
  name,
  width,
  className,
  dateFormat = "dd/mm/yy",
  ...rest
}) => {
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, "-");

  // Make sure we pass a Date object to Calendar if value is a string (like YYYY-MM-DD from state)
  let dateValue: Date | null | undefined = null;
  if (value instanceof Date) {
    dateValue = value;
  } else if (typeof value === "string" && value) {
    dateValue = new Date(value);
  } else if (value === null || value === undefined) {
    dateValue = null;
  }

  return (
    <div
      className={`cdp-wrapper${disabled ? " cdp-disabled" : ""}`}
      style={width ? { width } : undefined}
    >
      {label && (
        <label className="cdp-label" htmlFor={inputId}>
          {label}
          {required && <span className="cdp-required"> *</span>}
        </label>
      )}

      <Calendar
        inputId={inputId}
        name={name}
        value={dateValue}
        onChange={(e) => onChange(e.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={classNames("cdp-input", { "p-invalid": !!error }, className)}
        dateFormat={dateFormat}
        showIcon
        {...rest}
      />

      {error && <small className="p-error cdp-error-msg">{error}</small>}
    </div>
  );
};

export default CustomDatePicker;
