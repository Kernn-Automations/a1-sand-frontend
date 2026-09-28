import React from "react";
import CashBookReport from "@/components/finance/CashBookReport";

export default function StoreCashBook() {
  const storeId = Number(localStorage.getItem("currentStoreId") || 0);

  return (
    <CashBookReport
      mode="store"
      bookType="cash"
      storeId={storeId}
      title="Store Cash Book"
      subtitle="See every cash movement for this store, including sale collections, cash deposits, expenditures, and invoice edit settlements."
    />
  );
}
