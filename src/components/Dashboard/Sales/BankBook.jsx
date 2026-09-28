import React from "react";
import CashBookReport from "@/components/finance/CashBookReport";

export default function BankBook({ stores = [] }) {
  return (
    <CashBookReport
      mode="admin"
      bookType="bank"
      stores={stores}
      title="All Stores Bank Book"
      subtitle="Use one report to monitor bank-side movements across all accessible stores."
    />
  );
}
