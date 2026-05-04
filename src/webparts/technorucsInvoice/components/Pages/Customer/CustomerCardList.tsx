import React from "react";
import stylesUntyped from "./CustomerCard.module.scss";
const styles: Record<string, string> = stylesUntyped as unknown as Record<string, string>;
// import "primeicons/primeicons.css";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onView?: (item: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEdit?: (item: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSync?: (item: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onViewInvoices?: (item: any) => void;
}

const CustomerCardList: React.FC<Props> = ({
  data,
  onView,
  onEdit,
  onSync,
  onViewInvoices,
}) => {
  return (
    <div className={styles.cardContainer}>
      {data.length === 0 ? (
        <div className={styles.noDataFound}>
          <i className="pi pi-search-plus" style={{ fontSize: "2rem", color: "#94a3b8", marginBottom: "12px" }}></i>
          <p style={{ margin: 0, fontWeight: "600", color: "#64748b" }}>No data found</p>
        </div>
      ) : (
        data.map((item) => (
          <div key={item.Id} className={styles.card}>
            {/* Header with Human Symbol and Green Name */}
            <div className={styles.header}>
              <div className={styles.titleWrapper}>
                <div className={styles.humanSymbol}>
                  <i className="pi pi-user"></i>
                </div>
                <h3>
                  {item.Firstname} {item.Lastname}
                </h3>
              </div>
              <span className={styles.status}>{item.Status || "DRAFT"}</span>
            </div>

            <div className={styles.body}>
              {/* Email Section */}
              <div className={styles.fullWidthInfo}>
                <div className={styles.label}>
                  <i className="pi pi-envelope"></i> EMAIL
                </div>
                <div className={styles.value}>{item.Emailaddress}</div>
              </div>

              {/* Grid for details */}
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.label}>
                    <i className="pi pi-briefcase"></i> MANAGER
                  </div>
                  <div className={styles.value}>
                    {item.ProjectManager?.Title || "Unassigned"}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.label}>
                    <i className="pi pi-map-marker"></i> COUNTRY
                  </div>
                  <div className={styles.value}>
                    {item.Country_x002f_Region || "India"}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.label}>
                    <i className="pi pi-money-bill"></i> CURRENCY
                  </div>
                  <div className={styles.value}>
                    {item.Currency?.split("-")[0] || "INR"}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.label}>
                    <i className="pi pi-calendar"></i> UPDATED
                  </div>
                  <div className={styles.value}>
                    {item.Modified
                      ? new Date(item.Modified).toLocaleDateString()
                      : "Just now"}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className={styles.actions}>
              <button type="button" onClick={() => onView?.(item)}>
                <i className="pi pi-eye"></i> View
              </button>
              <button type="button" onClick={() => onEdit?.(item)}>
                <i className="pi pi-pencil"></i> Edit
              </button>

              <button
                type="button"
                className={styles.syncBtn}
                onClick={() => onSync?.(item)}
              >
                <i className="pi pi-sync"></i> Sync
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CustomerCardList;
