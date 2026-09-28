import React, { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import ModifyProductForm from "./ModifyProductForm";
import ProductHome from "./ProductHome";

function ModifyProduct({ navigate, isAdmin }) {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const editId = routeId || searchParams.get("edit");
  const [selectedProductId, setSelectedProductId] = useState(editId || null);

  useEffect(() => {
    if (editId) {
      setSelectedProductId(editId);
    }
  }, [editId]);

  const handleBackToList = () => {
    setSelectedProductId(null);
    navigate("/products");
  };

  if (selectedProductId) {
    return (
      <div style={{ padding: "1.5rem", background: "#f8fafc", minHeight: "calc(100vh - 70px)" }}>
        <ModifyProductForm
          onViewClick={handleBackToList}
          productId={selectedProductId}
          isAdmin={isAdmin}
        />
      </div>
    );
  }

  // If no product selected to modify, render the unified Product Catalog
  return <ProductHome navigate={navigate} isAdmin={isAdmin} />;
}

export default ModifyProduct;
