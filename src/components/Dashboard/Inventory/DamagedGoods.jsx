import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/Auth";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";
import {
  LayoutGrid,
  ChevronRight,
  AlertTriangle,
  Package,
  Store,
  Search,
  X,
  ChevronLeft,
  ChevronRight as ChevRight,
  Eye,
  RefreshCw,
  ArrowLeft,
  Filter,
  Calendar,
  Tag,
  Hash,
  MapPin,
  FileText,
  ShieldAlert,
  ClipboardList,
  Boxes,
  TrendingDown,
  Info,
  XCircle,
} from "lucide-react";

/* ═══════════════════════════════════════
   BRAND  #003176 navy | #22a634 green
═══════════════════════════════════════ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');

.dg * { box-sizing:border-box; font-family:'DM Sans',sans-serif; }
.dg { background:#f0f4fa; min-height:100vh; padding:0 0 60px; }

/* ── Loader overlay ── */
.dg-loader {
  position:fixed; inset:0; z-index:9999;
  background:rgba(240,244,250,0.88); backdrop-filter:blur(10px);
  display:flex; align-items:center; justify-content:center;
  animation:lgFade .2s ease;
}
@keyframes lgFade{from{opacity:0}to{opacity:1}}
.dg-loader-box {
  background:#fff; border-radius:24px; padding:38px 52px;
  display:flex; flex-direction:column; align-items:center; gap:24px;
  box-shadow:0 12px 56px rgba(0,49,118,.18); border:1px solid rgba(0,49,118,.08);
  animation:lgBox .28s cubic-bezier(.34,1.56,.64,1);
}
@keyframes lgBox{from{opacity:0;transform:scale(.9) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}

/* warning boxes animation */
.dg-loader-boxes { display:flex; gap:10px; align-items:flex-end; }
.dg-lb {
  border-radius:4px; position:relative; overflow:hidden;
  animation:lbPulse 1.4s ease-in-out infinite;
}
.dg-lb::after {
  content:'✕';
  position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  font-size:10px; font-weight:700; color:rgba(255,255,255,.7);
}
.dg-lb:nth-child(1){width:18px;height:28px;background:linear-gradient(180deg,#e53e3e,#c0392b);animation-delay:0s}
.dg-lb:nth-child(2){width:18px;height:40px;background:linear-gradient(180deg,#f59e0b,#d97706);animation-delay:.16s}
.dg-lb:nth-child(3){width:18px;height:22px;background:linear-gradient(180deg,#e53e3e,#c0392b);animation-delay:.32s}
.dg-lb:nth-child(4){width:18px;height:34px;background:linear-gradient(180deg,#003176,#004aad);animation-delay:.48s}
.dg-lb:nth-child(5){width:18px;height:44px;background:linear-gradient(180deg,#f59e0b,#d97706);animation-delay:.64s}
@keyframes lbPulse{0%,100%{transform:scaleY(.65);opacity:.55}50%{transform:scaleY(1.15);opacity:1}}

/* caution stripe */
.dg-loader-stripe {
  width:160px; height:6px; border-radius:99px; overflow:hidden; margin-top:2px;
  background:repeating-linear-gradient(90deg,#e53e3e 0,#e53e3e 8px,#f59e0b 8px,#f59e0b 16px);
  opacity:.35;
}
.dg-loader-scan {
  width:160px; height:3px; background:#e8edf5; border-radius:99px; overflow:hidden;
}
.dg-loader-scan-inner {
  height:100%; width:38%;
  background:linear-gradient(to right,transparent,#e53e3e,#f59e0b,transparent);
  animation:scanMove 1.5s ease-in-out infinite;
}
@keyframes scanMove{0%{transform:translateX(-120%)}100%{transform:translateX(380%)}}
.dg-loader-txt { font-size:14px; font-weight:600; color:#1a2236; text-align:center; }
.dg-loader-sub { font-size:12px; color:#8a94b0; text-align:center; margin-top:-16px; }

/* ── Breadcrumb ── */
.dg-bc{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#7a88a8;padding:16px 28px 0}
.dg-bc-link{cursor:pointer;transition:color .15s;display:flex;align-items:center;gap:4px}
.dg-bc-link:hover{color:#003176}
.dg-bc .cur{color:#e53e3e;font-weight:600}

/* ── Page header ── */
.dg-hdr{display:flex;align-items:flex-start;justify-content:space-between;padding:14px 28px 0;flex-wrap:wrap;gap:12px}
.dg-hdr-title h1{font-size:22px;font-weight:700;color:#0d1a36;margin:0;letter-spacing:-.025em;display:flex;align-items:center;gap:10px}
.dg-hdr-title p{font-size:13px;color:#7a88a8;margin:4px 0 0}
.dg-title-icon{width:38px;height:38px;border-radius:11px;background:rgba(229,62,62,.1);display:flex;align-items:center;justify-content:center;color:#e53e3e;flex-shrink:0}

/* ── KPI strip ── */
.dg-kpi{display:flex;gap:12px;padding:18px 28px 0;flex-wrap:wrap}
.dg-kpi-card{flex:1;min-width:130px;background:#fff;border-radius:14px;padding:14px 16px;border:1px solid rgba(0,49,118,.07);box-shadow:0 1px 6px rgba(0,49,118,.04);position:relative;overflow:hidden;animation:kpiIn .4s ease both;transition:box-shadow .18s,transform .18s}
.dg-kpi-card:hover{box-shadow:0 4px 18px rgba(0,49,118,.1);transform:translateY(-2px)}
.dg-kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:14px 14px 0 0}
.dg-kpi-card.red::before   {background:#e53e3e}
.dg-kpi-card.amber::before {background:#f59e0b}
.dg-kpi-card.navy::before  {background:#003176}
.dg-kpi-card.purple::before{background:#7c3aed}
@keyframes kpiIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.dg-kpi-card:nth-child(1){animation-delay:.04s}.dg-kpi-card:nth-child(2){animation-delay:.08s}
.dg-kpi-card:nth-child(3){animation-delay:.12s}.dg-kpi-card:nth-child(4){animation-delay:.16s}
.dg-kpi-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:10px}
.dg-kpi-card.red    .dg-kpi-icon{background:rgba(229,62,62,.1);color:#e53e3e}
.dg-kpi-card.amber  .dg-kpi-icon{background:rgba(245,158,11,.1);color:#d97706}
.dg-kpi-card.navy   .dg-kpi-icon{background:rgba(0,49,118,.08);color:#003176}
.dg-kpi-card.purple .dg-kpi-icon{background:rgba(124,58,237,.08);color:#7c3aed}
.dg-kpi-num{font-size:21px;font-weight:700;color:#0d1a36;line-height:1;margin-bottom:3px}
.dg-kpi-lbl{font-size:10.5px;font-weight:600;color:#8a94b0;text-transform:uppercase;letter-spacing:.05em}

/* ── Filter card ── */
.dg-filter{margin:18px 28px 0;background:#fff;border-radius:16px;border:1px solid rgba(0,49,118,.08);box-shadow:0 2px 10px rgba(0,49,118,.05);padding:20px 22px}
.dg-filter-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#003176;margin-bottom:14px;display:flex;align-items:center;gap:6px}
.dg-filter-row{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end}
.dg-ff{display:flex;flex-direction:column;gap:5px;min-width:185px;flex:1}
.dg-ff label{font-size:10.5px;font-weight:700;color:#4a5878;text-transform:uppercase;letter-spacing:.05em}

/* Buttons */
.dg-btn{display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .16s;border:none;white-space:nowrap}
.dg-btn-primary{background:linear-gradient(135deg,#003176,#004299);color:#fff;box-shadow:0 2px 8px rgba(0,49,118,.22)}
.dg-btn-primary:hover{background:linear-gradient(135deg,#00276a,#003c8a);transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,49,118,.3)}
.dg-btn-reset{background:#fff;color:#e53e3e;border:1.5px solid rgba(229,62,62,.25)}
.dg-btn-reset:hover{background:rgba(229,62,62,.06);border-color:#e53e3e}
.dg-btn-ghost{background:#fff;color:#4a5878;border:1.5px solid #d0d8ee}
.dg-btn-ghost:hover{border-color:#003176;color:#003176}

/* ── Table section ── */
.dg-section{margin:18px 28px 0;background:#fff;border-radius:16px;border:1px solid rgba(0,49,118,.08);box-shadow:0 2px 12px rgba(0,49,118,.05);overflow:hidden}
.dg-section-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #edf0f7;background:linear-gradient(to right,rgba(229,62,62,.025),transparent);flex-wrap:wrap;gap:8px}
.dg-section-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:#0d1a36}
.dg-badge{font-size:11px;font-weight:700;padding:2px 9px;background:rgba(229,62,62,.08);color:#e53e3e;border-radius:99px}
.dg-filter-badge{font-size:11px;font-weight:600;padding:2px 9px;background:rgba(0,49,118,.08);color:#003176;border-radius:99px;display:flex;align-items:center;gap:4px}

/* per-page select */
.dg-per-page{padding:6px 10px;border:1.5px solid #d0d8ee;border-radius:8px;font-size:12.5px;font-family:inherit;color:#1a2236;background:#fff;outline:none;cursor:pointer}
.dg-per-page:focus{border-color:#003176}

/* ── Table ── */
.dg-table-scroll{overflow-x:auto}
.dg-tbl{width:100%;border-collapse:collapse}
.dg-tbl thead th{padding:10px 14px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#8a94b0;border-bottom:1px solid #edf0f7;white-space:nowrap;background:#f7f9fd;position:sticky;top:0;z-index:2}
.dg-tbl thead th.searchable{cursor:pointer;transition:color .15s,background .15s}
.dg-tbl thead th.searchable:hover{color:#003176;background:#f0f4fb}
.dg-tbl thead th.has-filter{color:#003176;background:rgba(0,49,118,.04)}
.dg-th-inner{display:flex;align-items:center;gap:5px}
.dg-th-search{display:flex;align-items:center;gap:5px;background:#fff;border:1.5px solid #003176;border-radius:7px;padding:3px 7px;box-shadow:0 0 0 2px rgba(0,49,118,.08)}
.dg-th-search input{border:none;outline:none;background:transparent;font-size:11.5px;font-family:inherit;color:#1a2236;width:100px}
.dg-th-search input::placeholder{color:#b8c4d8}
.dg-th-clear{background:none;border:none;cursor:pointer;padding:0;color:#a0aabf;display:flex;line-height:1}
.dg-th-clear:hover{color:#e53e3e}

.dg-tbl tbody tr{border-bottom:1px solid #f0f3fa;transition:background .1s;animation:rowIn .25s ease both}
@keyframes rowIn{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:translateX(0)}}
.dg-tbl tbody tr:hover{background:#f7faff}
.dg-tbl tbody tr:last-child{border-bottom:none}
.dg-tbl tbody td{padding:11px 14px;font-size:13px;color:#2a3452;vertical-align:middle}
.dg-tbl td.sno{color:#a0aabf;font-size:11.5px;font-weight:500;width:44px}

/* Product cell */
.dg-prod-cell{display:flex;align-items:center;gap:9px}
.dg-prod-icon{width:30px;height:30px;border-radius:8px;background:rgba(229,62,62,.08);display:flex;align-items:center;justify-content:center;color:#e53e3e;flex-shrink:0}
.dg-prod-name{font-weight:600;color:#0d1a36;font-size:13px}

/* Store cell */
.dg-store-cell{display:flex;align-items:center;gap:6px;font-size:13px}
.dg-store-dot{width:7px;height:7px;border-radius:50%;background:#003176;flex-shrink:0}

/* Qty badge */
.dg-qty{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:8px;font-size:12.5px;font-weight:700;background:rgba(229,62,62,.08);color:#e53e3e;font-family:'DM Mono',monospace}

/* Date cell */
.dg-date{font-family:'DM Mono',monospace;font-size:12px;color:#5a6880}

/* View button */
.dg-view-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:8px;font-size:12px;font-weight:600;font-family:inherit;background:rgba(0,49,118,.07);color:#003176;border:1px solid rgba(0,49,118,.15);cursor:pointer;transition:all .15s;white-space:nowrap}
.dg-view-btn:hover{background:rgba(0,49,118,.12);border-color:#003176}

/* ── Pagination ── */
.dg-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-top:1px solid #edf0f7;background:#f7f9fd;flex-wrap:wrap;gap:8px}
.dg-page-info{font-size:12.5px;color:#7a88a8}
.dg-page-info strong{color:#0d1a36}
.dg-page-btns{display:flex;align-items:center;gap:6px}
.dg-page-btn{width:32px;height:32px;border-radius:8px;border:1.5px solid #d0d8ee;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#4a5878;transition:all .15s;font-family:inherit;font-size:12px;font-weight:600}
.dg-page-btn:hover:not(:disabled){border-color:#003176;color:#003176;background:rgba(0,49,118,.04)}
.dg-page-btn:disabled{opacity:.38;cursor:not-allowed}
.dg-page-btn.active{background:#003176;border-color:#003176;color:#fff;box-shadow:0 2px 6px rgba(0,49,118,.25)}
.dg-page-ellipsis{font-size:12px;color:#a0aabf;padding:0 2px}

/* ── Detail Modal ── */
.dg-modal-overlay{position:fixed;inset:0;z-index:1000;background:rgba(10,20,50,.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px;animation:moFade .2s ease}
@keyframes moFade{from{opacity:0}to{opacity:1}}
.dg-modal{background:#fff;border-radius:20px;width:100%;max-width:520px;box-shadow:0 24px 80px rgba(0,49,118,.22);animation:moSlide .28s cubic-bezier(.34,1.56,.64,1);overflow:hidden}
@keyframes moSlide{from{opacity:0;transform:scale(.92) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}

.dg-modal-hdr{padding:20px 22px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.dg-modal-icon{width:46px;height:46px;border-radius:14px;background:rgba(229,62,62,.1);display:flex;align-items:center;justify-content:center;color:#e53e3e;flex-shrink:0}
.dg-modal-title{font-size:17px;font-weight:700;color:#0d1a36;margin:0}
.dg-modal-sub{font-size:12.5px;color:#7a88a8;margin:3px 0 0}
.dg-modal-close{width:32px;height:32px;border-radius:8px;border:1.5px solid #edf0f7;background:#f7f9fd;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#7a88a8;transition:all .15s;flex-shrink:0}
.dg-modal-close:hover{border-color:#e53e3e;color:#e53e3e;background:rgba(229,62,62,.06)}

.dg-modal-body{padding:20px 22px}
.dg-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.dg-modal-field{display:flex;flex-direction:column;gap:4px;background:#f7f9fd;border-radius:10px;padding:12px 14px;border:1px solid #edf0f7}
.dg-modal-field.full{grid-column:1/-1}
.dg-modal-field.highlight{background:rgba(229,62,62,.04);border-color:rgba(229,62,62,.15)}
.dg-field-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#a0aabf;display:flex;align-items:center;gap:5px}
.dg-field-val{font-size:14px;font-weight:600;color:#0d1a36}
.dg-field-val.big{font-size:22px;font-weight:700;color:#e53e3e;font-family:'DM Mono',monospace}
.dg-field-val.mono{font-family:'DM Mono',monospace;font-size:13px}
.dg-field-val.reason{font-size:13px;font-weight:400;color:#4a5878;line-height:1.5}

.dg-modal-footer{padding:0 22px 20px}
.dg-modal-close-btn{width:100%;padding:10px;border-radius:10px;border:1.5px solid #d0d8ee;background:#fff;font-size:13px;font-weight:600;font-family:inherit;color:#4a5878;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:7px}
.dg-modal-close-btn:hover{border-color:#003176;color:#003176}

/* ── Empty / inline loading ── */
.dg-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 24px;gap:10px}
.dg-empty-icon{width:60px;height:60px;border-radius:16px;background:rgba(229,62,62,.06);display:flex;align-items:center;justify-content:center;color:#e0a0a0;margin-bottom:4px}
.dg-empty h3{font-size:15px;font-weight:700;color:#4a5878;margin:0}
.dg-empty p{font-size:13px;color:#a0aabf;margin:0;text-align:center}

/* skeleton shimmer */
.dg-skeleton{background:linear-gradient(90deg,#f0f3fa 25%,#e4e9f2 50%,#f0f3fa 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px;height:14px}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

.dg-spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

@media(max-width:768px){
  .dg-bc,.dg-hdr,.dg-kpi,.dg-filter,.dg-section{padding-left:14px;padding-right:14px;margin-left:12px;margin-right:12px}
  .dg-modal-grid{grid-template-columns:1fr}
}
`;

/* ─── Loader ─── */
function DamagedLoader({ message = "Loading damaged goods" }) {
  return (
    <div className="dg-loader">
      <div className="dg-loader-box">
        <div>
          <div className="dg-loader-boxes">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="dg-lb" />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginTop: 6,
            }}
          >
            <div className="dg-loader-scan">
              <div className="dg-loader-scan-inner" />
            </div>
            <div className="dg-loader-stripe" />
          </div>
        </div>
        <div>
          <div className="dg-loader-txt">
            {message}
            <span style={{ color: "#e53e3e" }}>…</span>
          </div>
          <div className="dg-loader-sub">
            Scanning inventory for damage records
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton rows ─── */
function SkeletonRows({ count = 5 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} style={{ opacity: 1 - i * 0.15 }}>
      {[44, 90, 140, 80, 120, 80].map((w, j) => (
        <td key={j} style={{ padding: "14px" }}>
          <div className="dg-skeleton" style={{ width: w, height: 13 }} />
        </td>
      ))}
    </tr>
  ));
}

/* ─── Searchable TH ─── */
function SearchableTH({
  label,
  icon: Icon,
  searchTerm,
  setSearchTerm,
  show,
  setShow,
}) {
  const inputRef = useRef(null);
  useEffect(() => {
    if (show) setTimeout(() => inputRef.current?.focus(), 40);
  }, [show]);
  return (
    <th
      className={`searchable${show || searchTerm ? " has-filter" : ""}`}
      onClick={() => !show && setShow(true)}
    >
      {show ? (
        <div className="dg-th-search" onClick={(e) => e.stopPropagation()}>
          <Search size={11} color="#003176" />
          <input
            ref={inputRef}
            placeholder={`Filter…`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="dg-th-clear"
              onClick={() => {
                setSearchTerm("");
                setShow(false);
              }}
            >
              <X size={10} />
            </button>
          )}
        </div>
      ) : (
        <div className="dg-th-inner">
          {Icon && <Icon size={11} />}
          {label}
          {searchTerm ? (
            <span
              style={{
                fontSize: 9,
                background: "#003176",
                color: "#fff",
                borderRadius: 4,
                padding: "1px 5px",
              }}
            >
              ●
            </span>
          ) : (
            <Search size={10} style={{ color: "#c0c8dc", marginLeft: 2 }} />
          )}
        </div>
      )}
    </th>
  );
}

/* ─── Detail Modal ─── */
function DetailModal({ item, onClose }) {
  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  return (
    <div
      className="dg-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="dg-modal">
        {/* Header */}
        <div className="dg-modal-hdr">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div className="dg-modal-icon">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="dg-modal-title">Damage Report</div>
              <div className="dg-modal-sub">
                Full details for this damage record
              </div>
            </div>
          </div>
          <button className="dg-modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="dg-modal-body">
          <div className="dg-modal-grid">
            {/* Quantity — big highlight */}
            <div className="dg-modal-field highlight">
              <div className="dg-field-label">
                <AlertTriangle size={10} color="#e53e3e" /> Damaged Qty
              </div>
              <div className="dg-field-val big">{item.quantity}</div>
              <div
                style={{
                  fontSize: 11,
                  color: "#a0aabf",
                  marginTop: 2,
                  fontFamily: "'DM Mono',monospace",
                }}
              >
                bags
              </div>
            </div>

            {/* Date */}
            <div className="dg-modal-field">
              <div className="dg-field-label">
                <Calendar size={10} /> Recorded On
              </div>
              <div className="dg-field-val mono">
                {formatDate(item.createdAt)}
              </div>
            </div>

            {/* Product */}
            <div className="dg-modal-field">
              <div className="dg-field-label">
                <Package size={10} /> Product
              </div>
              <div className="dg-field-val">{item.product?.name || "—"}</div>
            </div>

            {/* Store */}
            <div className="dg-modal-field">
              <div className="dg-field-label">
                <Store size={10} /> Store
              </div>
              <div className="dg-field-val">{item.store?.name || "—"}</div>
            </div>

            {/* Store code */}
            <div className="dg-modal-field">
              <div className="dg-field-label">
                <Hash size={10} /> Store Code
              </div>
              <div className="dg-field-val mono">
                {item.store?.storeCode || "—"}
              </div>
            </div>

            {/* Reason — full width */}
            {item.damageReason && (
              <div className="dg-modal-field full">
                <div className="dg-field-label">
                  <FileText size={10} /> Damage Reason
                </div>
                <div className="dg-field-val reason">{item.damageReason}</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="dg-modal-footer">
          <button className="dg-modal-close-btn" onClick={onClose}>
            <X size={13} /> Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
function DamagedGoods({ navigate }) {
  const { axiosAPI } = useAuth();

  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState("");
  const [product, setProduct] = useState("");

  const [allGoods, setAllGoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);

  // Column search
  const [prodSearch, setProdSearch] = useState("");
  const [showProdSearch, setShowProdSearch] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");
  const [showStoreSearch, setShowStoreSearch] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);

  /* ─ filter + paginate ─ */
  const displayed = allGoods.filter((item) => {
    if (
      prodSearch &&
      !(item.product?.name || "")
        .toLowerCase()
        .includes(prodSearch.toLowerCase())
    )
      return false;
    if (
      storeSearch &&
      !(item.store?.name || "")
        .toLowerCase()
        .includes(storeSearch.toLowerCase())
    )
      return false;
    return true;
  });

  const totalPages = Math.ceil(displayed.length / limit);
  const pageItems = displayed.slice((pageNo - 1) * limit, pageNo * limit);

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, "0")}-${String(dt.getMonth() + 1).padStart(2, "0")}-${dt.getFullYear()}`;
  };

  /* ─ Fetch dropdowns ─ */
  useEffect(() => {
    async function go() {
      try {
        const [s, p] = await Promise.all([
          axiosAPI.get("/stores?all=true"),
          axiosAPI.get("/products/list"),
        ]);
        setStores(s.data.data || []);
        setProducts(p.data.products || []);
      } catch {}
    }
    go();
  }, []);

  /* ─ Initial load ─ */
  const fetchDamagedGoods = async (
    storeId = "",
    productId = "",
    showFullLoader = true,
  ) => {
    try {
      if (showFullLoader) setLoading(true);
      else setTableLoading(true);

      let query = "/damaged-goods";
      const params = [];
      if (storeId) params.push(`storeId=${storeId}`);
      if (productId) params.push(`productId=${productId}`);
      if (params.length) query += `?${params.join("&")}`;

      const res = await axiosAPI.get(query);
      setAllGoods(res.data.damagedGoods || []);
      setPageNo(1);
      setHasFetched(true);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to fetch damaged goods.");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchDamagedGoods();
  }, []);

  const applyFilters = () => {
    if (!store && !product) {
      setError("Select at least one filter (Store or Product).");
      return;
    }
    setIsFiltered(true);
    fetchDamagedGoods(store, product, false);
  };

  const resetFilters = () => {
    setStore("");
    setProduct("");
    setIsFiltered(false);
    fetchDamagedGoods("", "", false);
  };

  /* ─ KPIs ─ */
  const uniqueProducts = [
    ...new Set(allGoods.map((i) => i.product?.name).filter(Boolean)),
  ].length;
  const uniqueStores = [
    ...new Set(allGoods.map((i) => i.store?.name).filter(Boolean)),
  ].length;
  const totalQty = allGoods.reduce((s, i) => s + (i.quantity || 0), 0);

  const kpis = [
    {
      cls: "red",
      Icon: AlertTriangle,
      label: "Total Records",
      value: allGoods.length,
    },
    { cls: "amber", Icon: TrendingDown, label: "Damaged Qty", value: totalQty },
    { cls: "navy", Icon: Boxes, label: "Products", value: uniqueProducts },
    {
      cls: "purple",
      Icon: Store,
      label: "Stores Affected",
      value: uniqueStores,
    },
  ];

  /* ─ Page numbers to render ─ */
  const getPageNums = () => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (pageNo <= 3) return [1, 2, 3, 4, "…", totalPages];
    if (pageNo >= totalPages - 2)
      return [
        1,
        "…",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [1, "…", pageNo - 1, pageNo, pageNo + 1, "…", totalPages];
  };

  const anyColFilter = prodSearch || storeSearch;

  return (
    <>
      <style>{css}</style>
      <div className="dg">
        {loading && <DamagedLoader message="Loading damaged goods" />}
        {error && (
          <div
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              z: 9999,
              background: "#fff",
              border: "1.5px solid rgba(229,62,62,.3)",
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 4px 20px rgba(229,62,62,.15)",
              animation: "tagIn .2s ease",
              maxWidth: 360,
              zIndex: 9990,
            }}
          >
            <AlertTriangle size={16} color="#e53e3e" />
            <span
              style={{
                fontSize: 13,
                color: "#3a1010",
                fontWeight: 500,
                flex: 1,
              }}
            >
              {error}
            </span>
            <button
              onClick={() => setError(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                color: "#a0aabf",
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="dg-bc">
          <span className="dg-bc-link" onClick={() => navigate("/inventory")}>
            <LayoutGrid size={13} /> Inventory
          </span>
          <ChevRight size={12} style={{ color: "#c0c8dc" }} />
          <span className="cur">Damaged Goods</span>
        </div>

        {/* Header */}
        <div className="dg-hdr">
          <div className="dg-hdr-title">
            <h1>
              <div className="dg-title-icon">
                <ShieldAlert size={20} />
              </div>
              Damaged Goods
            </h1>
            <p>Track and review all damaged inventory records across stores</p>
          </div>
          <button
            className="dg-btn dg-btn-primary"
            onClick={() => fetchDamagedGoods(store, product, false)}
          >
            <RefreshCw size={14} className={tableLoading ? "dg-spin" : ""} />{" "}
            Refresh
          </button>
        </div>

        {/* KPI Strip */}
        {hasFetched && (
          <div className="dg-kpi">
            {kpis.map((k) => (
              <div key={k.label} className={`dg-kpi-card ${k.cls}`}>
                <div className="dg-kpi-icon">
                  <k.Icon size={17} />
                </div>
                <div className="dg-kpi-num">{k.value.toLocaleString()}</div>
                <div className="dg-kpi-lbl">{k.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter Card */}
        <div className="dg-filter">
          <div className="dg-filter-lbl">
            <Filter size={12} /> Filter Records
          </div>
          <div className="dg-filter-row">
            <div className="dg-ff">
              <label>Store</label>
              <CustomSearchDropdown
                label="Store"
                onSelect={setStore}
                options={stores.map((s) => ({ value: s.id, label: s.name }))}
              />
            </div>
            <div className="dg-ff">
              <label>Product</label>
              <CustomSearchDropdown
                label="Product"
                onSelect={setProduct}
                options={products.map((p) => ({ value: p.id, label: p.name }))}
              />
            </div>
            <div style={{ display: "flex", gap: 8, paddingTop: 22 }}>
              <button className="dg-btn dg-btn-primary" onClick={applyFilters}>
                <Filter size={14} /> Apply
              </button>
              {isFiltered && (
                <button className="dg-btn dg-btn-reset" onClick={resetFilters}>
                  <XCircle size={14} /> Reset
                </button>
              )}
              <button
                className="dg-btn dg-btn-ghost"
                onClick={() => navigate("/inventory")}
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          </div>
          {isFiltered && (
            <div
              style={{
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12.5,
                color: "#7a88a8",
              }}
            >
              <Info size={13} color="#003176" />
              Showing filtered results.
              <button
                onClick={resetFilters}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#e53e3e",
                  fontWeight: 600,
                  fontSize: 12,
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                Clear filter →
              </button>
            </div>
          )}
        </div>

        {/* Table Section */}
        {hasFetched && (
          <div className="dg-section">
            <div className="dg-section-hdr">
              <div className="dg-section-title">
                <ClipboardList size={15} color="#e53e3e" />
                Damage Records
                <span className="dg-badge">{displayed.length} records</span>
                {anyColFilter && (
                  <span className="dg-filter-badge">
                    <Filter size={10} /> Filtered
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "#7a88a8" }}>Rows:</span>
                <select
                  className="dg-per-page"
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value));
                    setPageNo(1);
                  }}
                >
                  {[10, 20, 30, 50].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="dg-table-scroll">
              <table className="dg-tbl">
                <thead>
                  <tr>
                    <th>
                      <div className="dg-th-inner">#</div>
                    </th>
                    <th>
                      <div className="dg-th-inner">
                        <Calendar size={11} /> Date
                      </div>
                    </th>
                    <SearchableTH
                      label="Product"
                      icon={Package}
                      searchTerm={prodSearch}
                      setSearchTerm={setProdSearch}
                      show={showProdSearch}
                      setShow={setShowProdSearch}
                    />
                    <th>
                      <div className="dg-th-inner">
                        <AlertTriangle size={11} /> Damage Qty
                      </div>
                    </th>
                    <SearchableTH
                      label="Store"
                      icon={Store}
                      searchTerm={storeSearch}
                      setSearchTerm={setStoreSearch}
                      show={showStoreSearch}
                      setShow={setShowStoreSearch}
                    />
                    <th>
                      <div className="dg-th-inner">Action</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableLoading ? (
                    <SkeletonRows count={limit} />
                  ) : pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="dg-empty">
                          <div className="dg-empty-icon">
                            <ShieldAlert size={26} />
                          </div>
                          <h3>
                            {anyColFilter || isFiltered
                              ? "No Matching Records"
                              : "No Damaged Goods Found"}
                          </h3>
                          <p>
                            {anyColFilter
                              ? "Try clearing the column search filters."
                              : isFiltered
                                ? "No records match the selected store/product."
                                : "No damage records exist in the system."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        style={{ animationDelay: `${idx * 0.03}s` }}
                      >
                        <td className="sno">
                          {(pageNo - 1) * limit + idx + 1}
                        </td>
                        <td>
                          <span className="dg-date">
                            {formatDate(item.createdAt)}
                          </span>
                        </td>
                        <td>
                          <div className="dg-prod-cell">
                            <div className="dg-prod-icon">
                              <Package size={14} />
                            </div>
                            <div className="dg-prod-name">
                              {item.product?.name || "—"}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="dg-qty">
                            <AlertTriangle size={11} />
                            {item.quantity}
                          </span>
                        </td>
                        <td>
                          <div className="dg-store-cell">
                            <div className="dg-store-dot" />
                            {item.store?.name || "—"}
                          </div>
                        </td>
                        <td>
                          <button
                            className="dg-view-btn"
                            onClick={() => setSelectedItem(item)}
                          >
                            <Eye size={12} /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="dg-pagination">
                <div className="dg-page-info">
                  Showing{" "}
                  <strong>
                    {(pageNo - 1) * limit + 1}–
                    {Math.min(pageNo * limit, displayed.length)}
                  </strong>{" "}
                  of <strong>{displayed.length}</strong> records
                </div>
                <div className="dg-page-btns">
                  <button
                    className="dg-page-btn"
                    disabled={pageNo === 1}
                    onClick={() => setPageNo((p) => p - 1)}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {getPageNums().map((n, i) =>
                    n === "…" ? (
                      <span key={`e${i}`} className="dg-page-ellipsis">
                        …
                      </span>
                    ) : (
                      <button
                        key={n}
                        className={`dg-page-btn${pageNo === n ? " active" : ""}`}
                        onClick={() => setPageNo(n)}
                      >
                        {n}
                      </button>
                    ),
                  )}
                  <button
                    className="dg-page-btn"
                    disabled={pageNo === totalPages}
                    onClick={() => setPageNo((p) => p + 1)}
                  >
                    <ChevRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {selectedItem && (
          <DetailModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </div>
    </>
  );
}

export default DamagedGoods;
