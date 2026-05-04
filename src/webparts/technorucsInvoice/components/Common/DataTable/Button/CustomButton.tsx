import React, { useRef } from "react";
import { Button, ButtonProps } from "primereact/button";
import { classNames } from "primereact/utils";
import "./CustomButton.css";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface CustomButtonProps extends Omit<ButtonProps, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  label,
  icon,
  iconPos = "left",
  loading = false,
  disabled = false,
  onClick,
  type = "button",
  ...rest
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const buttonClasses = classNames(
    "cb-btn",
    `cb-${variant}`,
    `cb-${size}`,
    { "cb-full-width": fullWidth },
    className,
  );

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !wrapperRef.current) return;
    const wrapper = wrapperRef.current;
    const btn = wrapper.querySelector("button");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    ripple.className = "cb-ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
    onClick?.(e);
  };

  return (
    <div
      ref={wrapperRef}
      className={`cb-btn-wrapper${fullWidth ? " cb-full-width" : ""}`}
    >
      <Button
        type={type}
        label={label}
        icon={icon}
        iconPos={iconPos}
        loading={loading}
        disabled={disabled}
        onClick={handleClick}
        className={buttonClasses}
        {...rest}
      />
    </div>
  );
};

export default CustomButton;
