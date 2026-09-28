import React from "react";
import CashBookReport from "@/components/finance/CashBookReport";

export default function StoreBankBook() {
  const storeId = Number(localStorage.getItem("currentStoreId") || 0);

  return (
    <CashBookReport
      mode="store"
      bookType="bank"
      storeId={storeId}
      title="Store Bank Book"
      subtitle="Track bank-side inflows and outflows for this store, including bank sale receipts, cash-to-bank deposits, and bank receipt movements."
    />
  );
}
