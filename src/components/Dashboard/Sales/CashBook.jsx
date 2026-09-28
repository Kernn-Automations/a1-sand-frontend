import React from "react";
import CashBookReport from "@/components/finance/CashBookReport";

export default function CashBook({ stores = [] }) {
  return (
    <CashBookReport
      mode="admin"
      bookType="cash"
      stores={stores}
      title="All Stores Cash Book"
      subtitle="Use one finance view to monitor cash collections and cash outflows across every accessible store."
    />
  );
}
