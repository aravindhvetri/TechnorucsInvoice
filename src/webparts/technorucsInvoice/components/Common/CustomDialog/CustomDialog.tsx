import * as React from "react";
import { Dialog, DialogProps } from "primereact/dialog";
import "./CustomDialog.css";

interface CustomDialogProps extends DialogProps {
  onSave?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  showFooter?: boolean;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  visible,
  onHide,
  header,
  children,
  onSave,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  showFooter = true,
  style,
  className,
  ...props
}) => {
  const footerContent = showFooter ? (
    <div className="custom-dialog-footer">
      <button className="dialog-save-btn" onClick={onSave}>
        {saveLabel}
      </button>
      <button className="dialog-cancel-btn" onClick={onHide}>
        {cancelLabel}
      </button>
    </div>
  ) : null;

  return (
    <Dialog
      header={
        <div className="custom-dialog-header">
          <span className="custom-dialog-title">{header}</span>
        </div>
      }
      visible={visible}
      onHide={onHide}
      footer={footerContent}
      style={{ width: "380px", maxWidth: "90vw", ...style }}
      className={`custom-themed-dialog ${className || ""}`}
      closable={true}
      draggable={false}
      resizable={false}
      modal
      {...props}
    >
      <div className="custom-dialog-content">{children}</div>
    </Dialog>
  );
};

export default CustomDialog;
