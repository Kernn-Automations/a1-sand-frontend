import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import { handleExportExcel, handleExportPDF } from "@/utils/PDFndXLSGenerator";
import xls from "../../../images/xls-logo.jpg";
import pdf from "../../../images/pdf.jpg.jpg";
import {
  LayoutGrid,
  ChevronRight,
  Calendar,
  Store,
  Search,
  X,
  ChevronDown,
  CheckSquare,
  Square,
  RefreshCw,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Shuffle,
  BarChart3,
  Filter,
  Eye,
  EyeOff,
  FileDown,
  AlertCircle,
  Info,
  Boxes,
  ShoppingBag,
  Activity,
  CircleDot,
  Tag,
  ArrowRightLeft,
  Layers,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   BRAND: #003176 (navy) | #22a634 (green)
═══════════════════════════════════════════════ */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');

  .ss-page * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
  .ss-page { background: #f0f4fa; min-height: 100vh; padding: 0 0 52px; }

  /* ── Loader ── */
  .ss-loader-overlay {
    position: fixed; inset: 0; z-index: 9998;
    background: rgba(240,244,250,0.9); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    animation: ssFadeIn 0.2s ease;
  }
  @keyframes ssFadeIn { from{opacity:0} to{opacity:1} }
  .ss-loader-card {
    background: #fff; border-radius: 22px; padding: 36px 48px;
    display: flex; flex-direction: column; align-items: center; gap: 22px;
    box-shadow: 0 8px 48px rgba(0,49,118,0.16); border: 1px solid rgba(0,49,118,0.08);
    animation: ssCardIn 0.28s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes ssCardIn { from{opacity:0;transform:scale(0.92) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
  .ss-loader-bars { display:flex; gap:8px; align-items:flex-end; }
  .ss-lbar { width:12px; border-radius:3px; animation: barPulse 1.3s ease-in-out infinite; }
  .ss-lbar:nth-child(1){height:22px;background:linear-gradient(135deg,#003176,#004aad);animation-delay:0s}
  .ss-lbar:nth-child(2){height:36px;background:linear-gradient(135deg,#22a634,#1a8229);animation-delay:0.12s}
  .ss-lbar:nth-child(3){height:16px;background:linear-gradient(135deg,#003176,#004aad);animation-delay:0.24s}
  .ss-lbar:nth-child(4){height:28px;background:linear-gradient(135deg,#0066cc,#004aad);animation-delay:0.36s}
  .ss-lbar:nth-child(5){height:44px;background:linear-gradient(135deg,#22a634,#1a8229);animation-delay:0.48s}
  @keyframes barPulse { 0%,100%{transform:scaleY(0.7);opacity:0.6} 50%{transform:scaleY(1.15);opacity:1} }
  .ss-loader-scan { width:150px;height:3px;background:#edf0f7;border-radius:99px;overflow:hidden;margin-top:4px }
  .ss-loader-scan-inner { height:100%;width:35%;background:linear-gradient(to right,transparent,#003176,#22a634,transparent);animation:scanMove 1.5s ease-in-out infinite; }
  @keyframes scanMove { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
  .ss-loader-text { font-size:14px;font-weight:600;color:#1a2236;text-align:center }
  .ss-loader-sub { font-size:12px;color:#7a88a8;text-align:center;margin-top:-14px }

  /* ── Breadcrumb ── */
  .ss-breadcrumb { display:flex;align-items:center;gap:6px;font-size:12.5px;color:#7a88a8;padding:16px 28px 0 }
  .ss-breadcrumb-link { cursor:pointer;transition:color 0.15s;display:flex;align-items:center;gap:4px }
  .ss-breadcrumb-link:hover { color:#003176 }
  .ss-breadcrumb .active { color:#003176;font-weight:600 }

  /* ── Page header ── */
  .ss-page-header { display:flex;align-items:flex-start;justify-content:space-between;padding:16px 28px 0;flex-wrap:wrap;gap:12px }
  .ss-page-title h1 { font-size:23px;font-weight:700;color:#0d1a36;margin:0;letter-spacing:-0.025em }
  .ss-page-title p { font-size:13px;color:#7a88a8;margin:3px 0 0 }
  .ss-header-right { display:flex;align-items:center;gap:10px;flex-wrap:wrap }

  /* ── Export buttons ── */
  .ss-export-btn {
    display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;
    font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer;
    transition:all 0.15s;border:1.5px solid;
  }
  .ss-export-btn:disabled{opacity:0.4;cursor:not-allowed}
  .ss-export-btn img{width:16px;height:16px;object-fit:contain;border-radius:3px}
  .ss-export-btn.xls{background:#fff;color:#1d6f42;border-color:#b8dcc8}
  .ss-export-btn.xls:hover:not(:disabled){background:#f0faf4;border-color:#22a634}
  .ss-export-btn.pdf{background:#fff;color:#c0392b;border-color:#f5c0bc}
  .ss-export-btn.pdf:hover:not(:disabled){background:#fff5f4;border-color:#e53e3e}

  /* ── Filter card ── */
  .ss-filter-card {
    margin: 18px 28px 0;
    background: #fff; border-radius: 14px;
    border: 1px solid rgba(0,49,118,0.08);
    box-shadow: 0 2px 10px rgba(0,49,118,0.05);
    padding: 18px 20px;
  }
  .ss-filter-title { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#003176;margin-bottom:14px;display:flex;align-items:center;gap:6px }
  .ss-filter-row { display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end }
  .ss-filter-field { display:flex;flex-direction:column;gap:5px;min-width:150px }
  .ss-filter-field label { font-size:11px;font-weight:700;color:#4a5878;text-transform:uppercase;letter-spacing:0.05em }
  .ss-date-input {
    padding:9px 12px;border:1.5px solid #d0d8ee;border-radius:10px;
    font-size:13px;font-family:inherit;color:#1a2236;background:#fff;
    outline:none;transition:border-color 0.15s;
  }
  .ss-date-input:focus{border-color:#003176;box-shadow:0 0 0 3px rgba(0,49,118,0.1)}

  /* ── Store Dropdown ── */
  .ss-dd-wrap{position:relative;min-width:190px}
  .ss-dd-trigger {
    display:flex;align-items:center;justify-content:space-between;gap:8px;
    padding:9px 12px;width:100%;
    background:#fff;border:1.5px solid #d0d8ee;border-radius:10px;
    font-size:13px;color:#1a2236;cursor:pointer;
    transition:border-color 0.15s,box-shadow 0.15s;font-family:inherit;
  }
  .ss-dd-trigger:hover{border-color:#003176}
  .ss-dd-trigger.open{border-color:#003176;box-shadow:0 0 0 3px rgba(0,49,118,0.1);border-bottom-left-radius:0;border-bottom-right-radius:0}
  .ss-dd-panel {
    position:absolute;top:100%;left:0;min-width:100%;z-index:300;
    background:#fff;border:1.5px solid #003176;border-top:none;
    border-bottom-left-radius:10px;border-bottom-right-radius:10px;
    box-shadow:0 12px 32px rgba(0,49,118,0.14);overflow:hidden;
    animation:ddIn 0.15s ease;min-width:230px;
  }
  @keyframes ddIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  .ss-dd-search{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #edf0f7;background:#f7f9fd;color:#a0aabf}
  .ss-dd-search input{flex:1;border:none;outline:none;background:transparent;font-size:13px;font-family:inherit;color:#1a2236}
  .ss-dd-search input::placeholder{color:#b8c4d8}
  .ss-dd-all{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #edf0f7;background:#f0f5ff;cursor:pointer;user-select:none;font-size:12px;font-weight:600;color:#003176;transition:background 0.1s}
  .ss-dd-all:hover{background:#e4edfb}
  .ss-dd-list{max-height:190px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#d0d8ee transparent}
  .ss-dd-item{display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;font-size:13px;color:#1a2236;border-bottom:1px solid #f4f6fb;transition:background 0.1s;user-select:none}
  .ss-dd-item:last-child{border-bottom:none}
  .ss-dd-item:hover{background:#f4f7ff}
  .ss-dd-item.sel{background:rgba(34,166,52,0.04)}
  .ss-dd-done{padding:8px 12px;border-top:1px solid #edf0f7;background:#f7f9fd;display:flex;justify-content:flex-end}
  .ss-dd-done button{background:#003176;color:#fff;border:none;border-radius:7px;padding:5px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
  .ss-dd-done button:hover{background:#00276a}

  /* filter buttons */
  .ss-btn{display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all 0.16s;border:none;white-space:nowrap}
  .ss-btn-primary{background:linear-gradient(135deg,#003176,#004299);color:#fff;box-shadow:0 2px 8px rgba(0,49,118,0.22)}
  .ss-btn-primary:hover{background:linear-gradient(135deg,#00276a,#003c8a);transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,49,118,0.3)}
  .ss-btn-ghost{background:#fff;color:#4a5878;border:1.5px solid #d0d8ee}
  .ss-btn-ghost:hover{border-color:#003176;color:#003176}

  /* store tags */
  .ss-store-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
  .ss-store-tag{display:flex;align-items:center;gap:5px;padding:3px 8px 3px 10px;background:rgba(0,49,118,0.07);border:1px solid rgba(0,49,118,0.14);color:#003176;border-radius:99px;font-size:12px;font-weight:500;animation:tagIn 0.2s ease}
  @keyframes tagIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
  .ss-store-tag button{background:none;border:none;cursor:pointer;padding:0;color:#003176;display:flex;align-items:center;transition:color 0.12s}
  .ss-store-tag button:hover{color:#e53e3e}
  .ss-tag-clear{display:flex;align-items:center;gap:4px;padding:3px 10px;background:rgba(229,62,62,0.07);border:1px solid rgba(229,62,62,0.18);color:#e53e3e;border-radius:99px;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.15s}
  .ss-tag-clear:hover{background:rgba(229,62,62,0.12)}

  /* ── KPI strip ── */
  .ss-kpi-strip{display:flex;gap:12px;padding:18px 28px 0;overflow-x:auto;scrollbar-width:none;flex-wrap:wrap}
  .ss-kpi-strip::-webkit-scrollbar{display:none}
  .ss-kpi-card{
    flex:1;min-width:140px;background:#fff;border-radius:14px;padding:14px 16px;
    border:1px solid rgba(0,49,118,0.07);box-shadow:0 1px 6px rgba(0,49,118,0.04);
    position:relative;overflow:hidden;animation:kpiIn 0.4s ease both;
    transition:box-shadow 0.18s,transform 0.18s;cursor:default;
  }
  .ss-kpi-card:hover{box-shadow:0 4px 18px rgba(0,49,118,0.1);transform:translateY(-2px)}
  .ss-kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:14px 14px 0 0}
  .ss-kpi-card.navy::before{background:#003176}
  .ss-kpi-card.green::before{background:#22a634}
  .ss-kpi-card.blue::before{background:#0066cc}
  .ss-kpi-card.amber::before{background:#f59e0b}
  .ss-kpi-card.red::before{background:#ef4444}
  .ss-kpi-card.purple::before{background:#7c3aed}
  .ss-kpi-card.cyan::before{background:#0891b2}
  @keyframes kpiIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .ss-kpi-card:nth-child(1){animation-delay:0.04s}.ss-kpi-card:nth-child(2){animation-delay:0.08s}
  .ss-kpi-card:nth-child(3){animation-delay:0.12s}.ss-kpi-card:nth-child(4){animation-delay:0.16s}
  .ss-kpi-card:nth-child(5){animation-delay:0.20s}.ss-kpi-card:nth-child(6){animation-delay:0.24s}
  .ss-kpi-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
  .ss-kpi-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center}
  .ss-kpi-card.navy  .ss-kpi-icon{background:rgba(0,49,118,0.08);color:#003176}
  .ss-kpi-card.green .ss-kpi-icon{background:rgba(34,166,52,0.10);color:#22a634}
  .ss-kpi-card.blue  .ss-kpi-icon{background:rgba(0,102,204,0.08);color:#0066cc}
  .ss-kpi-card.amber .ss-kpi-icon{background:rgba(245,158,11,0.10);color:#d97706}
  .ss-kpi-card.red   .ss-kpi-icon{background:rgba(239,68,68,0.10);color:#ef4444}
  .ss-kpi-card.purple .ss-kpi-icon{background:rgba(124,58,237,0.08);color:#7c3aed}
  .ss-kpi-card.cyan  .ss-kpi-icon{background:rgba(8,145,178,0.08);color:#0891b2}
  .ss-kpi-num{font-size:21px;font-weight:700;color:#0d1a36;line-height:1;margin-bottom:3px}
  .ss-kpi-label{font-size:11px;font-weight:600;color:#8a94b0;text-transform:uppercase;letter-spacing:0.05em}
  .ss-kpi-sub{font-size:11px;color:#a0aabf;margin-top:2px;font-family:'DM Mono',monospace}

  /* ── Table card ── */
  .ss-table-card{
    margin:18px 28px 0;background:#fff;border-radius:16px;
    border:1px solid rgba(0,49,118,0.08);box-shadow:0 2px 12px rgba(0,49,118,0.05);
    overflow:hidden;
  }
  .ss-table-header{
    display:flex;align-items:center;justify-content:space-between;
    padding:14px 18px;border-bottom:1px solid #edf0f7;
    background:linear-gradient(to right,rgba(0,49,118,0.025),transparent);
    flex-wrap:wrap;gap:8px;
  }
  .ss-table-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:#0d1a36}
  .ss-count-badge{font-size:11px;font-weight:700;padding:2px 9px;background:rgba(0,49,118,0.08);color:#003176;border-radius:99px}
  .ss-store-count{font-size:11px;color:#7a88a8;display:flex;align-items:center;gap:4px}
  .ss-values-toggle{display:flex;align-items:center;gap:7px;padding:6px 14px;border-radius:9px;font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer;transition:all 0.16s;border:1.5px solid}
  .ss-values-toggle.off{background:#fff;color:#4a5878;border-color:#d0d8ee}
  .ss-values-toggle.off:hover{border-color:#003176;color:#003176}
  .ss-values-toggle.on{background:rgba(0,49,118,0.08);color:#003176;border-color:#003176}

  /* ── Product table ── */
  .ss-table{width:100%;border-collapse:collapse}
  .ss-table thead th{
    padding:10px 14px;font-size:11px;font-weight:700;
    text-transform:uppercase;letter-spacing:0.06em;color:#8a94b0;
    border-bottom:1px solid #edf0f7;white-space:nowrap;
    background:#f7f9fd;
  }
  .ss-table thead th.group-header{
    text-align:center;font-size:10px;background:#f0f4fb;
    border-bottom:1px solid #e4ecf7;color:#003176;letter-spacing:0.08em;
  }
  .ss-table thead th.qty{text-align:right}
  .ss-table thead th.price{text-align:right;color:#22a634}
  .ss-table tbody tr{border-bottom:1px solid #f0f3fa;transition:background 0.1s;animation:rowIn 0.25s ease both}
  @keyframes rowIn{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:translateX(0)}}
  .ss-table tbody tr:hover{background:#f7faff}
  .ss-table tbody tr:last-child{border-bottom:none}
  .ss-table tbody td{padding:12px 14px;font-size:13px;color:#2a3452;vertical-align:middle}
  .ss-table tbody td.num{text-align:right;font-family:'DM Mono',monospace;font-size:12.5px;font-weight:500;color:#0d1a36}
  .ss-table tbody td.price-col{text-align:right;font-family:'DM Mono',monospace;font-size:12px;color:#5a7060;font-weight:400}
  .ss-table tbody td.closing{font-weight:700}
  .ss-table tbody td.closing .num-val{font-size:14px;font-weight:700;color:#003176}
  .ss-table tbody td.closing .price-val{font-size:11px;color:#22a634;font-family:'DM Mono',monospace;display:block;margin-top:1px}

  /* product name cell */
  .ss-product-cell{display:flex;align-items:center;gap:10px}
  .ss-product-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
  .ss-product-name{font-weight:600;color:#0d1a36;font-size:13.5px}
  .ss-product-unit{font-size:11px;font-family:'DM Mono',monospace;background:#f0f3fa;color:#7a88a8;padding:2px 6px;border-radius:4px;margin-left:4px}

  /* flow badges */
  .ss-flow-cell{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
  .ss-flow-in{color:#22a634;font-weight:600}
  .ss-flow-out{color:#ef4444;font-weight:600}
  .ss-flow-neutral{color:#0066cc;font-weight:600}

  /* mini bar in closing */
  .ss-closing-bar{height:4px;border-radius:99px;background:#edf0f7;margin-top:4px;overflow:hidden}
  .ss-closing-bar-fill{height:100%;border-radius:99px;background:linear-gradient(to right,#003176,#22a634);transition:width 0.6s ease}

  /* ── Empty / alert ── */
  .ss-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;gap:10px}
  .ss-empty-icon{width:60px;height:60px;border-radius:16px;background:rgba(0,49,118,0.06);display:flex;align-items:center;justify-content:center;color:#a0aabf;margin-bottom:6px}
  .ss-empty h3{font-size:15px;font-weight:700;color:#4a5878;margin:0}
  .ss-empty p{font-size:13px;color:#a0aabf;margin:0;text-align:center}

  .ss-alert{display:flex;align-items:flex-start;gap:10px;margin:16px 28px 0;padding:12px 16px;border-radius:12px;font-size:13px}
  .ss-alert.info{background:rgba(0,49,118,0.04);border:1px solid rgba(0,49,118,0.12);color:#003176}

  /* ── Spinning ── */
  .ss-spinning{animation:spin 1s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}

  /* ── Summary footer bar ── */
  .ss-summary-footer{
    display:flex;gap:24px;align-items:center;flex-wrap:wrap;
    padding:12px 18px;border-top:1px solid #edf0f7;background:#f7f9fd;
    font-size:12.5px;
  }
  .ss-footer-stat{display:flex;align-items:center;gap:6px;color:#4a5878}
  .ss-footer-stat strong{color:#0d1a36;font-family:'DM Mono',monospace}

  @media(max-width:768px){
    .ss-page-header,.ss-filter-card,.ss-kpi-strip,.ss-table-card,.ss-alert{margin-left:16px;margin-right:16px;padding-left:16px;padding-right:16px}
    .ss-breadcrumb{padding-left:16px;padding-right:16px}
  }
`;

/* ── Product color palette ── */
const PRODUCT_COLORS = [
  "#003176",
  "#22a634",
  "#0066cc",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#e53e3e",
  "#059669",
];

/* ── Loader ── */
function StockLoader() {
  return (
    <div className="ss-loader-overlay">
      <div className="ss-loader-card">
        <div>
          <div className="ss-loader-bars">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="ss-lbar" />
            ))}
          </div>
          <div className="ss-loader-scan">
            <div className="ss-loader-scan-inner" />
          </div>
        </div>
        <div>
          <div className="ss-loader-text">
            Calculating stock summary<span style={{ color: "#003176" }}>…</span>
          </div>
          <div className="ss-loader-sub">
            Aggregating data across {83} stores
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Store Dropdown ── */
function StoreDropdown({
  stores,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = stores.filter((s) =>
    (s.name || s.storeName || "").toLowerCase().includes(q.toLowerCase()),
  );
  const allSel = stores.length > 0 && selectedIds.length === stores.length;

  useEffect(() => {
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQ("");
  }, [open]);

  const label =
    selectedIds.length === 0
      ? "All Stores"
      : `${selectedIds.length} Store${selectedIds.length !== 1 ? "s" : ""} Selected`;

  return (
    <div className="ss-dd-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`ss-dd-trigger${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Store size={14} color={selectedIds.length ? "#003176" : "#a0aabf"} />
          <span
            style={{
              color: selectedIds.length ? "#003176" : "#a0aabf",
              fontSize: 13,
            }}
          >
            {label}
          </span>
        </span>
        <ChevronDown
          size={14}
          style={{
            color: "#a0aabf",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>
      {open && (
        <div className="ss-dd-panel">
          <div className="ss-dd-search">
            <Search size={13} />
            <input
              ref={inputRef}
              placeholder="Search stores…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  color: "#a0aabf",
                }}
                onClick={() => setQ("")}
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div
            className="ss-dd-all"
            onClick={() => (allSel ? onDeselectAll() : onSelectAll())}
          >
            {allSel ? (
              <CheckSquare size={14} color="#22a634" />
            ) : (
              <Square size={14} color="#c0c8dc" />
            )}
            <span>{allSel ? "Deselect All" : "Select All"}</span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                background: "rgba(0,49,118,0.1)",
                color: "#003176",
                padding: "1px 7px",
                borderRadius: 99,
                fontWeight: 700,
              }}
            >
              {filtered.length}
            </span>
          </div>
          <div className="ss-dd-list">
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: 14,
                  textAlign: "center",
                  color: "#b0bcd4",
                  fontSize: 13,
                }}
              >
                No stores found
              </div>
            ) : (
              filtered.map((s) => {
                const checked = selectedIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    className={`ss-dd-item${checked ? " sel" : ""}`}
                    onClick={() => onToggle(s.id)}
                  >
                    {checked ? (
                      <CheckSquare size={14} color="#22a634" />
                    ) : (
                      <Square size={14} color="#c0c8dc" />
                    )}
                    <span>{s.name || s.storeName}</span>
                  </div>
                );
              })
            )}
          </div>
          <div className="ss-dd-done">
            <button onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
function StockSummary({ navigate }) {
  const { axiosAPI } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [stockData, setStockData] = useState([]); // array from res.data.data
  const [storeCount, setStoreCount] = useState(0);
  const [selectedStoreIds, setSelectedStoreIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showValues, setShowValues] = useState(false); // toggle price columns

  /* ─ Fetch stores ─ */
  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await axiosAPI.get("/auth/available-stores");
        let stores =
          res.data?.data ||
          res.data?.stores ||
          (Array.isArray(res.data) ? res.data : []);
        stores = stores.filter((s) => s.storeType?.toLowerCase() === "own");
        setWarehouses(stores);
        if (stores.length === 1) setSelectedStoreIds([stores[0].id]);
      } catch {
        try {
          const res = await axiosAPI.get("/stores?limit=1000");
          setWarehouses(res.data.stores || res.data.data || []);
        } catch {
          setError("Failed to load store list");
        }
      }
    }
    fetchStores();
  }, []);

  /* ─ Fetch stock ─ */
  const fetchStock = async () => {
    if (!from || !to) {
      setError("Please select both From and To dates.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ids =
        selectedStoreIds.length > 0
          ? selectedStoreIds
          : warehouses.map((w) => w.id);
      const res = await axiosAPI.get(
        `/store-stock-summary/company/summary?storeIds=${ids.join(",")}&fromDate=${from}&toDate=${to}`,
      );
      // API returns: res.data.data = { success, data: [...], storeCount, ... }
      const inner = res.data?.data || res.data || {};
      setStockData(
        Array.isArray(inner.data)
          ? inner.data
          : Array.isArray(inner)
            ? inner
            : [],
      );
      setStoreCount(inner.storeCount || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch stock summary.");
    } finally {
      setLoading(false);
    }
  };

  /* ─ Export ─ */
  const onExport = (type) => {
    if (!stockData.length) {
      setError("No data to export");
      return;
    }
    const baseCols = [
      "Product",
      "Unit",
      "Opening",
      "Inward",
      "Stock In",
      "Outward",
      "Stock Out",
      "Closing",
    ];
    const priceCols = [
      "Opening ₹",
      "Inward ₹",
      "Stock In ₹",
      "Outward ₹",
      "Stock Out ₹",
      "Closing ₹",
    ];
    const cols = showValues ? [...baseCols, ...priceCols] : baseCols;
    const rows = stockData.map((d) => {
      const base = [
        d.productName,
        d.unit,
        d.openingStock,
        d.inwardStock,
        d.stockIn,
        d.outwardStock,
        d.stockOut,
        d.closingStock,
      ];
      const price = [
        d.openingStockPrice,
        d.inwardStockPrice,
        d.stockInPrice,
        d.outwardStockPrice,
        d.stockOutPrice,
        d.closingStockPrice,
      ];
      return showValues ? [...base, ...price] : base;
    });
    if (type === "XLS") handleExportExcel(cols, rows, "Stock Summary Report");
    else handleExportPDF(cols, rows, "Stock Summary Report");
  };

  /* ─ Aggregate KPIs ─ */
  const totalOpening = stockData.reduce((s, d) => s + (d.openingStock || 0), 0);
  const totalClosing = stockData.reduce((s, d) => s + (d.closingStock || 0), 0);
  const totalInward = stockData.reduce(
    (s, d) => s + (d.inwardStock || 0) + (d.stockIn || 0),
    0,
  );
  const totalOutward = stockData.reduce(
    (s, d) => s + (d.outwardStock || 0) + (d.stockOut || 0),
    0,
  );
  const totalClosingValue = stockData.reduce(
    (s, d) => s + (d.closingStockPrice || 0),
    0,
  );
  const netMovement = totalInward - totalOutward;
  const maxClosing = Math.max(...stockData.map((d) => d.closingStock || 0), 1);

  const kpis = [
    {
      cls: "navy",
      Icon: Boxes,
      label: "Products",
      value: stockData.length,
      sub: `across ${storeCount} stores`,
    },
    {
      cls: "green",
      Icon: TrendingUp,
      label: "Total Inward",
      value: totalInward,
      sub: "bags received",
    },
    {
      cls: "red",
      Icon: TrendingDown,
      label: "Total Outward",
      value: totalOutward,
      sub: "bags dispatched",
    },
    {
      cls: "blue",
      Icon: ArrowRightLeft,
      label: "Net Movement",
      value: (netMovement >= 0 ? "+" : "") + netMovement,
      sub: netMovement >= 0 ? "positive flow" : "negative flow",
    },
    {
      cls: "amber",
      Icon: Package,
      label: "Opening Stock",
      value: totalOpening,
      sub: "bags at period start",
    },
    {
      cls: "purple",
      Icon: BarChart3,
      label: "Closing Stock",
      value: totalClosing,
      sub: "bags at period end",
    },
    {
      cls: "cyan",
      Icon: DollarSign,
      label: "Closing Value",
      value: `₹${(totalClosingValue / 100000).toFixed(1)}L`,
      sub: "total inventory value",
    },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="ss-page">
        {loading && <StockLoader />}
        {error && <ErrorModal message={error} onClose={() => setError(null)} />}

        {/* Breadcrumb */}
        <div className="ss-breadcrumb">
          <span
            className="ss-breadcrumb-link"
            onClick={() => navigate("/inventory")}
          >
            <LayoutGrid size={13} /> Inventory
          </span>
          <ChevronRight size={12} style={{ color: "#c0c8dc" }} />
          <span className="active">Stock Summary</span>
        </div>

        {/* Page header */}
        <div className="ss-page-header">
          <div className="ss-page-title">
            <h1>Stock Summary</h1>
            <p>Opening → Inward → Outward → Closing for the selected period</p>
          </div>
          <div className="ss-header-right">
            <button
              className="ss-export-btn xls"
              onClick={() => onExport("XLS")}
              disabled={!stockData.length}
            >
              <img src={xls} alt="XLS" /> <FileDown size={13} /> Export XLS
            </button>
            <button
              className="ss-export-btn pdf"
              onClick={() => onExport("PDF")}
              disabled={!stockData.length}
            >
              <img src={pdf} alt="PDF" /> <FileDown size={13} /> Export PDF
            </button>
          </div>
        </div>

        {/* Filter Card */}
        <div className="ss-filter-card">
          <div className="ss-filter-title">
            <Filter size={12} /> Filters
          </div>
          <div className="ss-filter-row">
            <div className="ss-filter-field">
              <label>From Date</label>
              <input
                className="ss-date-input"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="ss-filter-field">
              <label>To Date</label>
              <input
                className="ss-date-input"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="ss-filter-field">
              <label>Stores</label>
              <StoreDropdown
                stores={warehouses}
                selectedIds={selectedStoreIds}
                onToggle={(id) =>
                  setSelectedStoreIds((p) =>
                    p.includes(id) ? p.filter((i) => i !== id) : [...p, id],
                  )
                }
                onSelectAll={() =>
                  setSelectedStoreIds(warehouses.map((w) => w.id))
                }
                onDeselectAll={() => setSelectedStoreIds([])}
              />
            </div>
            <div style={{ display: "flex", gap: 8, paddingTop: 22 }}>
              <button className="ss-btn ss-btn-primary" onClick={fetchStock}>
                <RefreshCw size={14} className={loading ? "ss-spinning" : ""} />{" "}
                Submit
              </button>
              <button
                className="ss-btn ss-btn-ghost"
                onClick={() => navigate("/inventory")}
              >
                <ArrowLeft size={14} /> Cancel
              </button>
            </div>
          </div>

          {/* Selected store tags */}
          {selectedStoreIds.length > 0 && (
            <div className="ss-store-tags">
              {selectedStoreIds.map((id) => {
                const s = warehouses.find((w) => w.id === id);
                if (!s) return null;
                return (
                  <span key={id} className="ss-store-tag">
                    <Store size={10} />
                    {s.name || s.storeName}
                    <button
                      onClick={() =>
                        setSelectedStoreIds((p) => p.filter((i) => i !== id))
                      }
                    >
                      <X size={10} />
                    </button>
                  </span>
                );
              })}
              <span
                className="ss-tag-clear"
                onClick={() => setSelectedStoreIds([])}
              >
                <X size={11} /> Clear All
              </span>
            </div>
          )}
        </div>

        {/* Hint if no data yet */}
        {!loading && stockData.length === 0 && (
          <div className="ss-alert info">
            <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Set your date range and stores, then click <strong>Submit</strong>{" "}
              to load the stock summary.
            </span>
          </div>
        )}

        {/* KPI Strip */}
        {stockData.length > 0 && (
          <div className="ss-kpi-strip">
            {kpis.map((k, i) => (
              <div key={k.label} className={`ss-kpi-card ${k.cls}`}>
                <div className="ss-kpi-top">
                  <div className="ss-kpi-icon">
                    <k.Icon size={17} />
                  </div>
                </div>
                <div className="ss-kpi-num">{k.value}</div>
                <div className="ss-kpi-label">{k.label}</div>
                <div className="ss-kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Main Table */}
        {stockData.length > 0 && (
          <div className="ss-table-card">
            <div className="ss-table-header">
              <div className="ss-table-title">
                <BarChart3 size={15} color="#003176" />
                Stock Movement
                <span className="ss-count-badge">
                  {stockData.length} products
                </span>
                {storeCount > 0 && (
                  <span className="ss-store-count">
                    <Store size={11} /> {storeCount} stores
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Period indicator */}
                <span
                  style={{
                    fontSize: 12,
                    color: "#7a88a8",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Calendar size={12} />
                  {from} → {to}
                </span>
                {/* Values toggle */}
                <button
                  className={`ss-values-toggle${showValues ? " on" : " off"}`}
                  onClick={() => setShowValues((v) => !v)}
                >
                  {showValues ? (
                    <>
                      <EyeOff size={13} /> Hide ₹ Values
                    </>
                  ) : (
                    <>
                      <Eye size={13} /> Show ₹ Values
                    </>
                  )}
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="ss-table">
                <thead>
                  {/* Group headers */}
                  <tr>
                    <th
                      rowSpan={2}
                      style={{ verticalAlign: "middle", background: "#f7f9fd" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Package size={11} />
                        Product
                      </div>
                    </th>
                    <th
                      colSpan={showValues ? 2 : 1}
                      className="group-header"
                      style={{ borderLeft: "1px solid #e4ecf7" }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <CircleDot size={10} />
                        Opening
                      </span>
                    </th>
                    <th
                      colSpan={showValues ? 4 : 2}
                      className="group-header"
                      style={{
                        background: "rgba(34,166,52,0.04)",
                        color: "#22a634",
                        borderLeft: "1px solid #d0f0da",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <ArrowDownCircle size={10} />
                        Inflows
                      </span>
                    </th>
                    <th
                      colSpan={showValues ? 4 : 2}
                      className="group-header"
                      style={{
                        background: "rgba(239,68,68,0.04)",
                        color: "#ef4444",
                        borderLeft: "1px solid #fdd0d0",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <ArrowUpCircle size={10} />
                        Outflows
                      </span>
                    </th>
                    <th
                      colSpan={showValues ? 2 : 1}
                      className="group-header"
                      style={{
                        background: "rgba(0,49,118,0.04)",
                        color: "#003176",
                        borderLeft: "1px solid #c0d0e8",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <BarChart3 size={10} />
                        Closing
                      </span>
                    </th>
                  </tr>
                  <tr>
                    {/* Opening */}
                    <th
                      className="qty"
                      style={{ borderLeft: "1px solid #e4ecf7" }}
                    >
                      Qty
                    </th>
                    {showValues && <th className="price">₹ Value</th>}
                    {/* Inflows */}
                    <th
                      className="qty"
                      style={{
                        borderLeft: "1px solid #d0f0da",
                        color: "#22a634",
                      }}
                    >
                      Inward
                    </th>
                    {showValues && (
                      <th className="price" style={{ color: "#22a634" }}>
                        ₹
                      </th>
                    )}
                    <th className="qty" style={{ color: "#22a634" }}>
                      Stock In
                    </th>
                    {showValues && (
                      <th className="price" style={{ color: "#22a634" }}>
                        ₹
                      </th>
                    )}
                    {/* Outflows */}
                    <th
                      className="qty"
                      style={{
                        borderLeft: "1px solid #fdd0d0",
                        color: "#ef4444",
                      }}
                    >
                      Outward
                    </th>
                    {showValues && (
                      <th className="price" style={{ color: "#ef4444" }}>
                        ₹
                      </th>
                    )}
                    <th className="qty" style={{ color: "#ef4444" }}>
                      Stock Out
                    </th>
                    {showValues && (
                      <th className="price" style={{ color: "#ef4444" }}>
                        ₹
                      </th>
                    )}
                    {/* Closing */}
                    <th
                      className="qty"
                      style={{
                        borderLeft: "1px solid #c0d0e8",
                        color: "#003176",
                      }}
                    >
                      Closing
                    </th>
                    {showValues && (
                      <th className="price" style={{ color: "#003176" }}>
                        ₹ Value
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {stockData.map((item, idx) => {
                    const color = PRODUCT_COLORS[idx % PRODUCT_COLORS.length];
                    const closingPct = Math.round(
                      (item.closingStock / maxClosing) * 100,
                    );
                    return (
                      <tr
                        key={item.productId || idx}
                        style={{ animationDelay: `${idx * 0.04}s` }}
                      >
                        {/* Product name */}
                        <td>
                          <div className="ss-product-cell">
                            <div
                              className="ss-product-dot"
                              style={{ background: color }}
                            />
                            <div>
                              <div className="ss-product-name">
                                {item.productName}
                              </div>
                              <span className="ss-product-unit">
                                {item.unit}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Opening */}
                        <td
                          className="num"
                          style={{ borderLeft: "1px solid #f0f3fa" }}
                        >
                          {item.openingStock?.toLocaleString() ?? "—"}
                        </td>
                        {showValues && (
                          <td className="price-col">
                            ₹{item.openingStockPrice?.toLocaleString() ?? 0}
                          </td>
                        )}

                        {/* Inward */}
                        <td
                          className="num ss-flow-in"
                          style={{ borderLeft: "1px solid #f0f3fa" }}
                        >
                          +{item.inwardStock?.toLocaleString() ?? 0}
                        </td>
                        {showValues && (
                          <td
                            className="price-col"
                            style={{ color: "#22a634" }}
                          >
                            ₹{item.inwardStockPrice?.toLocaleString() ?? 0}
                          </td>
                        )}
                        {/* Stock In */}
                        <td className="num ss-flow-neutral">
                          +{item.stockIn?.toLocaleString() ?? 0}
                        </td>
                        {showValues && (
                          <td
                            className="price-col"
                            style={{ color: "#0066cc" }}
                          >
                            ₹{item.stockInPrice?.toLocaleString() ?? 0}
                          </td>
                        )}

                        {/* Outward */}
                        <td
                          className="num ss-flow-out"
                          style={{ borderLeft: "1px solid #f0f3fa" }}
                        >
                          −{item.outwardStock?.toLocaleString() ?? 0}
                        </td>
                        {showValues && (
                          <td
                            className="price-col"
                            style={{ color: "#ef4444" }}
                          >
                            ₹{item.outwardStockPrice?.toLocaleString() ?? 0}
                          </td>
                        )}
                        {/* Stock Out */}
                        <td className="num ss-flow-out">
                          −{item.stockOut?.toLocaleString() ?? 0}
                        </td>
                        {showValues && (
                          <td
                            className="price-col"
                            style={{ color: "#ef4444" }}
                          >
                            ₹{item.stockOutPrice?.toLocaleString() ?? 0}
                          </td>
                        )}

                        {/* Closing */}
                        <td
                          className="closing"
                          style={{
                            borderLeft: "2px solid #c0d0e8",
                            minWidth: 110,
                          }}
                        >
                          <span className="num-val" style={{ color: color }}>
                            {item.closingStock?.toLocaleString() ?? "—"}
                          </span>
                          {showValues && (
                            <span className="price-val">
                              ₹
                              {item.closingStockPrice?.toLocaleString("en-IN", {
                                maximumFractionDigits: 0,
                              }) ?? 0}
                            </span>
                          )}
                          <div className="ss-closing-bar">
                            <div
                              className="ss-closing-bar-fill"
                              style={{
                                width: `${closingPct}%`,
                                background: color,
                              }}
                            />
                          </div>
                        </td>
                        {showValues && (
                          <td
                            className="price-col"
                            style={{ color: color, fontWeight: 600 }}
                          >
                            ₹
                            {item.closingStockPrice?.toLocaleString("en-IN", {
                              maximumFractionDigits: 0,
                            }) ?? 0}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary footer */}
            <div className="ss-summary-footer">
              <div className="ss-footer-stat">
                <CircleDot size={13} color="#7a88a8" />
                Opening: <strong>{totalOpening.toLocaleString()}</strong> bags
              </div>
              <div className="ss-footer-stat">
                <ArrowDownCircle size={13} color="#22a634" />
                Total In:{" "}
                <strong style={{ color: "#22a634" }}>
                  {totalInward.toLocaleString()}
                </strong>{" "}
                bags
              </div>
              <div className="ss-footer-stat">
                <ArrowUpCircle size={13} color="#ef4444" />
                Total Out:{" "}
                <strong style={{ color: "#ef4444" }}>
                  {totalOutward.toLocaleString()}
                </strong>{" "}
                bags
              </div>
              <div className="ss-footer-stat">
                <BarChart3 size={13} color="#003176" />
                Closing:{" "}
                <strong style={{ color: "#003176" }}>
                  {totalClosing.toLocaleString()}
                </strong>{" "}
                bags
              </div>
              {showValues && (
                <div className="ss-footer-stat" style={{ marginLeft: "auto" }}>
                  <DollarSign size={13} color="#22a634" />
                  Total Closing Value:{" "}
                  <strong style={{ color: "#22a634", fontSize: 14 }}>
                    ₹
                    {totalClosingValue.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state after load */}
        {!loading && stockData.length === 0 && from && to && (
          <div className="ss-table-card" style={{ marginTop: 18 }}>
            <div className="ss-empty">
              <div className="ss-empty-icon">
                <BarChart3 size={26} />
              </div>
              <h3>No Stock Data Found</h3>
              <p>
                No transactions recorded for the selected period and stores.
                <br />
                Try a wider date range or different store filters.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default StockSummary;
