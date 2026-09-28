import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./StoreSelector.module.css";
import { useAuth } from "../Auth";
import feedsLogo from "../images/feeds-croped.png";
import { isAreaBusinessManager } from "../utils/roleUtils";

const StoreSelector = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectingStore, setSelectingStore] = useState(false);
  const [storeSelected, setStoreSelected] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeType, setStoreType] = useState("own");

  // 🔹 HIERARCHY FILTERS (persisted)
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem("storeFilters");
    return saved
      ? JSON.parse(saved)
      : { divisionId: "", zoneId: "", subZoneId: "", teamId: "" };
  });

  useEffect(() => {
    localStorage.setItem("storeFilters", JSON.stringify(filters));
  }, [filters]);

  const navigate = useNavigate();
  const { axiosAPI } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.log("StoreSelector.jsx - No token found, redirecting to login");
      navigate("/login");
      return;
    }

    // Get username and user data from localStorage
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) {
        const currentUser = userData.user || userData;
        const userName =
          currentUser.name ||
          currentUser.employee_name ||
          currentUser.username ||
          currentUser.fullName ||
          "User";
        setUsername(userName);
        setUser(currentUser);
      } else {
        setUsername("User");
        setUser(null);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      setUsername("User");
      setUser(null);
    }
  }, [navigate]);

  // Fetch stores - run after component mounts and when user state changes
  useEffect(() => {
    // Small delay to ensure localStorage is ready and user state is set
    const timer = setTimeout(() => {
      loadStoresFromUserData();
    }, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredStores = stores
    .filter((store) => {
      const matchesSearch = store.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesType =
        storeType === "all"
          ? true
          : store.storeType?.toLowerCase() === storeType.toLowerCase();

      const matchesHierarchy =
        (!filters.divisionId || store.division?.id == filters.divisionId) &&
        (!filters.zoneId || store.zone?.id == filters.zoneId) &&
        (!filters.subZoneId || store.subZone?.id == filters.subZoneId) &&
        (!filters.teamId || store.team?.id == filters.teamId);

      return matchesSearch && matchesType && matchesHierarchy;
    })
    .sort((a, b) =>
      a.name?.trim().localeCompare(b.name?.trim(), undefined, {
        sensitivity: "base",
        numeric: true,
      }),
    );

  const uniqueBy = (arr, key) =>
    [...new Map(arr.map((item) => [item[key]?.id, item[key]])).values()].filter(
      Boolean,
    );

  const divisions = uniqueBy(stores, "division");
  const zones = uniqueBy(
    stores.filter(
      (s) => !filters.divisionId || s.division?.id == filters.divisionId,
    ),
    "zone",
  );
  const subZones = uniqueBy(
    stores.filter((s) => !filters.zoneId || s.zone?.id == filters.zoneId),
    "subZone",
  );
  const teams = uniqueBy(
    stores.filter(
      (s) => !filters.subZoneId || s.subZone?.id == filters.subZoneId,
    ),
    "team",
  );

  const loadStoresFromUserData = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("StoreSelector.jsx - Loading stores...");

      let storesList = [];

      // Try to get assignedStores from user data (for store managers)
      if (user) {
        const currentUser = user.user || user;
        storesList = currentUser?.assignedStores || [];
        console.log("StoreSelector.jsx - Stores from user data:", storesList);
      }

      // Get authMeData from localStorage as fallback
      if (storesList.length === 0) {
        try {
          const authMeData = localStorage.getItem("authMeData");
          if (authMeData) {
            const parsed = JSON.parse(authMeData);
            storesList = parsed.assignedStores || parsed.stores || [];
            console.log(
              "StoreSelector.jsx - Stores from authMeData:",
              storesList,
            );
          }
        } catch (e) {
          console.error("Error parsing authMeData:", e);
        }
      }

      // Try to get from user localStorage as another fallback
      if (storesList.length === 0) {
        try {
          const userData = localStorage.getItem("user");
          if (userData) {
            const parsed = JSON.parse(userData);
            const currentUser = parsed.user || parsed;
            storesList =
              currentUser?.assignedStores || currentUser?.stores || [];
            console.log(
              "StoreSelector.jsx - Stores from user localStorage:",
              storesList,
            );
          }
        } catch (e) {
          console.error("Error parsing user localStorage:", e);
        }
      }

      // If no stores from user data, fetch from API (for admin/division head)
      if (storesList.length === 0) {
        console.log(
          "StoreSelector.jsx - No stores in user data, fetching from API...",
        );
        try {
          // Use /auth/available-stores endpoint to get all available stores
          // This works for all roles including admin, ABM, and others
          console.log(
            "StoreSelector.jsx - Fetching from /auth/available-stores",
          );
          const response = await axiosAPI.get("/auth/available-stores");

          const data = response.data;
          console.log("StoreSelector.jsx - API response:", data);

          if (data.success && Array.isArray(data.data)) {
            storesList = data.data;
            console.log(
              "StoreSelector.jsx - Stores from API (data.data):",
              storesList,
            );
          } else if (Array.isArray(data.stores)) {
            storesList = data.stores;
            console.log(
              "StoreSelector.jsx - Stores from API (data.stores):",
              storesList,
            );
          } else if (Array.isArray(data)) {
            storesList = data;
            console.log(
              "StoreSelector.jsx - Stores from API (direct array):",
              storesList,
            );
          } else {
            console.warn(
              "StoreSelector.jsx - Unexpected API response structure:",
              data,
            );
          }
        } catch (err) {
          console.error(
            "StoreSelector.jsx - Error fetching stores from API:",
            err,
          );
          setError(
            err?.response?.data?.message ||
              err.message ||
              "Error fetching stores. Please try refreshing the page.",
          );
          setStores([]);
          setLoading(false);
          return;
        }
      }

      console.log("StoreSelector.jsx - Final stores list:", storesList);
      console.log("StoreSelector.jsx - Stores count:", storesList.length);

      if (storesList.length === 0) {
        setError("No stores available. Please contact administrator.");
        setStores([]);
        setLoading(false);
        return;
      }

      // Only show selector if more than one store
      if (storesList.length === 1) {
        // If only one store, auto-select it
        console.log("StoreSelector.jsx - Only one store, auto-selecting");
        handleStoreSelect(storesList[0]);
        return;
      }

      // Multiple stores - show selector
      setStores(storesList);
      setLoading(false);
    } catch (err) {
      console.error("StoreSelector.jsx - Error loading stores:", err);
      setError("Error loading stores");
      setLoading(false);
    }
  };

  const clearFilters = () => {
    const empty = { divisionId: "", zoneId: "", subZoneId: "", teamId: "" };
    setFilters(empty);
    localStorage.setItem("storeFilters", JSON.stringify(empty));
  };

  const handleStoreSelect = async (store) => {
    if (selectingStore) return; // Prevent multiple calls

    console.log("StoreSelector.jsx - Selecting store:", store);

    try {
      setSelectingStore(true);
      setError(""); // Clear previous errors

      console.log("StoreSelector.jsx - Sending store selection request...");

      const response = await axiosAPI.post("/auth/select-store", {
        storeId: store.id,
      });

      console.log("StoreSelector.jsx - Select store response:", response);

      if (response.status === 200 || response.status === 204) {
        // Store selected store in localStorage
        const storeData = {
          id: store.id,
          name: store.name,
          storeCode: store.storeCode || store.code || "",
          address: store.address,
          isActive: store.isActive,
          createdAt: store.createdAt,
          updatedAt: store.updatedAt,
        };

        localStorage.setItem("selectedStore", JSON.stringify(storeData));
        localStorage.setItem("currentStoreId", store.id.toString());
        localStorage.setItem("currentStoreName", store.name);

        console.log(
          "StoreSelector.jsx - Store stored in localStorage:",
          storeData,
        );

        // Dispatch custom event to notify components that store has changed
        window.dispatchEvent(
          new CustomEvent("storeChanged", {
            detail: { storeId: store.id, store: storeData },
          }),
        );

        // Set success state
        setStoreSelected(true);

        // Navigate to store dashboard
        setTimeout(() => {
          console.log("StoreSelector.jsx - Navigating to store dashboard...");
          navigate("/store", { replace: true });
        }, 1500);
      } else {
        const errorData = response.data || {};
        setError(
          `Failed to select store: ${errorData.message || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("StoreSelector.jsx - Error selecting store:", error);
      setError(
        error?.response?.data?.message || "Network error while selecting store",
      );
    } finally {
      setSelectingStore(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loading}>Loading stores...</div>
        </div>
      </div>
    );
  }

  if (error && !stores.length) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.error}>{error}</div>
        </div>
      </div>
    );
  }

  if (storeSelected) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>Store selected successfully!</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <img src={feedsLogo} alt="Feeds Logo" className={styles.logo} />
        </div>

        <h1 className={styles.companyName}>FEED BAZAAR PVT LTD</h1>

        <div className={styles.welcomeMessage}>
          Welcome! <span className={styles.username}>{username}</span>
        </div>

        <p className={styles.instruction}>Choose your Store to continue</p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.hierarchyFilters}>
          <select
            value={filters.divisionId}
            className={styles.filterDropdown}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                divisionId: e.target.value,
                zoneId: "",
                subZoneId: "",
                teamId: "",
              }))
            }
          >
            <option value="">All Divisions</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={filters.zoneId}
            className={styles.filterDropdown}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                zoneId: e.target.value,
                subZoneId: "",
                teamId: "",
              }))
            }
          >
            <option value="">All Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>

          <select
            value={filters.subZoneId}
            className={styles.filterDropdown}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                subZoneId: e.target.value,
                teamId: "",
              }))
            }
          >
            <option value="">All SubZones</option>
            {subZones.map((sz) => (
              <option key={sz.id} value={sz.id}>
                {sz.name}
              </option>
            ))}
          </select>

          <select
            value={filters.teamId}
            className={styles.filterDropdown}
            onChange={(e) =>
              setFilters((f) => ({ ...f, teamId: e.target.value }))
            }
          >
            <option value="">All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <button onClick={clearFilters}>Clear Filters</button>
        </div>

        <div className={styles.filterSearchContainer}>
          <input
            type="text"
            placeholder="Search store by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={storeType}
            onChange={(e) => setStoreType(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Stores</option>
            <option value="own">Own</option>
            <option value="franchise">Franchise</option>
          </select>
        </div>

        <div className={styles.storesList}>
          {filteredStores.length === 0 && (
            <div className={styles.noResults}>No stores found</div>
          )}

          {filteredStores.map((store, index) => (
            <div
              key={store.id}
              className={`${styles.storeCard} ${selectingStore ? styles.disabled : ""}`}
              onClick={() => handleStoreSelect(store)}
              style={{
                animationDelay: `${index * 0.1}s`,
                animation: "slideInUp 0.6s ease-out both",
              }}
            >
              <div className={styles.storeInfo}>
                <span className={styles.storeName}>{store.name}</span>

                <div className={styles.storeMeta}>
                  <span className={styles.metaItem}>
                    <strong>Division:</strong> {store.division?.name || "-"}
                  </span>

                  <span className={styles.metaItem}>
                    <strong>Zone:</strong> {store.zone?.name || "-"}
                  </span>

                  <span
                    className={`${styles.storeTypeBadge} ${
                      store.storeType === "own"
                        ? styles.ownStore
                        : styles.franchiseStore
                    }`}
                  >
                    {store.storeType?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoreSelector;
