import React, { createContext, useContext, useMemo } from "react";

const DivisionContext = createContext();

export const DIVISION_IDS = {
  ALL_DIVISIONS: 1,
};

export const useDivision = () => {
  const ctx = useContext(DivisionContext);
  if (!ctx) {
    return {
      selectedDivision: { id: 1, name: "Anjali Constructions" },
      showAllDivisions: true,
      divisions: [{ id: 1, name: "Anjali Constructions" }],
      selectDivision: () => {},
      clearDivision: () => {},
      loading: false,
      user: null,
    };
  }
  return ctx;
};

export function DivisionProvider({ children }) {
  const value = useMemo(
    () => ({
      selectedDivision: { id: 1, name: "Anjali Constructions" },
      showAllDivisions: true,
      divisions: [{ id: 1, name: "Anjali Constructions" }],
      selectDivision: () => {},
      clearDivision: () => {},
      loading: false,
      user: null,
    }),
    []
  );

  return (
    <DivisionContext.Provider value={value}>
      {children}
    </DivisionContext.Provider>
  );
}

export default DivisionContext;
