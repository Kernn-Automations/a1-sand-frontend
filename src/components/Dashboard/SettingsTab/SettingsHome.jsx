import React from "react";
import styles from "./Settings.module.css";
import { getUserFromStorage, isSuperAdmin } from "../../../utils/roleUtils";

function SettingsHome({ navigate }) {
  const storedUser = getUserFromStorage();
  const user = storedUser?.user || storedUser;
  const showLogsButton = isSuperAdmin(user);

  return (
    <>
      <div className="row m-0 p-3">
        <div className="col">
          <button
            className="homebtn"
            onClick={() => navigate("/settings/warehouse-rules")}
          >
            Warehouse Rules
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/settings/drop-off-rules")}
          >
            Drop-off Rules
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/settings/indent-reverting")}
          >
            Audit, Editing & Credit Policies
          </button>
          {showLogsButton && (
            <button
              className="homebtn"
              onClick={() => navigate("/settings/logs")}
            >
              System Logs
            </button>
          )}
          {/* <button
            className="homebtn"
            onClick={() => navigate("/settings/minimum-order-rules")}
          >
            Minimum Order Qty Rules
          </button> */}
        </div>
      </div>
    </>
  );
}

export default SettingsHome;
