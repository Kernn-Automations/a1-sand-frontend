import React, { useEffect, useState } from "react";
import styles from "./Employees.module.css";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";

function UpdateEmployee({ employee, setOnUpdate, onTrigger }) {
  const { axiosAPI } = useAuth();
  const [form, setForm] = useState({
    name: employee.name || "",
    employeeId: employee.employeeId || "",
    email: employee.email || "",
    mobile: employee.mobile || "",
    warehouseId: employee.warehouseId || "",
    divisionId: employee.divisionId || employee.division?.id || "",
  });
  const [roles, setRoles] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [zones, setZones] = useState([]);
  const [subZones, setSubZones] = useState([]);
  const [teams, setTeams] = useState([]);
  const [stores, setStores] = useState([]);
  const [hierarchyAssignments, setHierarchyAssignments] = useState({
    zoneId: "",
    subZoneId: "",
    teamId: "",
    storeIds: [],
    assignedStores: [],
  });
  const [selectedRoles, setSelectedRoles] = useState(
    employee.roles?.map((role) => role.id) || [],
  );
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(
    employee.supervisorId ? Number(employee.supervisorId) : "",
  );
  const [warehouses, setWarehouses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successful, setSuccessful] = useState("");

  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    setForm({
      name: employee.name || "",
      employeeId: employee.employeeId || "",
      email: employee.email || "",
      mobile: employee.mobile || "",
      warehouseId: employee.warehouseId || "",
      divisionId: employee.divisionId || employee.division?.id || "",
    });
    setSelectedRoles(employee.roles?.map((role) => role.id) || []);
    setSelectedSupervisor(employee.supervisorId ? Number(employee.supervisorId) : "");
    setHierarchyAssignments((current) => ({
      ...current,
      zoneId: "",
      subZoneId: "",
      teamId: "",
      storeIds: [],
      assignedStores: [],
    }));
  }, [employee]);

  useEffect(() => {
    async function fetchInitial() {
      try {
        setLoading(true);
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        let warehousesEndpoint = "/warehouse";
        if (currentDivisionId && currentDivisionId !== "1") {
          warehousesEndpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          warehousesEndpoint += "?showAllDivisions=true";
        }

        const [rolesRes, warehousesRes, divisionsRes, editContextRes] =
          await Promise.allSettled([
            axiosAPI.get("/employees/roles"),
            axiosAPI.get(warehousesEndpoint),
            axiosAPI.get("/divisions"),
            axiosAPI.get(`/employees/${employee.id}/edit-context`),
          ]);

        if (
          rolesRes.status !== "fulfilled" ||
          warehousesRes.status !== "fulfilled" ||
          divisionsRes.status !== "fulfilled" ||
          editContextRes.status !== "fulfilled"
        ) {
          throw rolesRes.status !== "fulfilled"
            ? rolesRes.reason
            : warehousesRes.status !== "fulfilled"
              ? warehousesRes.reason
              : divisionsRes.status !== "fulfilled"
                ? divisionsRes.reason
                : editContextRes.reason;
        }

        setRoles(rolesRes.value.data.roles || []);
        setWarehouses(warehousesRes.value.data.warehouses || []);
        setDivisions(divisionsRes.value.data.data || divisionsRes.value.data.divisions || []);

        const editContext = editContextRes.value.data || {};
        const contextEmployee = editContext.employee || employee;
        const lookups = editContext.lookups || {};
        const assignments = editContext.assignments || {};

        setForm({
          name: contextEmployee.name || employee.name || "",
          employeeId: contextEmployee.employeeId || employee.employeeId || "",
          email: contextEmployee.email || employee.email || "",
          mobile: contextEmployee.mobile || employee.mobile || "",
          warehouseId:
            contextEmployee.warehouseId ||
            contextEmployee.warehouse?.id ||
            employee.warehouseId ||
            "",
          divisionId:
            assignments.divisionId ||
            contextEmployee.divisionId ||
            contextEmployee.division?.id ||
            employee.divisionId ||
            employee.division?.id ||
            "",
        });
        setSelectedRoles(contextEmployee.roles?.map((role) => role.id) || employee.roles?.map((role) => role.id) || []);
        setHierarchyAssignments({
          zoneId: assignments.zoneId || "",
          subZoneId: assignments.subZoneId || "",
          teamId: assignments.teamId || "",
          storeIds: assignments.storeIds || [],
          assignedStores: assignments.stores || [],
        });
        setZones(lookups.zones || []);
        setSubZones(lookups.subZones || []);
        setTeams(lookups.teams || []);
        setStores(lookups.stores || []);
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message ||
            "Failed to load employee details.",
        );
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }

    fetchInitial();
  }, [axiosAPI, employee.id]);

  useEffect(() => {
    async function fetchSupervisors() {
      const lastRoleId = selectedRoles[selectedRoles.length - 1];
      const lastRole = roles.find((role) => role.id === lastRoleId);

      if (!lastRole || lastRole.name.toLowerCase() === "admin") {
        setSupervisors([]);
        return;
      }

      try {
        const response = await axiosAPI.get(`/employees/supervisors/${lastRoleId}`);
        setSupervisors(response.data.supervisors || []);
      } catch (requestError) {
        setSupervisors([]);
      }
    }

    if (selectedRoles.length) {
      fetchSupervisors();
    }
  }, [axiosAPI, roles, selectedRoles]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    const processedValue =
      name === "name" ? value.toUpperCase().replace(/\s\s+/g, " ") : value;
    setForm((current) => ({ ...current, [name]: processedValue }));
  };

  const addRole = (roleId) => {
    const parsedId = Number.parseInt(roleId, 10);
    if (Number.isInteger(parsedId) && !selectedRoles.includes(parsedId)) {
      setSelectedRoles((current) => [...current, parsedId]);
    }
  };

  const removeRole = (roleId) => {
    setSelectedRoles((current) => current.filter((item) => item !== roleId));
  };

  const availableRoles = roles.filter((role) => !selectedRoles.includes(role.id));
  const selectedRoleNames = selectedRoles
    .map((roleId) => roles.find((item) => item.id === roleId)?.name || "")
    .filter(Boolean);
  const hasRole = (roleName) =>
    selectedRoleNames.some(
      (name) => String(name).toLowerCase() === String(roleName).toLowerCase(),
    );
  const isAdminSelected = hasRole("Admin");
  const isDivisionHeadSelected = hasRole("Division Head");
  const isZbmSelected = hasRole("Zone Business Manager");
  const isRbmSelected = hasRole("Regional Business Manager");
  const isAbmSelected = hasRole("Area Business Manager");
  const isStoreManagerSelected = hasRole("Store Manager");
  const isStoreEmployeeSelected = hasRole("Store Employee");
  const shouldShowStoreHierarchy =
    isStoreManagerSelected || isStoreEmployeeSelected;

  const shouldShowWarehouse = selectedRoles.some((roleId) => {
    const role = roles.find((item) => item.id === roleId);
    return role?.name?.toLowerCase() === "warehouse manager";
  });
  const shouldShowDivision = !isAdminSelected;
  const visibleZones = zones.filter(
    (zone) =>
      !form.divisionId || Number(zone.divisionId) === Number(form.divisionId),
  );
  const visibleSubZones = subZones.filter(
    (subZone) =>
      !hierarchyAssignments.zoneId ||
      Number(subZone.zoneId) === Number(hierarchyAssignments.zoneId),
  );
  const visibleTeams = teams.filter(
    (team) =>
      !hierarchyAssignments.subZoneId ||
      Number(team.subZoneId) === Number(hierarchyAssignments.subZoneId),
  );
  const visibleStores = stores.filter((store) => {
    if (form.divisionId && Number(store.divisionId) !== Number(form.divisionId)) {
      return false;
    }
    if (
      hierarchyAssignments.zoneId &&
      Number(store.zoneId || 0) !== Number(hierarchyAssignments.zoneId)
    ) {
      return false;
    }
    if (
      hierarchyAssignments.subZoneId &&
      Number(store.subZoneId || 0) !== Number(hierarchyAssignments.subZoneId)
    ) {
      return false;
    }
    if (
      hierarchyAssignments.teamId &&
      Number(store.teamId || 0) !== Number(hierarchyAssignments.teamId)
    ) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    setHierarchyAssignments((current) => {
      const next = { ...current };
      let changed = false;

      if (
        next.zoneId &&
        !visibleZones.some((zone) => Number(zone.id) === Number(next.zoneId))
      ) {
        next.zoneId = "";
        next.subZoneId = "";
        next.teamId = "";
        next.storeIds = [];
        changed = true;
      }

      if (
        next.subZoneId &&
        !visibleSubZones.some((subZone) => Number(subZone.id) === Number(next.subZoneId))
      ) {
        next.subZoneId = "";
        next.teamId = "";
        next.storeIds = [];
        changed = true;
      }

      if (
        next.teamId &&
        !visibleTeams.some((team) => Number(team.id) === Number(next.teamId))
      ) {
        next.teamId = "";
        next.storeIds = [];
        changed = true;
      }

      if (next.storeIds.length) {
        const filteredStoreIds = next.storeIds.filter((storeId) =>
          visibleStores.some((store) => Number(store.id) === Number(storeId)),
        );
        if (filteredStoreIds.length !== next.storeIds.length) {
          next.storeIds = filteredStoreIds;
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [
    form.divisionId,
    hierarchyAssignments.zoneId,
    hierarchyAssignments.subZoneId,
    zones,
    subZones,
    teams,
    stores,
  ]);

  const handleHierarchyChange = (name, value) => {
    setHierarchyAssignments((current) => {
      const next = {
        ...current,
        [name]: value,
      };

      if (name === "zoneId") {
        next.subZoneId = "";
        next.teamId = "";
        next.storeIds = [];
      }

      if (name === "subZoneId") {
        next.teamId = "";
        next.storeIds = [];
      }

      if (name === "teamId") {
        next.storeIds = [];
      }

      return next;
    });
  };

  const handleStoreToggle = (storeId) => {
    setHierarchyAssignments((current) => ({
      ...current,
      storeIds: current.storeIds.includes(storeId)
        ? current.storeIds.filter((value) => value !== storeId)
        : [...current.storeIds, storeId],
    }));
  };

  const handleSubmit = async () => {
    const parsedSupervisorId =
      selectedSupervisor !== "" && selectedSupervisor != null
        ? Number.parseInt(selectedSupervisor, 10)
        : null;

    const supervisorRequired = !isAdminSelected && supervisors.length > 0;

    if (
      !form.name ||
      !form.employeeId ||
      !form.mobile ||
      !selectedRoles.length ||
      (shouldShowDivision && !form.divisionId) ||
      (supervisorRequired &&
        (parsedSupervisorId == null || Number.isNaN(parsedSupervisorId)))
    ) {
      setError("Please fill all required fields before updating.");
      setIsModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...form,
        warehouseId:
          shouldShowWarehouse && form.warehouseId
            ? Number.parseInt(form.warehouseId, 10)
            : null,
        divisionId:
          shouldShowDivision && form.divisionId
            ? Number.parseInt(form.divisionId, 10)
            : null,
        roleIds: selectedRoles,
        supervisorId: isAdminSelected ? null : parsedSupervisorId,
        zoneId: hierarchyAssignments.zoneId
          ? Number.parseInt(hierarchyAssignments.zoneId, 10)
          : null,
        subZoneId: hierarchyAssignments.subZoneId
          ? Number.parseInt(hierarchyAssignments.subZoneId, 10)
          : null,
        teamId: hierarchyAssignments.teamId
          ? Number.parseInt(hierarchyAssignments.teamId, 10)
          : null,
        storeIds: hierarchyAssignments.storeIds,
      };

      const response = await axiosAPI.put(`/employees/${employee.id}`, payload);
      setSuccessful(response.data.message || "Employee updated successfully.");
      onTrigger();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || "Failed to update employee.",
      );
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="path">
        <span onClick={() => setOnUpdate(false)}>Manage Employees</span>{" "}
        <i className="bi bi-chevron-right"></i> Update Employee
      </p>

      <div className={styles.employeeEditPage}>
        <section className={styles.employeeEditHero}>
          <div>
            <h2>Update Employee</h2>
            <p>
              Edit profile details and assigned roles in one place.
            </p>
          </div>
          <div className={styles.employeeEditHeroMeta}>
            <span>{employee.primaryRole || employee.roles?.[0]?.name || "No Role"}</span>
            <strong>{employee.employeeId || employee.id}</strong>
            {shouldShowDivision && (
              <small>
                Division:{" "}
                {divisions.find(
                  (division) => Number(division.id) === Number(form.divisionId),
                )?.name || employee.division?.name || "Not assigned"}
              </small>
            )}
          </div>
        </section>

        <div className={styles.employeeEditGrid}>
          <section className={styles.employeeEditCard}>
            <h3>Profile Details</h3>
            <div className={styles.employeeFormGrid}>
              <label>
                <span>Full Name</span>
                <input name="name" value={form.name} onChange={handleFormChange} />
              </label>
              <label>
                <span>Employee ID</span>
                <input
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleFormChange}
                />
              </label>
              <label>
                <span>Email</span>
                <input name="email" value={form.email} onChange={handleFormChange} />
              </label>
              <label>
                <span>Mobile</span>
                <input
                  name="mobile"
                  value={form.mobile}
                  onChange={handleFormChange}
                />
              </label>
              {shouldShowWarehouse && (
                <label>
                  <span>Warehouse</span>
                  <select
                    name="warehouseId"
                    value={form.warehouseId || ""}
                    onChange={handleFormChange}
                  >
                    <option value="">-- Select Warehouse --</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {shouldShowDivision && (
                <label className={styles.employeeSpanTwo}>
                  <span>
                    {isDivisionHeadSelected ? "Division Head For" : "Assigned Division"}
                  </span>
                  <select
                    name="divisionId"
                    value={form.divisionId || ""}
                    onChange={handleFormChange}
                  >
                    <option value="">-- Select Division --</option>
                    {divisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                  {isDivisionHeadSelected && (
                    <small>
                      Update this when a division head is moved from one division to
                      another.
                    </small>
                  )}
                </label>
              )}
              {!isAdminSelected && supervisors.length > 0 && (
                <label>
                  <span>Supervisor</span>
                  <select
                    value={selectedSupervisor || ""}
                    onChange={(event) => setSelectedSupervisor(event.target.value)}
                  >
                    <option value="">-- Select Supervisor --</option>
                    {supervisors.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </section>

          <section className={styles.employeeEditCard}>
            <h3>Roles</h3>
            <div className={styles.employeeRolePills}>
              {selectedRoles.map((roleId) => {
                const role = roles.find((item) => item.id === roleId);
                return (
                  <span key={roleId} className={styles.employeeRolePill}>
                    {role?.name || roleId}
                    <button type="button" onClick={() => removeRole(roleId)}>
                      ×
                    </button>
                  </span>
                );
              })}
            </div>

            {availableRoles.length > 0 && (
              <label className={styles.employeeSelectField}>
                <span>Add Role</span>
                <select defaultValue="" onChange={(event) => addRole(event.target.value)}>
                  <option value="">-- Add Role --</option>
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {(isZbmSelected || isRbmSelected || isAbmSelected || shouldShowStoreHierarchy) && (
              <div className={styles.employeeHierarchySection}>
                <div className={styles.employeeHierarchyHeader}>
                  <h4>Hierarchy Mapping</h4>
                  <p>
                    These mappings are optional, but they mirror the real zone,
                    sub zone, team, and store assignments already used in the app.
                  </p>
                </div>

                {(isZbmSelected || isRbmSelected || isAbmSelected || shouldShowStoreHierarchy) && (
                  <label className={styles.employeeSpanTwo}>
                    <span>Zone</span>
                    <select
                      value={hierarchyAssignments.zoneId || ""}
                      onChange={(event) =>
                        handleHierarchyChange("zoneId", event.target.value)
                      }
                    >
                      <option value="">-- Select Zone --</option>
                      {visibleZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {(isRbmSelected || isAbmSelected || shouldShowStoreHierarchy) && (
                  <label className={styles.employeeSpanTwo}>
                    <span>Sub Zone</span>
                    <select
                      value={hierarchyAssignments.subZoneId || ""}
                      onChange={(event) =>
                        handleHierarchyChange("subZoneId", event.target.value)
                      }
                    >
                      <option value="">-- Select Sub Zone --</option>
                      {visibleSubZones.map((subZone) => (
                        <option key={subZone.id} value={subZone.id}>
                          {subZone.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {(isAbmSelected || shouldShowStoreHierarchy) && (
                  <label className={styles.employeeSpanTwo}>
                    <span>Team</span>
                    <select
                      value={hierarchyAssignments.teamId || ""}
                      onChange={(event) =>
                        handleHierarchyChange("teamId", event.target.value)
                      }
                    >
                      <option value="">-- Select Team --</option>
                      {visibleTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {shouldShowStoreHierarchy && (
                  <div className={styles.employeeSpanTwo}>
                    <span className={styles.employeeHierarchyFieldLabel}>
                      Stores Under These Filters
                    </span>
                    <div className={styles.employeeStoreSelectionMeta}>
                      <strong>{hierarchyAssignments.storeIds.length}</strong>
                      <span>selected</span>
                    </div>
                    <div className={styles.employeeStoreSelectionGrid}>
                      {visibleStores.length ? (
                        visibleStores.map((store) => (
                          <label
                            key={store.id}
                            className={styles.employeeStoreSelectionCard}
                          >
                            <input
                              type="checkbox"
                              checked={hierarchyAssignments.storeIds.includes(store.id)}
                              onChange={() => handleStoreToggle(store.id)}
                            />
                            <div>
                              <strong>{store.name}</strong>
                              <span>{store.storeCode}</span>
                            </div>
                          </label>
                        ))
                      ) : (
                        <p className={styles.employeeStoreEmpty}>
                          No stores found for the selected filters yet.
                        </p>
                      )}
                    </div>
                    {hierarchyAssignments.assignedStores.length > 0 && (
                      <div className={styles.employeeAssignedStoreSummary}>
                        <strong>Current mapped stores</strong>
                        <div className={styles.employeeAssignedStorePills}>
                          {hierarchyAssignments.assignedStores.map((store) => (
                            <span key={`${store.id}-${store.roleName || "store"}`}>
                              {store.storeCode || store.name}
                              {store.roleName ? ` · ${store.roleName}` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <div className={styles.employeeEditActions}>
          {!successful ? (
            <>
              <button className={styles.employeePrimaryAction} onClick={handleSubmit}>
                Update Employee
              </button>
              <button
                className={styles.employeeSecondaryAction}
                onClick={() => setOnUpdate(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className={styles.employeePrimaryAction}
              onClick={() => setOnUpdate(false)}
            >
              {successful}
            </button>
          )}
        </div>
      </div>

      {loading && <Loading />}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </>
  );
}

export default UpdateEmployee;
