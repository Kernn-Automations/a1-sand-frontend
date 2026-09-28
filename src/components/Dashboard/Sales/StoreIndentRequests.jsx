import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Auth";
import { useDivision } from "../../context/DivisionContext";
import {
  showSuccessNotification,
  showErrorNotification,
} from "../../../utils/errorHandler";
import {
  LayoutGrid,
  ChevronRight,
  ClipboardList,
  Store,
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calendar,
  Filter,
  AlertTriangle,
  Clock,
  Package,
  Hash,
  FileText,
  BadgeCheck,
  Ban,
  Loader2,
  Info,
  Boxes,
  Activity,
  CheckSquare,
  Square,
  Zap,
  TrendingUp,
  ArrowDownCircle,
  CircleDot,
} from "lucide-react";

/* ═══════════════════════════════════════
   BRAND  #003176 navy | #22a634 green
═══════════════════════════════════════ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');

.sir * { box-sizing:border-box; font-family:'DM Sans',sans-serif; }
.sir { background:#f0f4fa; min-height:100vh; padding:0 0 60px; }

/* ── Loader overlay ── */
.sir-loader {
  position:fixed; inset:0; z-index:9999;
  background:rgba(240,244,250,0.9); backdrop-filter:blur(10px);
  display:flex; align-items:center; justify-content:center;
  animation:lFade .2s ease;
}
@keyframes lFade{from{opacity:0}to{opacity:1}}
.sir-loader-box {
  background:#fff; border-radius:24px; padding:38px 52px;
  display:flex; flex-direction:column; align-items:center; gap:24px;
  box-shadow:0 12px 56px rgba(0,49,118,.18); border:1px solid rgba(0,49,118,.08);
  animation:lBox .28s cubic-bezier(.34,1.56,.64,1);
}
@keyframes lBox{from{opacity:0;transform:scale(.9) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
.sir-loader-docs { display:flex; gap:9px; align-items:flex-end; }
.sir-ld {
  border-radius:5px 5px 2px 2px; position:relative;
  animation:ldPulse 1.4s ease-in-out infinite;
  display:flex; align-items:flex-end; justify-content:center; padding-bottom:3px;
}
.sir-ld::before {
  content:''; position:absolute; top:5px; left:4px; right:4px;
  height:2px; background:rgba(255,255,255,.5); border-radius:1px;
}
.sir-ld::after {
  content:''; position:absolute; top:10px; left:4px; right:4px;
  height:2px; background:rgba(255,255,255,.35); border-radius:1px;
}
.sir-ld:nth-child(1){width:24px;height:32px;background:linear-gradient(180deg,#003176,#0044aa);animation-delay:0s}
.sir-ld:nth-child(2){width:24px;height:44px;background:linear-gradient(180deg,#22a634,#18842a);animation-delay:.15s}
.sir-ld:nth-child(3){width:24px;height:28px;background:linear-gradient(180deg,#f59e0b,#d97706);animation-delay:.30s}
.sir-ld:nth-child(4){width:24px;height:38px;background:linear-gradient(180deg,#003176,#0044aa);animation-delay:.45s}
.sir-ld:nth-child(5){width:24px;height:24px;background:linear-gradient(180deg,#22a634,#18842a);animation-delay:.60s}
@keyframes ldPulse{0%,100%{transform:scaleY(.65);opacity:.5}50%{transform:scaleY(1.15);opacity:1}}
.sir-loader-scan{width:165px;height:3px;background:#e8edf5;border-radius:99px;overflow:hidden;margin-top:4px}
.sir-loader-scan-inner{height:100%;width:38%;background:linear-gradient(to right,transparent,#003176,#22a634,transparent);animation:scanMove 1.5s ease-in-out infinite}
@keyframes scanMove{0%{transform:translateX(-120%)}100%{transform:translateX(380%)}}
.sir-loader-txt{font-size:14px;font-weight:600;color:#1a2236;text-align:center}
.sir-loader-sub{font-size:12px;color:#8a94b0;text-align:center;margin-top:-16px}

/* ── Breadcrumb ── */
.sir-bc{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#7a88a8;padding:16px 28px 0}
.sir-bc-link{cursor:pointer;transition:color .15s;display:flex;align-items:center;gap:4px}
.sir-bc-link:hover{color:#003176}
.sir-bc .cur{color:#003176;font-weight:600}

/* ── Page header ── */
.sir-hdr{display:flex;align-items:flex-start;justify-content:space-between;padding:14px 28px 0;flex-wrap:wrap;gap:12px}
.sir-hdr-title h1{font-size:22px;font-weight:700;color:#0d1a36;margin:0;letter-spacing:-.025em;display:flex;align-items:center;gap:10px}
.sir-hdr-title p{font-size:13px;color:#7a88a8;margin:4px 0 0}
.sir-title-icon{width:38px;height:38px;border-radius:11px;background:rgba(0,49,118,.08);display:flex;align-items:center;justify-content:center;color:#003176;flex-shrink:0}

/* ── KPI strip ── */
.sir-kpi{display:flex;gap:12px;padding:18px 28px 0;flex-wrap:wrap}
.sir-kpi-card{flex:1;min-width:130px;background:#fff;border-radius:14px;padding:14px 16px;border:1px solid rgba(0,49,118,.07);box-shadow:0 1px 6px rgba(0,49,118,.04);position:relative;overflow:hidden;animation:kpiIn .4s ease both;transition:box-shadow .18s,transform .18s}
.sir-kpi-card:hover{box-shadow:0 4px 18px rgba(0,49,118,.1);transform:translateY(-2px)}
.sir-kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:14px 14px 0 0}
.sir-kpi-card.navy::before  {background:#003176}
.sir-kpi-card.amber::before {background:#f59e0b}
.sir-kpi-card.green::before {background:#22a634}
.sir-kpi-card.red::before   {background:#ef4444}
.sir-kpi-card.blue::before  {background:#0066cc}
@keyframes kpiIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.sir-kpi-card:nth-child(1){animation-delay:.04s}.sir-kpi-card:nth-child(2){animation-delay:.08s}
.sir-kpi-card:nth-child(3){animation-delay:.12s}.sir-kpi-card:nth-child(4){animation-delay:.16s}
.sir-kpi-card:nth-child(5){animation-delay:.20s}
.sir-kpi-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:9px}
.sir-kpi-card.navy  .sir-kpi-icon{background:rgba(0,49,118,.08);color:#003176}
.sir-kpi-card.amber .sir-kpi-icon{background:rgba(245,158,11,.1);color:#d97706}
.sir-kpi-card.green .sir-kpi-icon{background:rgba(34,166,52,.1);color:#22a634}
.sir-kpi-card.red   .sir-kpi-icon{background:rgba(239,68,68,.1);color:#ef4444}
.sir-kpi-card.blue  .sir-kpi-icon{background:rgba(0,102,204,.08);color:#0066cc}
.sir-kpi-num{font-size:20px;font-weight:700;color:#0d1a36;line-height:1;margin-bottom:3px}
.sir-kpi-lbl{font-size:10.5px;font-weight:600;color:#8a94b0;text-transform:uppercase;letter-spacing:.05em}

/* ── Filter card ── */
.sir-filter{margin:18px 28px 0;background:#fff;border-radius:16px;border:1px solid rgba(0,49,118,.08);box-shadow:0 2px 10px rgba(0,49,118,.05);padding:20px 22px}
.sir-filter-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#003176;margin-bottom:14px;display:flex;align-items:center;gap:6px}
.sir-filter-row{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end}
.sir-ff{display:flex;flex-direction:column;gap:5px;min-width:150px;flex:1}
.sir-ff label{font-size:10.5px;font-weight:700;color:#4a5878;text-transform:uppercase;letter-spacing:.05em}
.sir-input{padding:9px 12px;border:1.5px solid #d0d8ee;border-radius:10px;font-size:13px;font-family:inherit;color:#1a2236;background:#fff;outline:none;transition:border-color .15s}
.sir-input:focus{border-color:#003176;box-shadow:0 0 0 3px rgba(0,49,118,.1)}
.sir-select{padding:9px 12px;border:1.5px solid #d0d8ee;border-radius:10px;font-size:13px;font-family:inherit;color:#1a2236;background:#fff;outline:none;cursor:pointer;transition:border-color .15s;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a0aabf' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:30px}
.sir-select:focus{border-color:#003176;box-shadow:0 0 0 3px rgba(0,49,118,.1)}

/* search input with icon */
.sir-search-wrap{position:relative}
.sir-search-wrap .sir-input{padding-left:34px}
.sir-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#a0aabf;pointer-events:none}
.sir-search-clear{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:0;color:#a0aabf;display:flex;transition:color .15s}
.sir-search-clear:hover{color:#e53e3e}

/* Buttons */
.sir-btn{display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .16s;border:none;white-space:nowrap}
.sir-btn:disabled{opacity:.5;cursor:not-allowed;transform:none !important}
.sir-btn-primary{background:linear-gradient(135deg,#003176,#004299);color:#fff;box-shadow:0 2px 8px rgba(0,49,118,.22)}
.sir-btn-primary:hover:not(:disabled){background:linear-gradient(135deg,#00276a,#003c8a);transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,49,118,.3)}
.sir-btn-ghost{background:#fff;color:#4a5878;border:1.5px solid #d0d8ee}
.sir-btn-ghost:hover:not(:disabled){border-color:#003176;color:#003176}

/* ── Status pills ── */
.sir-status{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;font-size:11.5px;font-weight:600;white-space:nowrap}
.sir-status.pending        {background:#fffbeb;color:#d97706;border:1px solid rgba(245,158,11,.25)}
.sir-status.awaiting       {background:#fff7ed;color:#ea580c;border:1px solid rgba(234,88,12,.2)}
.sir-status.approved       {background:rgba(34,166,52,.08);color:#16a34a;border:1px solid rgba(34,166,52,.2)}
.sir-status.rejected       {background:rgba(239,68,68,.08);color:#dc2626;border:1px solid rgba(239,68,68,.2)}
.sir-status.processing     {background:rgba(8,145,178,.08);color:#0891b2;border:1px solid rgba(8,145,178,.2)}
.sir-status.completed      {background:rgba(0,49,118,.08);color:#003176;border:1px solid rgba(0,49,118,.18)}

/* ── Priority pills ── */
.sir-priority{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:700;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
.sir-priority.urgent {background:rgba(239,68,68,.1);color:#dc2626}
.sir-priority.high   {background:rgba(245,158,11,.1);color:#d97706}
.sir-priority.normal {background:rgba(0,102,204,.08);color:#0066cc}
.sir-priority.low    {background:rgba(107,114,128,.08);color:#6b7280}

/* ── Table section ── */
.sir-section{margin:18px 28px 0;background:#fff;border-radius:16px;border:1px solid rgba(0,49,118,.08);box-shadow:0 2px 12px rgba(0,49,118,.05);overflow:hidden}
.sir-section-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #edf0f7;background:linear-gradient(to right,rgba(0,49,118,.025),transparent);flex-wrap:wrap;gap:8px}
.sir-section-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:#0d1a36}
.sir-badge{font-size:11px;font-weight:700;padding:2px 9px;background:rgba(0,49,118,.08);color:#003176;border-radius:99px}
.sir-per-page{padding:6px 10px;border:1.5px solid #d0d8ee;border-radius:8px;font-size:12.5px;font-family:inherit;color:#1a2236;background:#fff;outline:none;cursor:pointer}
.sir-per-page:focus{border-color:#003176}

/* ── Table ── */
.sir-table-scroll{overflow-x:auto}
.sir-tbl{width:100%;border-collapse:collapse}
.sir-tbl thead th{padding:10px 14px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#8a94b0;border-bottom:1px solid #edf0f7;white-space:nowrap;background:#f7f9fd}
.sir-tbl thead th .th-inner{display:flex;align-items:center;gap:5px}
.sir-tbl tbody tr{border-bottom:1px solid #f0f3fa;transition:background .1s;animation:rowIn .25s ease both}
@keyframes rowIn{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:translateX(0)}}
.sir-tbl tbody tr:hover{background:#f7faff}
.sir-tbl tbody tr:last-child{border-bottom:none}
.sir-tbl tbody td{padding:11px 14px;font-size:13px;color:#2a3452;vertical-align:middle}

/* ID cell */
.sir-id-cell{display:flex;flex-direction:column;gap:2px}
.sir-id-num{font-family:'DM Mono',monospace;font-size:12.5px;font-weight:700;color:#003176}
.sir-id-code{font-size:11px;color:#7a88a8;font-family:'DM Mono',monospace}

/* Store cell */
.sir-store-cell{display:flex;align-items:center;gap:7px}
.sir-store-dot{width:8px;height:8px;border-radius:50%;background:#003176;flex-shrink:0}
.sir-store-name{font-weight:500;color:#0d1a36}

/* Date cell */
.sir-date-cell{display:flex;flex-direction:column;gap:1px}
.sir-date-main{font-size:12.5px;color:#2a3452;font-family:'DM Mono',monospace}
.sir-date-time{font-size:11px;color:#a0aabf;font-family:'DM Mono',monospace}

/* Items cell */
.sir-items-cell{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:7px;background:rgba(0,49,118,.06);color:#003176;font-size:12px;font-weight:600}

/* Action buttons */
.sir-action-btn{display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .15s;border:1.5px solid;white-space:nowrap}
.sir-action-btn:disabled{opacity:.5;cursor:not-allowed}
.sir-action-btn.view    {background:rgba(0,49,118,.06);color:#003176;border-color:rgba(0,49,118,.15)}
.sir-action-btn.view:hover{background:rgba(0,49,118,.11);border-color:#003176}
.sir-action-btn.approve {background:rgba(34,166,52,.08);color:#16a34a;border-color:rgba(34,166,52,.2)}
.sir-action-btn.approve:hover{background:rgba(34,166,52,.14);border-color:#22a634}
.sir-action-btn.reject  {background:rgba(239,68,68,.07);color:#dc2626;border-color:rgba(239,68,68,.18)}
.sir-action-btn.reject:hover{background:rgba(239,68,68,.13);border-color:#ef4444}
.sir-action-wrap{display:flex;align-items:center;gap:6px;flex-wrap:wrap}

/* skeleton shimmer */
.sir-skeleton{background:linear-gradient(90deg,#f0f3fa 25%,#e4e9f2 50%,#f0f3fa 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px;height:14px}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

/* ── Pagination ── */
.sir-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-top:1px solid #edf0f7;background:#f7f9fd;flex-wrap:wrap;gap:8px}
.sir-page-info{font-size:12.5px;color:#7a88a8}
.sir-page-info strong{color:#0d1a36}
.sir-page-btns{display:flex;align-items:center;gap:5px}
.sir-page-btn{width:32px;height:32px;border-radius:8px;border:1.5px solid #d0d8ee;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#4a5878;transition:all .15s;font-family:inherit;font-size:12px;font-weight:600}
.sir-page-btn:hover:not(:disabled){border-color:#003176;color:#003176;background:rgba(0,49,118,.04)}
.sir-page-btn:disabled{opacity:.35;cursor:not-allowed}
.sir-page-btn.active{background:#003176;border-color:#003176;color:#fff;box-shadow:0 2px 6px rgba(0,49,118,.25)}
.sir-page-ellipsis{font-size:12px;color:#a0aabf;padding:0 2px}

/* ── Inline refreshing overlay on table ── */
.sir-table-overlay{position:relative}
.sir-table-loading{position:absolute;inset:0;background:rgba(255,255,255,.7);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:10;border-radius:0 0 16px 16px}
.sir-spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── Empty state ── */
.sir-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;gap:10px}
.sir-empty-icon{width:64px;height:64px;border-radius:18px;background:rgba(0,49,118,.06);display:flex;align-items:center;justify-content:center;color:#b0bcd4;margin-bottom:4px}
.sir-empty h3{font-size:15px;font-weight:700;color:#4a5878;margin:0}
.sir-empty p{font-size:13px;color:#a0aabf;margin:0;text-align:center;max-width:340px}

/* ── Detail Modal ── */
.sir-modal-overlay{position:fixed;inset:0;z-index:10000;background:rgba(10,20,50,.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;animation:moFade .2s ease}
@keyframes moFade{from{opacity:0}to{opacity:1}}
.sir-modal{background:#fff;border-radius:20px;width:100%;max-width:600px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,49,118,.22);animation:moSlide .28s cubic-bezier(.34,1.56,.64,1);overflow:hidden}
@keyframes moSlide{from{opacity:0;transform:scale(.92) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
.sir-modal-hdr{padding:20px 22px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-shrink:0}
.sir-modal-hdr-left{display:flex;align-items:flex-start;gap:12px}
.sir-modal-icon{width:44px;height:44px;border-radius:13px;background:rgba(0,49,118,.08);display:flex;align-items:center;justify-content:center;color:#003176;flex-shrink:0}
.sir-modal-title{font-size:17px;font-weight:700;color:#0d1a36;margin:0}
.sir-modal-sub{font-size:12.5px;color:#7a88a8;margin:3px 0 0;font-family:'DM Mono',monospace}
.sir-modal-close{width:32px;height:32px;border-radius:8px;border:1.5px solid #edf0f7;background:#f7f9fd;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#7a88a8;transition:all .15s;flex-shrink:0}
.sir-modal-close:hover{border-color:#003176;color:#003176}
.sir-modal-body{padding:20px 22px;overflow-y:auto;flex:1}
.sir-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sir-modal-field{background:#f7f9fd;border-radius:10px;padding:11px 13px;border:1px solid #edf0f7}
.sir-modal-field.full{grid-column:1/-1}
.sir-field-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#a0aabf;margin-bottom:4px;display:flex;align-items:center;gap:5px}
.sir-field-val{font-size:13.5px;font-weight:600;color:#0d1a36}
.sir-field-val.mono{font-family:'DM Mono',monospace}
.sir-field-val.note{font-size:13px;font-weight:400;color:#4a5878;line-height:1.5}

/* Items table in modal */
.sir-modal-items-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#4a5878;margin:16px 0 8px;display:flex;align-items:center;gap:6px}
.sir-items-tbl{width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #edf0f7}
.sir-items-tbl thead th{padding:8px 12px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#8a94b0;background:#f7f9fd;border-bottom:1px solid #edf0f7}
.sir-items-tbl thead th:not(:first-child){text-align:right}
.sir-items-tbl tbody tr{border-bottom:1px solid #f0f3fa}
.sir-items-tbl tbody tr:last-child{border-bottom:none}
.sir-items-tbl tbody td{padding:9px 12px;font-size:13px;color:#2a3452}
.sir-items-tbl tbody td:not(:first-child){text-align:right;font-family:'DM Mono',monospace;font-size:12.5px}
.sir-items-tbl tbody td.prod-name{font-weight:500}

/* Modal footer */
.sir-modal-footer{padding:14px 22px;border-top:1px solid #edf0f7;background:#f7f9fd;display:flex;align-items:center;justify-content:flex-end;gap:9px;flex-shrink:0}
.sir-modal-btn{display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .16s;border:none;white-space:nowrap}
.sir-modal-btn:disabled{opacity:.5;cursor:not-allowed}
.sir-modal-btn.approve{background:linear-gradient(135deg,#22a634,#18842a);color:#fff;box-shadow:0 2px 8px rgba(34,166,52,.3)}
.sir-modal-btn.approve:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px)}
.sir-modal-btn.reject{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;box-shadow:0 2px 8px rgba(239,68,68,.3)}
.sir-modal-btn.reject:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px)}
.sir-modal-btn.close{background:#fff;color:#4a5878;border:1.5px solid #d0d8ee}
.sir-modal-btn.close:hover{border-color:#003176;color:#003176}

/* toast error */
.sir-toast{position:fixed;top:20px;right:20px;z-index:9998;background:#fff;border:1.5px solid rgba(239,68,68,.25);border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(239,68,68,.12);animation:toastIn .25s ease;max-width:380px}
@keyframes toastIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.sir-toast-msg{font-size:13px;color:#3a1010;font-weight:500;flex:1}

@media(max-width:768px){
  .sir-bc,.sir-hdr,.sir-kpi,.sir-filter,.sir-section{padding-left:14px;padding-right:14px;margin-left:12px;margin-right:12px}
  .sir-modal-grid{grid-template-columns:1fr}
  .sir-filter-row{flex-direction:column}
}
`;

/* ─── helpers ─── */
const STATUS_META = {
  pending: { cls: "pending", label: "Pending", Icon: Clock },
  awaiting_approval: {
    cls: "awaiting",
    label: "Awaiting Approval",
    Icon: Clock,
  },
  approved: { cls: "approved", label: "Approved", Icon: BadgeCheck },
  rejected: { cls: "rejected", label: "Rejected", Icon: Ban },
  processing: { cls: "processing", label: "Processing", Icon: Loader2 },
  completed: { cls: "completed", label: "Completed", Icon: CheckCircle2 },
};

const PRIORITY_META = {
  urgent: { cls: "urgent", label: "Urgent", Icon: Zap },
  high: { cls: "high", label: "High", Icon: AlertTriangle },
  normal: { cls: "normal", label: "Normal", Icon: Activity },
  low: { cls: "low", label: "Low", Icon: CircleDot },
};

function StatusPill({ status }) {
  const s = status?.toLowerCase();
  const meta = STATUS_META[s] || {
    cls: "",
    label: status || "—",
    Icon: CircleDot,
  };
  return (
    <span className={`sir-status ${meta.cls}`}>
      <meta.Icon size={11} />
      {meta.label}
    </span>
  );
}

function PriorityPill({ priority }) {
  const p = priority?.toLowerCase();
  const meta = PRIORITY_META[p] || {
    cls: "low",
    label: priority || "Normal",
    Icon: CircleDot,
  };
  return (
    <span className={`sir-priority ${meta.cls}`}>
      <meta.Icon size={10} />
      {meta.label}
    </span>
  );
}

function SkeletonRows({ count = 6 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} style={{ opacity: 1 - i * 0.14 }}>
      {[70, 100, 120, 70, 90, 80, 60, 80].map((w, j) => (
        <td key={j} style={{ padding: "13px 14px" }}>
          <div className="sir-skeleton" style={{ width: w }} />
        </td>
      ))}
    </tr>
  ));
}

/* ─── Loader ─── */
function IndentLoader() {
  return (
    <div className="sir-loader">
      <div className="sir-loader-box">
        <div>
          <div className="sir-loader-docs">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="sir-ld" />
            ))}
          </div>
          <div className="sir-loader-scan" style={{ marginTop: 8 }}>
            <div className="sir-loader-scan-inner" />
          </div>
        </div>
        <div>
          <div className="sir-loader-txt">
            Loading indent requests<span style={{ color: "#003176" }}>…</span>
          </div>
          <div className="sir-loader-sub">Fetching store purchase requests</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail Modal ─── */
function IndentModal({
  indent,
  canApprove,
  submitting,
  onApprove,
  onReject,
  onClose,
}) {
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const isPending =
    indent.status === "pending" || indent.status === "awaiting_approval";
  const code = indent.code || indent.indentNumber || `IND-${indent.id}`;
  const dateStr = indent.createdAt
    ? new Date(indent.createdAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div
      className="sir-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sir-modal">
        {/* Header */}
        <div className="sir-modal-hdr">
          <div className="sir-modal-hdr-left">
            <div className="sir-modal-icon">
              <ClipboardList size={21} />
            </div>
            <div>
              <div className="sir-modal-title">Indent Details</div>
              <div className="sir-modal-sub">{code}</div>
            </div>
          </div>
          <button className="sir-modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="sir-modal-body">
          <div className="sir-modal-grid">
            <div className="sir-modal-field">
              <div className="sir-field-lbl">
                <Hash size={10} /> Indent ID
              </div>
              <div className="sir-field-val mono">#{indent.id}</div>
            </div>
            <div className="sir-modal-field">
              <div className="sir-field-lbl">
                <Activity size={10} /> Status
              </div>
              <div className="sir-field-val">
                <StatusPill status={indent.status} />
              </div>
            </div>
            <div className="sir-modal-field">
              <div className="sir-field-lbl">
                <Store size={10} /> Store
              </div>
              <div className="sir-field-val">
                {indent.store?.name || indent.store?.storeName || "—"}
              </div>
            </div>
            <div className="sir-modal-field">
              <div className="sir-field-lbl">
                <Zap size={10} /> Priority
              </div>
              <div className="sir-field-val">
                <PriorityPill priority={indent.priority} />
              </div>
            </div>
            <div className="sir-modal-field">
              <div className="sir-field-lbl">
                <Calendar size={10} /> Request Date
              </div>
              <div className="sir-field-val mono" style={{ fontSize: 12.5 }}>
                {dateStr}
              </div>
            </div>
            <div className="sir-modal-field">
              <div className="sir-field-lbl">
                <Boxes size={10} /> Total Items
              </div>
              <div className="sir-field-val">
                {indent.items?.length || indent.totalItems || 0} item
                {(indent.items?.length || 0) !== 1 ? "s" : ""}
              </div>
            </div>
            {indent.notes && (
              <div className="sir-modal-field full">
                <div className="sir-field-lbl">
                  <FileText size={10} /> Notes
                </div>
                <div className="sir-field-val note">{indent.notes}</div>
              </div>
            )}
          </div>

          {/* Items table */}
          {(indent.items || []).length > 0 && (
            <>
              <div className="sir-modal-items-title">
                <Package size={13} /> Requested Items
              </div>
              <table className="sir-items-tbl">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Bags</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {(indent.items || []).map((item, i) => (
                    <tr key={i}>
                      <td className="prod-name">
                        {item.product?.name || item.productName || "Unknown"}
                      </td>
                      <td>
                        {item.quantity ||
                          item.requestedQuantity ||
                          item.qty ||
                          0}
                      </td>
                      <td>{item.unit || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sir-modal-footer">
          {isPending && canApprove && (
            <>
              <button
                className="sir-modal-btn approve"
                onClick={() => onApprove(indent)}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 size={13} className="sir-spin" />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                Approve
              </button>
              <button
                className="sir-modal-btn reject"
                onClick={() => onReject(indent)}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 size={13} className="sir-spin" />
                ) : (
                  <XCircle size={13} />
                )}
                Reject
              </button>
            </>
          )}
          {isPending && !canApprove && (
            <span
              style={{
                fontSize: 12,
                color: "#a0aabf",
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginRight: "auto",
              }}
            >
              <Info size={13} color="#d97706" /> Admin/Super Admin approval
              required
            </span>
          )}
          <button className="sir-modal-btn close" onClick={onClose}>
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
const StoreIndentRequests = ({ navigate: navigateProp, canApprove }) => {
  const routerNavigate = useNavigate();
  const navigate = navigateProp || routerNavigate;
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();

  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [stores, setStores] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Modal
  const [selectedIndent, setSelectedIndent] = useState(null);

  /* ─ date defaults ─ */
  useEffect(() => {
    const today = new Date();
    const ago30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setDateFrom(ago30.toISOString().split("T")[0]);
    setDateTo(today.toISOString().split("T")[0]);
  }, []);

  /* ─ fetch stores ─ */
  useEffect(() => {
    axiosAPI
      .get("/stores", { params: { limit: 1000 } })
      .then((r) => {
        const d = r.data || r;
        setStores(
          Array.isArray(d.stores || d.data || d) ? d.stores || d.data || d : [],
        );
      })
      .catch(() => {});
  }, []);

  /* ─ fetch indents ─ */
  const fetchIndents = async (showFull = false) => {
    try {
      if (showFull) setLoading(true);
      else setTableLoading(true);

      const params = { page, limit };
      if (storeFilter !== "all") params.storeId = storeFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (dateFrom) params.fromDate = dateFrom;
      if (dateTo) params.toDate = dateTo;

      const response = await axiosAPI.get("/store-indents", params);
      const rd = response.data || response;
      let list = [],
        tp = 0,
        tot = 0;

      if (rd.success !== undefined) {
        const d = rd.data || rd;
        list = d.indents || d || [];
        tp = d.totalPages || 0;
        tot = d.total || list.length;
      } else if (rd.indents) {
        list = rd.indents;
        tp = rd.totalPages || 0;
        tot = rd.total || list.length;
      } else if (Array.isArray(rd)) {
        list = rd;
        tp = 1;
        tot = rd.length;
      } else {
        list = rd.data?.indents || rd.indents || [];
        tp = rd.totalPages || rd.data?.totalPages || 1;
        tot = rd.total || rd.data?.total || list.length;
      }

      setIndents(list);
      setTotalPages(tp);
      setTotal(tot);
      setHasFetched(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch indent requests",
      );
      setIndents([]);
      setTotalPages(0);
      setTotal(0);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchIndents();
  }, [
    page,
    limit,
    statusFilter,
    storeFilter,
    dateFrom,
    dateTo,
    selectedDivision,
    showAllDivisions,
  ]);

  /* ─ actions ─ */
  const doAction = async (indent, action) => {
    if (!canApprove) {
      setError(`Only Admin/Super Admin can ${action} indents`);
      return;
    }
    try {
      setSubmitting(true);
      const r = await axiosAPI.put(
        `/store-indents/indents/${indent.id}/approve-reject`,
        { action, notes: "" },
      );
      const rd = r.data || r;
      showSuccessNotification(rd.message || `Indent ${action}d successfully`);
      setSelectedIndent(null);
      fetchIndents();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          `Failed to ${action} indent`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ─ client-side search filter ─ */
  const filtered = indents.filter((i) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      i.id?.toString().includes(q) ||
      (i.code || "").toLowerCase().includes(q) ||
      (i.indentNumber || "").toLowerCase().includes(q) ||
      (i.store?.name || "").toLowerCase().includes(q) ||
      (i.store?.storeName || "").toLowerCase().includes(q)
    );
  });

  /* ─ KPIs ─ */
  const pendingCount = indents.filter((i) =>
    ["pending", "awaiting_approval"].includes(i.status?.toLowerCase()),
  ).length;
  const approvedCount = indents.filter(
    (i) => i.status?.toLowerCase() === "approved",
  ).length;
  const rejectedCount = indents.filter(
    (i) => i.status?.toLowerCase() === "rejected",
  ).length;
  const completedCount = indents.filter(
    (i) => i.status?.toLowerCase() === "completed",
  ).length;

  /* ─ Page nums ─ */
  const getPageNums = () => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, "…", totalPages];
    if (page >= totalPages - 2)
      return [
        1,
        "…",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  };

  if (loading && !hasFetched)
    return (
      <>
        <style>{css}</style>
        <IndentLoader />
      </>
    );

  return (
    <>
      <style>{css}</style>
      <div className="sir">
        {/* Toast error */}
        {error && (
          <div className="sir-toast">
            <AlertTriangle
              size={15}
              color="#e53e3e"
              style={{ flexShrink: 0 }}
            />
            <span className="sir-toast-msg">{error}</span>
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
        <div className="sir-bc">
          <span className="sir-bc-link" onClick={() => navigate("/sales")}>
            <LayoutGrid size={13} /> Sales
          </span>
          <ChevronRight size={12} style={{ color: "#c0c8dc" }} />
          <span className="cur">Store Indent Requests</span>
        </div>

        {/* Header */}
        <div className="sir-hdr">
          <div className="sir-hdr-title">
            <h1>
              <div className="sir-title-icon">
                <ClipboardList size={20} />
              </div>
              Store Indent Requests
            </h1>
            <p>Review, approve or reject store purchase indent requests</p>
          </div>
          <button
            className="sir-btn sir-btn-primary"
            onClick={() => fetchIndents(false)}
            disabled={tableLoading || loading}
          >
            <RefreshCw size={14} className={tableLoading ? "sir-spin" : ""} />{" "}
            Refresh
          </button>
        </div>

        {/* KPI strip */}
        {hasFetched && (
          <div className="sir-kpi">
            {[
              {
                cls: "navy",
                Icon: ClipboardList,
                label: "Total",
                value: total,
              },
              {
                cls: "amber",
                Icon: Clock,
                label: "Pending",
                value: pendingCount,
              },
              {
                cls: "green",
                Icon: BadgeCheck,
                label: "Approved",
                value: approvedCount,
              },
              {
                cls: "red",
                Icon: Ban,
                label: "Rejected",
                value: rejectedCount,
              },
              {
                cls: "blue",
                Icon: CheckCircle2,
                label: "Completed",
                value: completedCount,
              },
            ].map((k) => (
              <div key={k.label} className={`sir-kpi-card ${k.cls}`}>
                <div className="sir-kpi-icon">
                  <k.Icon size={16} />
                </div>
                <div className="sir-kpi-num">{k.value}</div>
                <div className="sir-kpi-lbl">{k.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter card */}
        <div className="sir-filter">
          <div className="sir-filter-lbl">
            <Filter size={12} /> Filters
          </div>
          <div className="sir-filter-row">
            {/* Search */}
            <div className="sir-ff" style={{ minWidth: 200 }}>
              <label>Search</label>
              <div className="sir-search-wrap">
                <Search size={13} className="sir-search-icon" />
                <input
                  className="sir-input"
                  placeholder="ID, Code, Store…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="sir-search-clear"
                    onClick={() => setSearchTerm("")}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Store */}
            <div className="sir-ff">
              <label>Store</label>
              <select
                className="sir-select"
                value={storeFilter}
                onChange={(e) => {
                  setStoreFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.storeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="sir-ff">
              <label>Status</label>
              <select
                className="sir-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="awaiting_approval">Awaiting Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Date range */}
            <div className="sir-ff">
              <label>From</label>
              <input
                className="sir-input"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="sir-ff">
              <label>To</label>
              <input
                className="sir-input"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div style={{ paddingTop: 22 }}>
              <button
                className="sir-btn sir-btn-primary"
                onClick={() => fetchIndents(false)}
                disabled={tableLoading}
              >
                <Filter size={14} /> Apply
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="sir-section">
          <div className="sir-section-hdr">
            <div className="sir-section-title">
              <ClipboardList size={15} color="#003176" />
              Indent Requests
              <span className="sir-badge">{filtered.length} records</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "#7a88a8" }}>Rows:</span>
              <select
                className="sir-per-page"
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 30, 50].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="sir-table-overlay">
            {tableLoading && (
              <div className="sir-table-loading">
                <RefreshCw size={22} color="#003176" className="sir-spin" />
              </div>
            )}
            <div className="sir-table-scroll">
              <table className="sir-tbl">
                <thead>
                  <tr>
                    <th>
                      <div className="th-inner">
                        <Hash size={11} /> ID
                      </div>
                    </th>
                    <th>
                      <div className="th-inner">
                        <ClipboardList size={11} /> Code
                      </div>
                    </th>
                    <th>
                      <div className="th-inner">
                        <Store size={11} /> Store
                      </div>
                    </th>
                    <th>
                      <div className="th-inner">
                        <Zap size={11} /> Priority
                      </div>
                    </th>
                    <th>
                      <div className="th-inner">
                        <Activity size={11} /> Status
                      </div>
                    </th>
                    <th>
                      <div className="th-inner">
                        <Calendar size={11} /> Date
                      </div>
                    </th>
                    <th>
                      <div className="th-inner">
                        <Boxes size={11} /> Items
                      </div>
                    </th>
                    <th>
                      <div className="th-inner">Actions</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableLoading && !hasFetched ? (
                    <SkeletonRows count={limit} />
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="sir-empty">
                          <div className="sir-empty-icon">
                            <ClipboardList size={28} />
                          </div>
                          <h3>
                            {searchTerm || statusFilter !== "all"
                              ? "No Matching Indents"
                              : "No Indent Requests Found"}
                          </h3>
                          <p>
                            {searchTerm || statusFilter !== "all"
                              ? "Try adjusting your search or filter criteria."
                              : "Store indent requests created in stores will appear here for review and approval."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((indent, idx) => (
                      <tr
                        key={indent.id}
                        style={{ animationDelay: `${idx * 0.03}s` }}
                      >
                        <td>
                          <div className="sir-id-cell">
                            <span className="sir-id-num">#{indent.id}</span>
                          </div>
                        </td>
                        <td>
                          <div className="sir-id-cell">
                            <span className="sir-id-code">
                              {indent.code ||
                                indent.indentNumber ||
                                `IND-${indent.id}`}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="sir-store-cell">
                            <div className="sir-store-dot" />
                            <span className="sir-store-name">
                              {indent.store?.name ||
                                indent.store?.storeName ||
                                "—"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <PriorityPill priority={indent.priority} />
                        </td>
                        <td>
                          <StatusPill status={indent.status} />
                        </td>
                        <td>
                          <div className="sir-date-cell">
                            <span className="sir-date-main">
                              {indent.createdAt
                                ? new Date(indent.createdAt).toLocaleDateString(
                                    "en-GB",
                                  )
                                : "—"}
                            </span>
                            <span className="sir-date-time">
                              {indent.createdAt
                                ? new Date(indent.createdAt).toLocaleTimeString(
                                    "en-GB",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )
                                : ""}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="sir-items-cell">
                            <Package size={11} />
                            {indent.items?.length ||
                              indent.totalItems ||
                              0}{" "}
                            item{(indent.items?.length || 0) !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td>
                          <div className="sir-action-wrap">
                            <button
                              className="sir-action-btn view"
                              onClick={() => setSelectedIndent(indent)}
                            >
                              <Eye size={12} /> View
                            </button>
                            {(indent.status === "pending" ||
                              indent.status === "awaiting_approval") &&
                              canApprove && (
                                <>
                                  <button
                                    className="sir-action-btn approve"
                                    onClick={() => doAction(indent, "approve")}
                                    disabled={submitting}
                                  >
                                    <CheckCircle2 size={12} /> Approve
                                  </button>
                                  <button
                                    className="sir-action-btn reject"
                                    onClick={() => doAction(indent, "reject")}
                                    disabled={submitting}
                                  >
                                    <XCircle size={12} /> Reject
                                  </button>
                                </>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="sir-pagination">
              <div className="sir-page-info">
                Showing{" "}
                <strong>
                  {(page - 1) * limit + 1}–{Math.min(page * limit, total)}
                </strong>{" "}
                of <strong>{total}</strong>
              </div>
              <div className="sir-page-btns">
                <button
                  className="sir-page-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} />
                </button>
                {getPageNums().map((n, i) =>
                  n === "…" ? (
                    <span key={`e${i}`} className="sir-page-ellipsis">
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      className={`sir-page-btn${page === n ? " active" : ""}`}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  className="sir-page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedIndent && (
          <IndentModal
            indent={selectedIndent}
            canApprove={canApprove}
            submitting={submitting}
            onApprove={(i) => doAction(i, "approve")}
            onReject={(i) => doAction(i, "reject")}
            onClose={() => setSelectedIndent(null)}
          />
        )}
      </div>
    </>
  );
};

export default StoreIndentRequests;
