import React from "react";
import { InputText, InputTextProps } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import "./CustomInputBox.css";

interface CustomInputBoxProps extends Omit<InputTextProps, "onChange" | "value"> {
  label?: string;
  value?: string | number | undefined | null;
  onChange: (value: string | number | undefined | null) => void;
  iconLeft?: string; // PrimeIcons class e.g. "pi pi-search"
  iconRight?: string; // PrimeIcons class e.g. "pi pi-times"
  onIconRightClick?: () => void;
  error?: string;
  required?: boolean;
  width?: string;
}

const CustomInputBox: React.FC<CustomInputBoxProps> = ({
  label,
  value,
  onChange,
  iconLeft,
  iconRight,
  onIconRightClick,
  error,
  required = false,
  disabled = false,
  placeholder,
  type = "text",
  id,
  name,
  width,
  className,
  ...rest
}) => {
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, "-");

  const wrapperClass = classNames(
    "p-input-icon-left-right-wrapper",
    { "p-input-icon-left": !!iconLeft },
    { "p-input-icon-right": !!iconRight },
  );

  return (
    <div
      className={`cib-wrapper${disabled ? " cib-disabled" : ""}`}
      style={width ? { width } : undefined}
    >
      {label && (
        <label className="cib-label" htmlFor={inputId}>
          {label}
          {required && <span className="cib-required"> *</span>}
        </label>
      )}

      <span className={wrapperClass}>
        {iconLeft && <i className={iconLeft} />}

        <InputText
          id={inputId}
          name={name}
          type={type}
          value={value === null || value === undefined ? "" : String(value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={classNames(
            "cib-input",
            { "p-invalid": !!error },
            className,
          )}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        />

        {iconRight && (
          <i
            className={classNames(iconRight, {
              "cib-icon-clickable": !!onIconRightClick,
            })}
            onClick={onIconRightClick}
          />
        )}
      </span>
      {error && <small className="p-error cib-error-msg">{error}</small>}
    </div>
  );
};

export default CustomInputBox;
