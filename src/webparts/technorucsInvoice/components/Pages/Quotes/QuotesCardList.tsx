import React from "react";
import styles from "./Quotes.module.scss";

const fmt = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB");
};

const getStatusStyles = (status: string) => {
  const s = status?.toLowerCase() || "";
  if (s === "approved" || s === "accepted" || s === "added in zoho") {
    return { background: "#f0fdf4", color: "#166534", border: "1px solid #dcfce7" };
  }
  if (s === "pending" || s === "sent") {
    return { background: "#fffbeb", color: "#92400e", border: "1px solid #fef3c7" };
  }
  if (s === "rejected" || s === "cancelled" || s === "declined") {
    return { background: "#fef2f2", color: "#991b1b", border: "1px solid #fee2e2" };
  }
  return { background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" };
};

interface QuotesCardListProps {
  data: any[];
  onView: (row: any) => void;
  onEdit: (row: any) => void;
  onSync: (row: any) => void;
}

const QuotesCardList: React.FC<QuotesCardListProps> = ({
  data,
  onView,
  onEdit,
  onSync,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={styles.noDataFound}>
        <i className="pi pi-search-plus" style={{ fontSize: "2rem", color: "#94a3b8", marginBottom: "12px" }}></i>
        <p style={{ margin: 0, fontWeight: "600", color: "#64748b" }}>No quotes found</p>
      </div>
    );
  }

  return (
    <div className={styles.cardContainer}>
      {data.map((row, index) => {
        const creatorName = row.Author?.Title || "Unknown";
        return (
          <div key={index} className={styles.card}>
            <div className={styles.header}>
              <div className={styles.titleWrapper}>
                <div className={styles.quoteIcon}>
                  <i className="pi pi-file-o"></i>
                </div>
                <h3 className={styles.quoteNo}>{row.QuoteNo || "—"}</h3>
              </div>
              <div
                className={styles.statusBadge}
                style={getStatusStyles(row.Status)}
              >
                {row.Status || "DRAFT"}
              </div>
            </div>

            <div className={styles.body}>
              <div className={styles.customerSection}>
                <div className={styles.label}>Customer Name</div>
                <div className={styles.value}>{row.CustomerDisplayname || "—"}</div>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.label}><i className="pi pi-calendar"></i> Date</div>
                  <div className={styles.value}>{fmt(row.Created)}</div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.label}><i className="pi pi-globe"></i> Country</div>
                  <div className={styles.value}>{row.Country_x002f_Region || "—"}</div>
                </div>
              </div>

              <div className={styles.creatorSection}>
                <div className={styles.avatar}>{creatorName.charAt(0).toUpperCase()}</div>
                <div className={styles.name}>{creatorName}</div>
              </div>
            </div>

            <div className={styles.actions}>
              <button onClick={() => onView(row)} title="View Quote">
                <i className="pi pi-eye"></i> View
              </button>
              <button onClick={() => onEdit(row)} title="Edit Quote">
                <i className="pi pi-pencil"></i> Edit
              </button>
              <button 
                onClick={() => onSync(row)} 
                title="Sync Quote"
                className={styles.primaryBtn}
              >
                <i className="pi pi-sync"></i> Sync
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuotesCardList;
