import React, { useState, useEffect, useRef } from "react";
import {
  Store,
  Target,
  ShoppingBag,
  DollarSign,
  Calendar,
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
  ChevronRight,
  ChevronDown,
  Layers,
  BarChart2,
  Package,
  Zap,
  Info,
  Check,
  Loader2,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Brand tokens
   Primary  : #003176 (navy blue)
   Accent   : #22a634 (green)
───────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');

  .csm-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,31,76,0.45);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    animation: csmFadeIn 0.2s ease;
  }
  @keyframes csmFadeIn { from { opacity:0 } to { opacity:1 } }

  .csm-modal {
    background: #ffffff;
    border-radius: 20px;
    width: 100%; max-width: 620px;
    max-height: 92vh; overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow:
      0 2px 4px rgba(0,49,118,0.06),
      0 12px 40px rgba(0,49,118,0.14),
      0 40px 80px rgba(0,49,118,0.10);
    font-family: 'DM Sans', sans-serif;
    color: #1a2236;
    animation: csmSlideUp 0.3s cubic-bezier(0.34,1.46,0.64,1);
    border: 1px solid rgba(0,49,118,0.1);
  }
  @keyframes csmSlideUp {
    from { opacity:0; transform: translateY(28px) scale(0.97) }
    to   { opacity:1; transform: translateY(0)   scale(1) }
  }

  /* ── Header ── */
  .csm-header {
    display: flex; align-items: center;
    padding: 20px 24px 16px;
    border-bottom: 1px solid #edf0f7;
    background: linear-gradient(120deg, #003176 0%, #004299 100%);
    position: relative; overflow: hidden;
  }
  .csm-header::after {
    content: '';
    position: absolute; right: -30px; top: -30px;
    width: 140px; height: 140px; border-radius: 50%;
    background: rgba(34,166,52,0.18); pointer-events: none;
  }
  .csm-header::before {
    content: '';
    position: absolute; right: 40px; bottom: -50px;
    width: 100px; height: 100px; border-radius: 50%;
    background: rgba(255,255,255,0.06); pointer-events: none;
  }
  .csm-header-icon {
    width: 42px; height: 42px; border-radius: 12px;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.25);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; position: relative; z-index: 1;
  }
  .csm-header-text { margin-left: 14px; position: relative; z-index: 1; }
  .csm-header-text h2 { font-size: 17px; font-weight: 700; margin: 0; color: #fff; letter-spacing: -0.01em; }
  .csm-header-text p  { font-size: 12px; color: rgba(255,255,255,0.65); margin: 3px 0 0; }
  .csm-close-btn {
    margin-left: auto; position: relative; z-index: 1;
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.8); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .csm-close-btn:hover { background: rgba(255,255,255,0.22); color: #fff; }

  /* ── Tabs ── */
  .csm-tabs {
    display: flex; background: #f4f6fb;
    border-bottom: 1px solid #e8ecf4;
    padding: 0 24px;
  }
  .csm-tab {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 12px 16px;
    font-size: 13px; font-weight: 500; cursor: pointer;
    border: none; background: transparent; color: #7a88a8;
    border-bottom: 2px solid transparent;
    transition: all 0.18s ease; position: relative; bottom: -1px;
  }
  .csm-tab:hover { color: #003176; }
  .csm-tab.active { color: #003176; font-weight: 600; border-bottom-color: #003176; }

  .csm-badge {
    font-size: 10px; font-weight: 700; padding: 2px 7px;
    background: #22a634; color: #fff; border-radius: 99px; line-height: 1.4;
  }
  .csm-badge-outline {
    font-size: 10px; font-weight: 700; padding: 2px 7px;
    background: rgba(0,49,118,0.08); color: #003176;
    border-radius: 99px; line-height: 1.4;
  }

  /* ── Body ── */
  .csm-body {
    flex: 1; overflow-y: auto; padding: 20px 24px 8px;
    scrollbar-width: thin; scrollbar-color: #d0d8ee transparent;
  }

  /* ── Section label ── */
  .csm-section-label {
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: #003176; margin: 0 0 10px;
    display: flex; align-items: center; gap: 6px;
  }
  .csm-section-label::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(to right, rgba(0,49,118,0.15), transparent);
  }

  /* ── Custom Searchable Dropdown ── */
  .csm-dd-wrap { position: relative; }

  .csm-dd-trigger {
    width: 100%; display: flex; align-items: center; gap: 8px;
    padding: 10px 12px;
    background: #fff; border: 1.5px solid #d0d8ee;
    border-radius: 10px; color: #1a2236;
    font-size: 13px; font-family: inherit;
    cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s;
    text-align: left; user-select: none; box-sizing: border-box;
  }
  .csm-dd-trigger:hover { border-color: #003176; }
  .csm-dd-trigger.open {
    border-color: #003176;
    box-shadow: 0 0 0 3px rgba(0,49,118,0.1);
    border-bottom-left-radius: 0; border-bottom-right-radius: 0;
  }
  .csm-dd-trigger.err { border-color: #e53e3e !important; box-shadow: 0 0 0 3px rgba(229,62,62,0.1) !important; }
  .csm-dd-placeholder { color: #b0bcd4; flex: 1; }
  .csm-dd-value { color: #1a2236; flex: 1; font-weight: 500; }
  .csm-dd-code {
    font-family: 'DM Mono', monospace; font-size: 11px;
    color: #7a88a8; background: #f0f3fa; padding: 2px 7px; border-radius: 4px;
  }
  .csm-dd-chevron { color: #a0aabf; transition: transform 0.2s; flex-shrink: 0; }
  .csm-dd-chevron.open { transform: rotate(180deg); }

  .csm-dd-panel {
    position: absolute; top: 100%; left: 0; right: 0; z-index: 200;
    background: #fff;
    border: 1.5px solid #003176; border-top: none;
    border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,49,118,0.14);
    overflow: hidden;
    animation: ddSlide 0.16s ease;
  }
  @keyframes ddSlide { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }

  .csm-dd-search-bar {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid #edf0f7;
    background: #f7f9fd;
  }
  .csm-dd-search-bar input {
    flex: 1; border: none; outline: none; background: transparent;
    font-size: 13px; font-family: inherit; color: #1a2236;
  }
  .csm-dd-search-bar input::placeholder { color: #b0bcd4; }
  .csm-dd-clear-btn {
    background: none; border: none; cursor: pointer; padding: 0;
    color: #a0aabf; display: flex; align-items: center;
  }
  .csm-dd-clear-btn:hover { color: #e53e3e; }

  .csm-dd-list {
    max-height: 190px; overflow-y: auto;
    scrollbar-width: thin; scrollbar-color: #d0d8ee transparent;
  }
  .csm-dd-item {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 14px; cursor: pointer;
    font-size: 13px; color: #1a2236;
    border-bottom: 1px solid #f4f6fb;
    transition: background 0.1s;
  }
  .csm-dd-item:last-child { border-bottom: none; }
  .csm-dd-item:hover { background: #f0f5ff; }
  .csm-dd-item.sel { background: rgba(0,49,118,0.05); color: #003176; font-weight: 500; }
  .csm-dd-item-code {
    font-family: 'DM Mono', monospace; font-size: 11px;
    color: #7a88a8; background: #f0f3fa;
    padding: 2px 7px; border-radius: 4px; margin-left: auto; flex-shrink: 0;
  }
  .csm-dd-empty { padding: 18px; text-align: center; color: #b0bcd4; font-size: 13px; }

  /* ── Info box ── */
  .csm-info-box {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 11px 14px; border-radius: 10px;
    background: rgba(0,49,118,0.04);
    border: 1px solid rgba(0,49,118,0.12);
    font-size: 13px; color: #4a5878; margin-bottom: 4px;
  }
  .csm-info-box strong { color: #003176; }

  /* ── Bulk store list ── */
  .csm-store-list-wrap {
    border: 1.5px solid #d0d8ee; border-radius: 10px;
    overflow: hidden; background: #fff; margin-bottom: 8px;
    transition: border-color 0.15s;
  }
  .csm-store-list-wrap:focus-within { border-color: #003176; }
  .csm-store-list-wrap.err { border-color: #e53e3e; }

  .csm-bulk-search {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid #edf0f7; background: #f7f9fd;
  }
  .csm-bulk-search input {
    flex: 1; border: none; outline: none; background: transparent;
    font-size: 13px; font-family: inherit; color: #1a2236;
  }
  .csm-bulk-search input::placeholder { color: #b0bcd4; }

  .csm-select-all-row {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 14px;
    border-bottom: 1px solid #edf0f7; background: #f4f7ff;
    cursor: pointer; user-select: none; transition: background 0.1s;
  }
  .csm-select-all-row:hover { background: #eaeffc; }
  .csm-select-all-label { font-size: 12px; font-weight: 600; color: #003176; flex: 1; }

  .csm-bulk-list { max-height: 160px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #d0d8ee transparent; }

  .csm-store-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 14px; cursor: pointer;
    border-bottom: 1px solid #f4f6fb;
    transition: background 0.1s; user-select: none;
  }
  .csm-store-item:last-child { border-bottom: none; }
  .csm-store-item:hover { background: #f4f7ff; }
  .csm-store-item.checked { background: rgba(34,166,52,0.04); }
  .csm-store-name { font-size: 13px; color: #1a2236; flex: 1; }
  .csm-store-code {
    font-size: 11px; font-family: 'DM Mono', monospace;
    color: #7a88a8; background: #f0f3fa; padding: 2px 7px; border-radius: 4px; flex-shrink: 0;
  }

  /* ── Target cards ── */
  .csm-target-cards { display: flex; gap: 10px; margin-bottom: 4px; }
  .csm-target-card {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px;
    padding: 14px 8px;
    border: 1.5px solid #d0d8ee; border-radius: 12px; cursor: pointer;
    transition: all 0.18s ease; background: #fff; text-align: center; position: relative;
  }
  .csm-target-card:hover { border-color: #003176; background: rgba(0,49,118,0.03); }
  .csm-target-card.active {
    border-color: #003176; background: rgba(0,49,118,0.04);
    box-shadow: 0 0 0 3px rgba(0,49,118,0.1);
  }
  .csm-tc-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .csm-target-card.amount .csm-tc-icon { background: rgba(34,166,52,0.1); color: #22a634; }
  .csm-target-card.bags   .csm-tc-icon { background: rgba(0,49,118,0.1); color: #003176; }
  .csm-target-card.both   .csm-tc-icon { background: rgba(0,102,200,0.1); color: #0066c8; }
  .csm-tc-label { font-size: 12.5px; font-weight: 600; color: #4a5878; }
  .csm-target-card.active .csm-tc-label { color: #003176; }
  .csm-tc-sub { font-size: 10.5px; color: #b0bcd4; line-height: 1.3; }
  .csm-tc-check {
    position: absolute; top: 7px; right: 7px;
    width: 16px; height: 16px; border-radius: 50%;
    background: #22a634; color: #fff;
    display: flex; align-items: center; justify-content: center;
  }

  /* ── Inputs ── */
  .csm-field { margin-bottom: 14px; }
  .csm-field label {
    display: flex; align-items: center; gap: 5px;
    font-size: 12px; font-weight: 600; color: #4a5878; margin-bottom: 6px;
  }
  .csm-field label .req { color: #e53e3e; }
  .csm-input {
    width: 100%; padding: 10px 14px;
    background: #fff; border: 1.5px solid #d0d8ee;
    border-radius: 10px; color: #1a2236;
    font-size: 13px; font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none; box-sizing: border-box;
  }
  .csm-input::placeholder { color: #b0bcd4; }
  .csm-input:focus { border-color: #003176; box-shadow: 0 0 0 3px rgba(0,49,118,0.1); }
  .csm-input:disabled { background: #f4f6fb; color: #a0aabf; cursor: not-allowed; }
  .csm-input.err { border-color: #e53e3e !important; box-shadow: 0 0 0 3px rgba(229,62,62,0.1) !important; }

  .csm-pfx-wrap { position: relative; }
  .csm-pfx-wrap .pfx {
    position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
    color: #7a88a8; pointer-events: none; display: flex; align-items: center;
  }
  .csm-pfx-wrap .csm-input { padding-left: 30px; }

  .csm-row { display: flex; gap: 12px; }
  .csm-row .csm-field { flex: 1; }

  .csm-field-err { font-size: 11px; color: #e53e3e; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
  .csm-hint { font-size: 11px; color: #a0aabf; margin-top: 4px; }

  /* ── Warning ── */
  .csm-warning {
    display: flex; gap: 10px; align-items: flex-start;
    padding: 11px 14px; border-radius: 10px; margin-bottom: 14px;
    background: #fffbeb; border: 1px solid #f6d860;
    font-size: 12.5px; color: #92700a; line-height: 1.5;
    animation: wPop 0.2s ease;
  }
  @keyframes wPop { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }
  .csm-warning svg { flex-shrink: 0; margin-top: 1px; color: #d97706; }

  /* ── Error banner ── */
  .csm-err-banner {
    display: flex; gap: 10px; align-items: center;
    padding: 11px 14px; border-radius: 10px; margin-bottom: 14px;
    background: #fff5f5; border: 1px solid #feb2b2;
    font-size: 12.5px; color: #c53030; line-height: 1.5;
    animation: wPop 0.2s ease;
  }
  .csm-err-banner svg { flex-shrink: 0; color: #e53e3e; }

  /* ── Divider ── */
  .csm-divider { height: 1px; background: #edf0f7; margin: 16px 0; }

  /* ── Footer ── */
  .csm-footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 14px 24px; border-top: 1px solid #edf0f7; background: #f7f9fd;
  }
  .csm-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 9px 20px; border-radius: 10px;
    font-size: 13px; font-weight: 600; font-family: inherit;
    cursor: pointer; border: none; transition: all 0.17s;
  }
  .csm-btn-ghost {
    background: #fff; color: #4a5878; border: 1.5px solid #d0d8ee;
  }
  .csm-btn-ghost:hover { border-color: #003176; color: #003176; }
  .csm-btn-navy {
    background: linear-gradient(135deg, #003176 0%, #004299 100%);
    color: #fff; box-shadow: 0 2px 8px rgba(0,49,118,0.28);
  }
  .csm-btn-navy:hover:not(:disabled) {
    background: linear-gradient(135deg, #00276a, #003e8f);
    box-shadow: 0 4px 16px rgba(0,49,118,0.36); transform: translateY(-1px);
  }
  .csm-btn-navy:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
  .csm-btn-green {
    background: linear-gradient(135deg, #22a634 0%, #1d8f2c 100%);
    color: #fff; box-shadow: 0 2px 8px rgba(34,166,52,0.28);
  }
  .csm-btn-green:hover:not(:disabled) {
    background: linear-gradient(135deg, #1d8f2c, #187526);
    box-shadow: 0 4px 16px rgba(34,166,52,0.36); transform: translateY(-1px);
  }
  .csm-btn-green:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

  .csm-spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .csm-empty-state { padding: 18px; text-align: center; color: #b0bcd4; font-size: 13px; }
`;

/* ─────────────────────────────────────────────
   Searchable Store Dropdown
───────────────────────────────────────────── */
const StoreDropdown = ({ stores, value, onChange, hasError }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const selected = stores.find((s) => String(s.id) === String(value));

  const filtered = stores.filter((s) =>
    `${s.storeName} ${s.storeCode}`.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery("");
    }
  }, [open]);

  return (
    <div className="csm-dd-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`csm-dd-trigger${open ? " open" : ""}${hasError ? " err" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        {selected ? (
          <>
            <span className="csm-dd-value">{selected.storeName}</span>
            <span className="csm-dd-code">{selected.storeCode}</span>
          </>
        ) : (
          <span className="csm-dd-placeholder">— Choose a store —</span>
        )}
        <ChevronDown
          size={15}
          className={`csm-dd-chevron${open ? " open" : ""}`}
        />
      </button>

      {open && (
        <div className="csm-dd-panel">
          {/* Search bar inside dropdown */}
          <div className="csm-dd-search-bar">
            <Search size={14} color="#a0aabf" />
            <input
              ref={inputRef}
              placeholder="Search store by name or code…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="csm-dd-clear-btn"
                onClick={() => setQuery("")}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options */}
          <div className="csm-dd-list">
            {filtered.length === 0 ? (
              <div className="csm-dd-empty">No stores match "{query}"</div>
            ) : (
              filtered.map((s) => {
                const isSel = String(s.id) === String(value);
                return (
                  <div
                    key={s.id}
                    className={`csm-dd-item${isSel ? " sel" : ""}`}
                    onClick={() => {
                      onChange(String(s.id));
                      setOpen(false);
                    }}
                  >
                    {isSel ? (
                      <Check
                        size={13}
                        color="#22a634"
                        style={{ flexShrink: 0 }}
                      />
                    ) : (
                      <span style={{ width: 13, flexShrink: 0 }} />
                    )}
                    <span style={{ flex: 1 }}>{s.storeName}</span>
                    <span className="csm-dd-item-code">{s.storeCode}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Modal
───────────────────────────────────────────── */
const CreateStoreTargetModal = ({
  isOpen,
  onClose,
  onSave,
  stores = [],
  initialData = null,
}) => {
  const [activeTab, setActiveTab] = useState("single");
  const [targetType, setTargetType] = useState("");
  const [formData, setFormData] = useState({
    storeId: "",
    storeIds: [],
    targetAmount: "",
    targetBags: "",
    startDate: "",
    endDate: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bulkSearch, setBulkSearch] = useState("");
  const modalRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];
  const isEdit = !!initialData;

  const deriveTargetType = (d) => {
    if (!d) return "";
    if (d.targetAmount && d.targetBags) return "both";
    if (d.targetAmount) return "amount";
    if (d.targetBags) return "bags";
    return "";
  };

  const filteredBulk = stores.filter((s) =>
    `${s.storeName} ${s.storeCode}`
      .toLowerCase()
      .includes(bulkSearch.toLowerCase()),
  );

  const allSelected =
    filteredBulk.length > 0 &&
    filteredBulk.every((s) => formData.storeIds.includes(String(s.id)));

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setFormData({
        storeId: initialData.storeId,
        targetAmount: initialData.targetAmount || "",
        targetBags: initialData.targetBags || "",
        startDate: initialData.startDate
          ? new Date(initialData.startDate).toISOString().split("T")[0]
          : "",
        endDate: initialData.endDate
          ? new Date(initialData.endDate).toISOString().split("T")[0]
          : "",
        storeIds: [],
      });
      setTargetType(deriveTargetType(initialData));
      setActiveTab("single");
    } else {
      setFormData({
        storeId: "",
        storeIds: [],
        targetAmount: "",
        targetBags: "",
        startDate: "",
        endDate: "",
      });
      setTargetType("");
      setActiveTab("single");
    }
    setErrors({});
    setSubmitError(null);
    setBulkSearch("");
  }, [isOpen, initialData]);

  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: null }));
    setSubmitError(null);
  };

  const toggleStore = (id) => {
    const sid = String(id);
    setFormData((p) => ({
      ...p,
      storeIds: p.storeIds.includes(sid)
        ? p.storeIds.filter((i) => i !== sid)
        : [...p.storeIds, sid],
    }));
    setErrors((p) => ({ ...p, storeIds: null }));
    setSubmitError(null);
  };

  const toggleAll = () => {
    const ids = filteredBulk.map((s) => String(s.id));
    setFormData((p) => ({
      ...p,
      storeIds: allSelected
        ? p.storeIds.filter((i) => !ids.includes(i))
        : [...new Set([...p.storeIds, ...ids])],
    }));
    setErrors((p) => ({ ...p, storeIds: null }));
  };

  const validate = () => {
    const e = {};
    if (!isEdit && activeTab === "single" && !formData.storeId)
      e.storeId = "Please select a store.";
    if (!isEdit && activeTab === "bulk" && !formData.storeIds.length)
      e.storeIds = "Select at least one store.";
    if (!targetType) e.targetType = "Please choose a target type.";
    if (
      (targetType === "amount" || targetType === "both") &&
      !formData.targetAmount
    )
      e.targetAmount = "Target amount is required.";
    if (
      (targetType === "bags" || targetType === "both") &&
      !formData.targetBags
    )
      e.targetBags = "Target bags is required.";
    if (!formData.startDate) e.startDate = "Start date is required.";
    if (!formData.endDate) e.endDate = "End date is required.";
    if (
      formData.startDate &&
      formData.endDate &&
      formData.endDate < formData.startDate
    )
      e.endDate = "End date must be after start date.";
    return e;
  };

  const handleSubmit = async () => {
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      setSubmitError("Please fix the highlighted fields before continuing.");
      return;
    }
    setLoading(true);
    setSubmitError(null);
    try {
      const payload = {
        targetAmount: formData.targetAmount
          ? Number(formData.targetAmount)
          : undefined,
        targetBags: formData.targetBags
          ? Number(formData.targetBags)
          : undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };
      if (isEdit) {
        await onSave(
          { id: initialData.id, storeId: initialData.storeId, ...payload },
          true,
        );
      } else if (activeTab === "single") {
        await onSave(
          { ...payload, storeId: Number(formData.storeId) },
          false,
          false,
        );
      } else {
        await onSave(
          { ...payload, storeIds: formData.storeIds.map(Number) },
          false,
          true,
        );
      }
      onClose();
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentStore = stores.find(
    (s) => String(s.id) === String(formData.storeId),
  );

  return (
    <>
      <style>{css}</style>
      <div className="csm-overlay" onClick={handleOverlayClick}>
        <div className="csm-modal" ref={modalRef}>
          {/* Header */}
          <div className="csm-header">
            <div className="csm-header-icon">
              {isEdit ? (
                <Target size={19} color="#fff" />
              ) : (
                <Zap size={19} color="#fff" />
              )}
            </div>
            <div className="csm-header-text">
              <h2>{isEdit ? "Edit Store Target" : "Create Store Target"}</h2>
              <p>
                {isEdit
                  ? `Updating target for ${currentStore?.storeName || "store"}`
                  : "Define performance goals for your stores"}
              </p>
            </div>
            <button className="csm-close-btn" type="button" onClick={onClose}>
              <X size={14} />
            </button>
          </div>

          {/* Tabs */}
          {!isEdit && (
            <div className="csm-tabs">
              {[
                {
                  key: "single",
                  label: "Single Store",
                  icon: <Store size={13} />,
                },
                {
                  key: "bulk",
                  label: "Bulk Assign",
                  icon: <Layers size={13} />,
                },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  type="button"
                  className={`csm-tab${activeTab === key ? " active" : ""}`}
                  onClick={() => {
                    setActiveTab(key);
                    setErrors({});
                    setSubmitError(null);
                  }}
                >
                  {icon} {label}
                  {key === "bulk" && formData.storeIds.length > 0 && (
                    <span className="csm-badge">
                      {formData.storeIds.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="csm-body">
            {submitError && (
              <div className="csm-err-banner">
                <AlertTriangle size={15} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Single store dropdown */}
            {!isEdit && activeTab === "single" && (
              <>
                <p className="csm-section-label">
                  <Store size={11} />
                  Store Selection
                </p>
                <div className="csm-field" style={{ marginBottom: 16 }}>
                  <StoreDropdown
                    stores={stores}
                    value={formData.storeId}
                    hasError={!!errors.storeId}
                    onChange={(val) => {
                      setFormData((p) => ({ ...p, storeId: val }));
                      setErrors((p) => ({ ...p, storeId: null }));
                      setSubmitError(null);
                    }}
                  />
                  {errors.storeId && (
                    <div className="csm-field-err">
                      <AlertTriangle size={11} />
                      {errors.storeId}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Bulk stores */}
            {!isEdit && activeTab === "bulk" && (
              <>
                <p className="csm-section-label">
                  <Layers size={11} />
                  Select Stores
                </p>

                {formData.storeIds.length > 0 && (
                  <div className="csm-info-box" style={{ marginBottom: 10 }}>
                    <CheckSquare
                      size={14}
                      color="#22a634"
                      style={{ flexShrink: 0, marginTop: 1 }}
                    />
                    <span>
                      <strong style={{ color: "#22a634" }}>
                        {formData.storeIds.length}
                      </strong>{" "}
                      store{formData.storeIds.length !== 1 ? "s" : ""} selected
                    </span>
                  </div>
                )}

                <div
                  className={`csm-store-list-wrap${errors.storeIds ? " err" : ""}`}
                >
                  {/* Search inside list */}
                  <div className="csm-bulk-search">
                    <Search size={13} color="#a0aabf" />
                    <input
                      placeholder="Search stores…"
                      value={bulkSearch}
                      onChange={(e) => setBulkSearch(e.target.value)}
                    />
                    {bulkSearch && (
                      <button
                        type="button"
                        className="csm-dd-clear-btn"
                        onClick={() => setBulkSearch("")}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Select All */}
                  <div className="csm-select-all-row" onClick={toggleAll}>
                    {allSelected ? (
                      <CheckSquare size={14} color="#22a634" />
                    ) : (
                      <Square size={14} color="#c0c8dc" />
                    )}
                    <span className="csm-select-all-label">
                      {allSelected ? "Deselect All" : "Select All"}
                      {bulkSearch ? " (filtered)" : ""}
                    </span>
                    <span className="csm-badge-outline">
                      {filteredBulk.length}
                    </span>
                  </div>

                  {/* List */}
                  <div className="csm-bulk-list">
                    {filteredBulk.length === 0 ? (
                      <div className="csm-empty-state">
                        No stores match your search
                      </div>
                    ) : (
                      filteredBulk.map((s) => {
                        const checked = formData.storeIds.includes(
                          String(s.id),
                        );
                        return (
                          <div
                            key={s.id}
                            className={`csm-store-item${checked ? " checked" : ""}`}
                            onClick={() => toggleStore(s.id)}
                          >
                            {checked ? (
                              <CheckSquare size={14} color="#22a634" />
                            ) : (
                              <Square size={14} color="#c0c8dc" />
                            )}
                            <span className="csm-store-name">
                              {s.storeName}
                            </span>
                            <span className="csm-store-code">
                              {s.storeCode}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {errors.storeIds && (
                  <div className="csm-warning">
                    <AlertTriangle size={14} />
                    {errors.storeIds}
                  </div>
                )}
              </>
            )}

            {/* Edit mode: locked store */}
            {isEdit && (
              <>
                <p className="csm-section-label">
                  <Store size={11} />
                  Store
                </p>
                <div className="csm-info-box" style={{ marginBottom: 16 }}>
                  <Info
                    size={15}
                    color="#003176"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                  <div>
                    <strong>
                      {currentStore?.storeName || formData.storeId}
                    </strong>
                    {currentStore?.storeCode && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 11,
                          color: "#7a88a8",
                          background: "#f0f3fa",
                          padding: "2px 7px",
                          borderRadius: 4,
                        }}
                      >
                        {currentStore.storeCode}
                      </span>
                    )}
                    <div
                      style={{ fontSize: 11, marginTop: 3, color: "#a0aabf" }}
                    >
                      Store cannot be changed in edit mode.
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="csm-divider" />

            {/* Target type */}
            <p className="csm-section-label">
              <BarChart2 size={11} />
              Target Type
            </p>
            <div
              className="csm-target-cards"
              style={{ marginBottom: errors.targetType ? 4 : 16 }}
            >
              {[
                {
                  key: "amount",
                  Icon: DollarSign,
                  label: "Amount",
                  sub: "Sales value (₹)",
                },
                {
                  key: "bags",
                  Icon: Package,
                  label: "Bags",
                  sub: "Unit quantity",
                },
                { key: "both", Icon: Zap, label: "Both", sub: "Amount & bags" },
              ].map(({ key, Icon, label, sub }) => (
                <div
                  key={key}
                  className={`csm-target-card ${key}${targetType === key ? " active" : ""}`}
                  onClick={() => {
                    setTargetType(key);
                    if (key === "amount")
                      setFormData((p) => ({ ...p, targetBags: "" }));
                    if (key === "bags")
                      setFormData((p) => ({ ...p, targetAmount: "" }));
                    setErrors((p) => ({
                      ...p,
                      targetType: null,
                      targetAmount: null,
                      targetBags: null,
                    }));
                    setSubmitError(null);
                  }}
                >
                  <div className="csm-tc-icon">
                    <Icon size={17} />
                  </div>
                  <div className="csm-tc-label">{label}</div>
                  <div className="csm-tc-sub">{sub}</div>
                  {targetType === key && (
                    <div className="csm-tc-check">
                      <Check size={9} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {errors.targetType && (
              <div className="csm-warning" style={{ marginBottom: 16 }}>
                <AlertTriangle size={14} />
                {errors.targetType}
              </div>
            )}

            {/* Value inputs */}
            {targetType && (
              <div className="csm-row">
                {(targetType === "amount" || targetType === "both") && (
                  <div className="csm-field">
                    <label>
                      <DollarSign size={11} />
                      Target Amount (₹) <span className="req">*</span>
                    </label>
                    <div className="csm-pfx-wrap">
                      <span
                        className="pfx"
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#22a634",
                        }}
                      >
                        ₹
                      </span>
                      <input
                        className={`csm-input${errors.targetAmount ? " err" : ""}`}
                        type="number"
                        name="targetAmount"
                        value={formData.targetAmount}
                        onChange={handleInput}
                        placeholder="e.g. 100000"
                        min="0"
                      />
                    </div>
                    {errors.targetAmount && (
                      <div className="csm-field-err">
                        <AlertTriangle size={11} />
                        {errors.targetAmount}
                      </div>
                    )}
                  </div>
                )}
                {(targetType === "bags" || targetType === "both") && (
                  <div className="csm-field">
                    <label>
                      <Package size={11} />
                      Target Bags <span className="req">*</span>
                    </label>
                    <div className="csm-pfx-wrap">
                      <span className="pfx">
                        <ShoppingBag size={13} />
                      </span>
                      <input
                        className={`csm-input${errors.targetBags ? " err" : ""}`}
                        type="number"
                        name="targetBags"
                        value={formData.targetBags}
                        onChange={handleInput}
                        placeholder="e.g. 50"
                        min="0"
                      />
                    </div>
                    {errors.targetBags && (
                      <div className="csm-field-err">
                        <AlertTriangle size={11} />
                        {errors.targetBags}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="csm-divider" />

            {/* Date range */}
            <p className="csm-section-label">
              <Calendar size={11} />
              Date Range
            </p>
            <div className="csm-row">
              <div className="csm-field">
                <label>
                  <Calendar size={11} />
                  Start Date <span className="req">*</span>
                </label>
                <input
                  className={`csm-input${errors.startDate ? " err" : ""}`}
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInput}
                  min={today}
                  disabled={isEdit}
                />
                {isEdit && (
                  <div className="csm-hint">
                    Locked — cannot be changed in edit mode.
                  </div>
                )}
                {errors.startDate && (
                  <div className="csm-field-err">
                    <AlertTriangle size={11} />
                    {errors.startDate}
                  </div>
                )}
              </div>
              <div className="csm-field">
                <label>
                  <Calendar size={11} />
                  End Date <span className="req">*</span>
                </label>
                <input
                  className={`csm-input${errors.endDate ? " err" : ""}`}
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInput}
                  min={formData.startDate || today}
                />
                {errors.endDate && (
                  <div className="csm-field-err">
                    <AlertTriangle size={11} />
                    {errors.endDate}
                  </div>
                )}
              </div>
            </div>

            {/* Bulk caution */}
            {!isEdit &&
              activeTab === "bulk" &&
              formData.storeIds.length > 0 && (
                <div className="csm-warning">
                  <AlertTriangle size={14} />
                  <span>
                    You're about to create targets for{" "}
                    <strong style={{ color: "#92700a" }}>
                      {formData.storeIds.length} store
                      {formData.storeIds.length !== 1 ? "s" : ""}
                    </strong>{" "}
                    at once. This cannot be undone in bulk — review carefully
                    before saving.
                  </span>
                </div>
              )}

            <div style={{ height: 6 }} />
          </div>

          {/* Footer */}
          <div className="csm-footer">
            <button
              className="csm-btn csm-btn-ghost"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`csm-btn ${!isEdit && activeTab === "bulk" ? "csm-btn-green" : "csm-btn-navy"}`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="csm-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                <>
                  <Check size={14} />
                  Update Target
                </>
              ) : activeTab === "bulk" ? (
                <>
                  <Zap size={14} />
                  Create{" "}
                  {formData.storeIds.length > 0
                    ? `${formData.storeIds.length} `
                    : ""}
                  Target{formData.storeIds.length !== 1 ? "s" : ""}
                </>
              ) : (
                <>
                  <ChevronRight size={14} />
                  Create Target
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateStoreTargetModal;
