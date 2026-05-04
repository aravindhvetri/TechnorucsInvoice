import React from "react";
import {
  Dropdown,
  DropdownChangeEvent,
  DropdownProps,
} from "primereact/dropdown";
import { classNames } from "primereact/utils";
import "./CustomDropdown.css";

export interface DropdownOption {
  label: string;
  value: string | number;
}

interface CustomDropdownProps extends Omit<
  DropdownProps,
  "onChange" | "options"
> {
  label?: string;
  value: string | number | null;
  onChange: (value: string | number) => void;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
  width?: string;
  error?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  value,
  error,
  onChange,
  options,
  placeholder = "Select",
  required = false,
  disabled = false,
  filter = false,
  showClear = false,
  id,
  name,
  width,
  className,
  ...rest
}) => {
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div
      className={`cdd-wrapper${disabled ? " cdd-disabled" : ""}`}
      style={width ? { width } : undefined}
    >
      {label && (
        <label className="cdd-label" htmlFor={inputId}>
          {label}
          {required && <span className="cdd-required"> *</span>}
        </label>
      )}

      <Dropdown
        inputId={inputId}
        value={value}
        options={options}
        onChange={(e: DropdownChangeEvent) => onChange(e.value)}
        placeholder={placeholder}
        disabled={disabled}
        filter={filter}
        showClear={showClear}
        className={classNames("cdd-dropdown", { "p-invalid": !!error }, className)}
        panelFooterTemplate={rest.panelFooterTemplate}
        {...rest}
      />
      {error && <small className="p-error cdd-error-msg">{error}</small>}
    </div>
  );
};

export default CustomDropdown;
