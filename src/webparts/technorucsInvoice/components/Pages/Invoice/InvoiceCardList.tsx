import React, { useState, useEffect, useRef } from "react";
import stylesUntyped from "./Invoice.module.scss";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styles: any = stylesUntyped;

interface Props {
  data: any[];
  onView?: (item: any) => void;
  onEdit?: (item: any) => void;
  // onSync?: (item: any) => void;
  onPdf?: (item: any) => void;
  onClone?: (item: any) => void;
  onExport?: (item: any) => void;
  onMailDetails?: (item: any) => void;
}

const InvoiceCardList: React.FC<Props> = ({
  data,
  onView,
  onEdit,

  onPdf,
  onClone,
  onExport,
  onMailDetails,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fmtDate = (iso: string | null | undefined): string => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB");
  };

  const fmtAmount = (
    currency: string,
    amount: number | null | undefined,
  ): string => {
    if (amount == null) return "—";
    return `${currency?.split("-")[0] ?? ""} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const handleAction = (action: () => void) => {
    action();
    setActiveMenuId(null);
  };

  return (
    <div className={styles.cardContainer}>
      {data.length === 0 ? (
        <div className={styles.noDataFound}>
          <i
            className="pi pi-search-plus"
            style={{ fontSize: "2rem", color: "#94a3b8", marginBottom: "12px" }}
          ></i>
          <p style={{ margin: 0, fontWeight: "600", color: "#64748b" }}>
            No data found
          </p>
        </div>
      ) : (
        data.map((item) => (
          <div key={item.Id} className={styles.card}>
            <div className={styles.header}>
              <div className={styles.titleWrapper}>
                <div className={styles.invoiceIcon}>
                  <i className="pi pi-file"></i>
                </div>
                <div>
                  <h3 className={styles.invoiceNo}>{item.Invoice}</h3>
                  <div className={styles.customerName}>
                    {item.CustomerDisplayname}
                  </div>
                </div>
              </div>

              <div className={styles.headerRight}>
                {item.Status && (
                  <span className={styles.statusBadge}>{item.Status}</span>
                )}
                <div
                  className={styles.menuContainer}
                  ref={item.Id === activeMenuId ? menuRef : null}
                >
                  <button
                    type="button"
                    className={styles.ellipsisBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(
                        activeMenuId === item.Id ? null : item.Id,
                      );
                    }}
                  >
                    <i className="pi pi-ellipsis-v"></i>
                  </button>

                  {activeMenuId === item.Id && (
                    <div className={styles.floatingMenu}>
                      <div className={styles.menuDivider}></div>
                      <div
                        className={`${styles.menuItem} ${styles.pdfItem}`}
                        onClick={() => handleAction(() => onPdf?.(item))}
                      >
                        <i className="pi pi-file-pdf"></i> Pdf
                      </div>
                      <div
                        className={`${styles.menuItem} ${styles.cloneItem}`}
                        onClick={() => handleAction(() => onClone?.(item))}
                      >
                        <i className="pi pi-copy"></i> Clone
                      </div>
                      <div
                        className={`${styles.menuItem} ${styles.exportItem}`}
                        onClick={() => handleAction(() => onExport?.(item))}
                      >
                        <i className="pi pi-download"></i> Export
                      </div>
                      <div
                        className={`${styles.menuItem} ${styles.mailItem}`}
                        onClick={() =>
                          handleAction(() => onMailDetails?.(item))
                        }
                      >
                        <i className="pi pi-envelope"></i> Mail Details
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.body}>
              <div className={styles.infoGrid}>
                {/* Row 1: Customer - Amount */}
                <div className={styles.infoItem}>
                  <div className={styles.label}>
                    <i className="pi pi-user"></i> CUSTOMER
                  </div>
                  <div className={styles.value}>{item.CustomerDisplayname}</div>
                </div>
                <div className={`${styles.infoItem} ${styles.textRight}`}>
                  <div className={styles.label}>
                    <i className="pi pi-money-bill"></i> AMOUNT
                  </div>
                  <div className={styles.value}>
                    {fmtAmount(item.Currency, item.FinalAmount)}
                  </div>
                </div>

                {/* Row 2: Payment Status - Due Date */}
                <div className={styles.infoItem}>
                  <div className={styles.label}>
                    <i className="pi pi-credit-card"></i> PAYMENT
                  </div>
                  <div
                    className={`${styles.paymentBadge} ${
                      item.PaymentStatus?.toLowerCase() === "paid"
                        ? styles.paymentPaid
                        : styles.paymentPending
                    }`}
                  >
                    <span className={styles.dot}></span>
                    {item.PaymentStatus || "PENDING"}
                  </div>
                </div>
                <div className={`${styles.infoItem} ${styles.textRight}`}>
                  <div className={styles.label}>
                    <i className="pi pi-calendar"></i> DUE DATE
                  </div>
                  <div className={styles.value}>
                    {fmtDate(item.Due_x0020_Date)}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={() => onView?.(item)}>
                <i className="pi pi-eye"></i> View
              </button>
              <button type="button" onClick={() => onEdit?.(item)}>
                <i className="pi pi-pencil"></i> Edit
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default InvoiceCardList;
