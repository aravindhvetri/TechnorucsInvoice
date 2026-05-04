import * as React from "react";
import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "./CustomDataTable.css";

interface IProps {
  data: any[];
  columns: IColumn[];
}

interface IColumn {
  field: string;
  header: string;
  width: string;

  renderBody: (row: any) => React.ReactNode;
}

const CustomDataTable = (props: IProps) => {
  const { data, columns } = props;

  return (
    <div
      style={{
        height: "calc(100vh - 100px)",
        width: "100%",
        paddingBottom: "30px",
      }}
    >
      <DataTable
        value={data}
        paginator={data.length !== 0}
        rows={8}
        scrollable
        scrollHeight="500px"
        className="custom-table"
        tableStyle={{ minWidth: "1150px" }}
        emptyMessage={
          <div style={{ textAlign: "center", padding: "40px" }}>
            <i className="pi pi-search-plus" style={{ fontSize: "2rem", color: "#94a3b8", marginBottom: "12px" }}></i>
            <p style={{ margin: 0, fontWeight: "600", color: "#64748b" }}>No data found</p>
          </div>
        }
      >
        {columns.map((col: IColumn) => (
          <Column
            key={col.field}
            field={col.field}
            header={col.header}
            style={{
              width: col.width,
              minWidth: col.width,
              maxWidth: col.width,
            }}
            body={(row) => col.renderBody(row)}
          />
        ))}
      </DataTable>
    </div>
  );
};

export default CustomDataTable;
