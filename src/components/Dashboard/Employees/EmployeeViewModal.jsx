import React from "react";
import styles from "./Employees.module.css";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import EmployeeModal from "./EmployeeModal";
import { Eye } from "lucide-react";

function EmployeeViewModal({ employee }) {
  return (
    <>
      <DialogRoot placement={"center"} size={"lg"}>
        <DialogTrigger asChild>
          <button 
            className={styles.employeeSecondaryAction} 
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", minHeight: "36px" }}
          >
            <Eye size={14} /> View
          </button>
        </DialogTrigger>
        <DialogContent className="mdl" style={{ borderRadius: "24px", overflow: "hidden", background: "#ffffff", padding: "24px", maxWidth: "680px" }}>
          <DialogBody style={{ padding: 0 }}>
            <EmployeeModal employee={employee} />
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" style={{ top: "20px", right: "20px" }} />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default EmployeeViewModal;
