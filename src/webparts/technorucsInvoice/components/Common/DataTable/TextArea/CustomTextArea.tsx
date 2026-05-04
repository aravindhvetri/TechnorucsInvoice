import React from 'react';
import { InputTextarea, InputTextareaProps } from 'primereact/inputtextarea';
import { classNames } from 'primereact/utils';
import './CustomTextArea.css';

interface CustomTextAreaProps extends Omit<InputTextareaProps, 'onChange'> {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
    width?: string;
}

const CustomTextArea: React.FC<CustomTextAreaProps> = ({
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
    rows = 3,
    ...rest
}) => {
    const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className={`cta-wrapper${disabled ? ' cta-disabled' : ''}`} style={width ? { width } : undefined}>
            {label && (
                <label className="cta-label" htmlFor={inputId}>
                    {label}
                    {required && <span className="cta-required"> *</span>}
                </label>
            )}

            <InputTextarea
                id={inputId}
                name={name}
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                rows={rows}
                className={classNames('cta-input', { 'p-invalid': !!error }, className)}
                onChange={(e) => onChange(e.target.value)}
                autoResize={false}
                {...rest}
            />
            {error && <small className="p-error cta-error-msg">{error}</small>}
        </div>
    );
};

export default CustomTextArea;
