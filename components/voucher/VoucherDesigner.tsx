"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  VoucherData,
  LayoutMap,
  ElementId,
  BLANK_DATA,
  DEFAULT_LAYOUT,
  STORAGE_KEY_LAYOUT,
  STORAGE_KEY_DATA,
  STORAGE_KEY_SERIAL,
  mmToPx,
  pxToMm,
  VOUCHER_W_MM,
  VOUCHER_H_MM,
  SHEET_W_MM,
  SHEET_H_MM,
  formatPvSerial,
  getNextPvBatch,
} from "./VoucherTypes";
import { SingleVoucher } from "./SingleVoucher";
import { DragHud } from "./DragHud";

function loadLayout(): LayoutMap {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAYOUT);
    if (raw) return { ...DEFAULT_LAYOUT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_LAYOUT;
}

function saveLayout(layout: LayoutMap) {
  try {
    localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(layout));
  } catch {}
}

function loadData(): VoucherData {
  if (typeof window === "undefined") return BLANK_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DATA);
    if (raw) return { ...BLANK_DATA, ...JSON.parse(raw) };
  } catch {}
  return BLANK_DATA;
}

function saveData(data: VoucherData) {
  try {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
  } catch {}
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function constrainElement(
  layout: LayoutMap,
  id: ElementId,
  x: number,
  y: number
): { x: number; y: number } {
  const el = layout[id];
  if (!el) return { x, y };
  return {
    x: clamp(x, 0, VOUCHER_W_MM - el.w),
    y: clamp(y, 0, VOUCHER_H_MM - el.h),
  };
}

export default function VoucherDesigner() {
  const [layout, setLayout] = useState<LayoutMap>(DEFAULT_LAYOUT);
  const [data, setData] = useState<VoucherData>(BLANK_DATA);
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementId | null>(null);
  const [activeVoucher, setActiveVoucher] = useState<number>(0);
  const [hudVisible, setHudVisible] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [showLogoPanel, setShowLogoPanel] = useState(false);
  const [lockAspect, setLockAspect] = useState(true);
  const [saveToast, setSaveToast] = useState(false);
  const [startSerial, setStartSerial] = useState<number>(1);
  const [printBatchCount, setPrintBatchCount] = useState<number>(3); // 3 pages = 9 vouchers (PV 1 to 9)

  const handleLogoChange = useCallback(
    (changes: Partial<{ x: number; y: number; w: number; h: number }>) => {
      setLayout((prev) => {
        const current = prev.logo || DEFAULT_LAYOUT.logo;
        let w = changes.w !== undefined ? changes.w : current.w;
        let h = changes.h !== undefined ? changes.h : current.h;
        let x = changes.x !== undefined ? changes.x : current.x;
        let y = changes.y !== undefined ? changes.y : current.y;

        w = clamp(w, 4, VOUCHER_W_MM);
        h = clamp(h, 4, VOUCHER_H_MM);
        x = clamp(x, 0, VOUCHER_W_MM - w);
        y = clamp(y, 0, VOUCHER_H_MM - h);

        return {
          ...prev,
          logo: { id: "logo", x, y, w, h },
        };
      });
    },
    []
  );

  useEffect(() => {
    // Clear old localStorage keys to ensure clean reset and start from 1
    try {
      localStorage.removeItem("goutami-pv-next-serial-portrait-v1");
      localStorage.removeItem("goutami-pv-next-serial-portrait-v2");
      localStorage.removeItem("goutami-pv-next-serial-portrait-v3");
      localStorage.removeItem("goutami-pv-next-serial-portrait-v4");
      localStorage.removeItem("goutami-pv-next-serial-portrait-v5");
      localStorage.removeItem("goutami-pv-data-portrait-v1");
      localStorage.removeItem("goutami-pv-data-portrait-v2");
      localStorage.removeItem("goutami-pv-data-portrait-v3");
      localStorage.removeItem("goutami-pv-data-portrait-v4");
      localStorage.removeItem("goutami-pv-data-portrait-v5");
      localStorage.removeItem("goutami-pv-layout-portrait-v5");
    } catch {}
    setLayout(loadLayout());
    setData(BLANK_DATA);
    setStartSerial(1);
    try {
      localStorage.setItem(STORAGE_KEY_SERIAL, "1");
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(BLANK_DATA));
    } catch {}
  }, []);

  const advanceToNextBatch = useCallback(() => {
    setStartSerial((prev) => {
      const next = prev + printBatchCount * 3;
      try {
        localStorage.setItem(STORAGE_KEY_SERIAL, String(next));
      } catch {}
      return next;
    });
  }, [printBatchCount]);

  const handleSetStartSerial = useCallback((val: number) => {
    const safe = Math.max(1, Math.floor(val));
    setStartSerial(safe);
    try {
      localStorage.setItem(STORAGE_KEY_SERIAL, String(safe));
    } catch {}
  }, []);

  // Listen to browser window print events (Ctrl+P or system print) so it automatically advances to next 3!
  useEffect(() => {
    const handleAfterPrint = () => {
      advanceToNextBatch();
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, [advanceToNextBatch]);

  useEffect(() => {
    saveLayout(layout);
  }, [layout]);

  useEffect(() => {
    saveData(data);
  }, [data]);

  // Keyboard navigation
  useEffect(() => {
    if (!isLayoutMode) return;
    const handler = (e: KeyboardEvent) => {
      if (!selectedElement) return;
      const step = e.shiftKey ? 5 : 1;
      const pxPerMm = mmToPx(1);
      let dxPx = 0;
      let dyPx = 0;
      switch (e.key) {
        case "ArrowLeft": dxPx = -step; break;
        case "ArrowRight": dxPx = step; break;
        case "ArrowUp": dyPx = -step; break;
        case "ArrowDown": dyPx = step; break;
        case "Escape":
          setSelectedElement(null);
          setHudVisible(false);
          return;
        default: return;
      }
      e.preventDefault();
      const dxMm = dxPx / pxPerMm;
      const dyMm = dyPx / pxPerMm;
      handleDragEnd(selectedElement, dxMm, dyMm);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isLayoutMode, selectedElement, layout]);

  const handleSelectElement = useCallback(
    (id: ElementId | null, voucherIdx: number) => {
      setSelectedElement(id);
      setActiveVoucher(voucherIdx);
      setHudVisible(id !== null);
    },
    []
  );

  const handleDragEnd = useCallback(
    (id: ElementId, dxMm: number, dyMm: number) => {
      setLayout((prev) => {
        const el = prev[id];
        if (!el) return prev;
        const { x, y } = constrainElement(prev, id, el.x + dxMm, el.y + dyMm);
        return { ...prev, [id]: { ...el, x, y } };
      });
    },
    []
  );

  const handleResize = useCallback(
    (dw: number, dh: number) => {
      if (!selectedElement) return;
      setLayout((prev) => {
        const el = prev[selectedElement];
        if (!el) return prev;
        const newW = clamp(el.w + dw, 3, VOUCHER_W_MM - el.x);
        const newH = clamp(el.h + dh, 1, VOUCHER_H_MM - el.y);
        return { ...prev, [selectedElement]: { ...el, w: newW, h: newH } };
      });
    },
    [selectedElement]
  );

  const handleNudge = useCallback(
    (dxPx: number, dyPx: number) => {
      if (!selectedElement) return;
      const dxMm = pxToMm(dxPx);
      const dyMm = pxToMm(dyPx);
      handleDragEnd(selectedElement, dxMm, dyMm);
    },
    [selectedElement, handleDragEnd]
  );

  const handleReset = useCallback(() => {
    if (confirm("Reset voucher layout positions to defaults?")) {
      setLayout(DEFAULT_LAYOUT);
      saveLayout(DEFAULT_LAYOUT);
    }
  }, []);

  const handleApplyToAll = useCallback(() => {
    saveLayout(layout);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2400);
  }, [layout]);

  const handleDataChange = useCallback(
    <K extends keyof VoucherData>(field: K, value: VoucherData[K]) => {
      setData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Generate 3 sequential 6-digit serial numbers for the 3 vouchers (GI - 000001, etc.)
  const sequentialPvNumbers = useMemo(() => {
    return getNextPvBatch(startSerial);
  }, [startSerial]);

  const voucherWpx = mmToPx(VOUCHER_W_MM);
  const voucherHpx = mmToPx(VOUCHER_H_MM);
  const sheetWpx = mmToPx(SHEET_W_MM);
  const sheetHpx = mmToPx(SHEET_H_MM);

  return (
    <>
      <div
        className="voucher-designer-root no-print"
        style={{
          minHeight: "100vh",
          backgroundColor: "#0b0f19",
          color: "#0f172a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "14px 0 50px 0",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
      {/* ─────────────────────────────── FLOATING CONTROL TOOLBAR ─────────────────────────────── */}
      <aside
        className="editor-ui toolbar"
        aria-label="Payment Voucher Toolbar"
        style={{
          position: "sticky",
          top: 8,
          zIndex: 1000,
          background: "rgba(15, 23, 42, 0.96)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: 10,
          padding: "8px 18px",
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          gap: 14,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          color: "#fff",
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13.5,
            fontWeight: 700,
            color: "#f8fafc",
            letterSpacing: "0.5px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          A4 Voucher Optimizer &bull; Gowtami Realty
        </h1>

        <div style={{ width: 1, height: 20, background: "rgba(255, 255, 255, 0.2)" }} />

        {/* Print Button (Ctrl+P) */}
        <button
          className="btn"
          onClick={() => window.print()}
          style={primaryBtnStyle}
          title={`Print ${printBatchCount} sheet(s) (${printBatchCount * 3} vouchers) via Chrome browser dialog`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print {printBatchCount === 3 ? "3 Sheets (PV 1-9)" : "1 Sheet"} (Ctrl+P)
        </button>

        {/* Print Batch Selector (1 Sheet vs 3 Sheets) */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.08)", padding: "2px 4px", borderRadius: 4 }}>
          <button
            onClick={() => setPrintBatchCount(1)}
            style={{
              ...presetBtnStyle,
              background: printBatchCount === 1 ? "#2563eb" : "transparent",
              color: printBatchCount === 1 ? "#fff" : "#cbd5e1",
              border: "none",
            }}
            title="Print 1 Sheet (3 Vouchers)"
          >
            1 Sheet
          </button>
          <button
            onClick={() => setPrintBatchCount(3)}
            style={{
              ...presetBtnStyle,
              background: printBatchCount === 3 ? "#2563eb" : "transparent",
              color: printBatchCount === 3 ? "#fff" : "#cbd5e1",
              border: "none",
            }}
            title="Print 3 Sheets (9 Vouchers, e.g. PV 1 to 9)"
          >
            3 Sheets (PV 1-9)
          </button>
        </div>

        {/* Interactive Move & Place (Pink button) */}
        <button
          className="btn"
          id="toggleDragBtn"
          onClick={() => {
            const next = !isLayoutMode;
            setIsLayoutMode(next);
            if (!next) {
              setSelectedElement(null);
              setHudVisible(false);
            }
          }}
          style={{
            ...primaryBtnStyle,
            background: isLayoutMode ? "#db2777" : "#ec4899",
            boxShadow: "0 2px 8px rgba(236, 72, 153, 0.4)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l3 3 3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
          </svg>
          Move & Place: {isLayoutMode ? "ON" : "OFF"}
        </button>

        {/* Logo Sizing & Position Settings */}
        <button
          className="btn"
          id="toggleLogoSettingsBtn"
          onClick={() => {
            setShowLogoPanel((prev) => !prev);
            setSelectedElement("logo");
          }}
          style={{
            ...primaryBtnStyle,
            background: showLogoPanel ? "#0284c7" : "#0369a1",
            boxShadow: showLogoPanel ? "0 0 10px rgba(56, 189, 248, 0.6)" : "0 2px 8px rgba(3, 105, 161, 0.35)",
          }}
          title="Adjust company logo dimensions and exact coordinates across all vouchers"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Logo Settings
        </button>

        {/* Data Fields Toggle */}
        <button
          className="btn"
          onClick={() => setShowDataPanel((prev) => !prev)}
          style={{
            ...primaryBtnStyle,
            background: showDataPanel ? "#1e293b" : "#334155",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit Form Data
        </button>

        {/* Sequential Serial Number Controls (GR - 000001, etc.) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.18)",
            padding: "3px 8px",
            borderRadius: 5,
            fontSize: 11,
            color: "#cbd5e1",
          }}
        >
          <span style={{ fontWeight: 800, color: "#38bdf8", letterSpacing: "0.04em" }}>GR &minus;</span>
          <input
            type="number"
            min={1}
            max={999999}
            value={startSerial}
            onChange={(e) => handleSetStartSerial(parseInt(e.target.value, 10) || 1)}
            style={{
              width: 65,
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 3,
              color: "#f8fafc",
              padding: "2px 4px",
              fontFamily: "monospace",
              fontSize: 11.5,
              fontWeight: 700,
              outline: "none",
            }}
            title="Starting PV serial number (formats to 6 digits, e.g. 000001)"
          />
          <button
            onClick={advanceToNextBatch}
            style={{
              background: "#2563eb",
              border: "none",
              borderRadius: 3,
              color: "#fff",
              fontSize: 10.5,
              fontWeight: 700,
              padding: "3px 7px",
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(37,99,235,0.4)",
            }}
            title="Advance to next 3 vouchers (auto-advances after print too)"
          >
            + Next 3
          </button>
          <button
            onClick={() => handleSetStartSerial(1)}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 3,
              color: "#94a3b8",
              fontSize: 10,
              padding: "3px 6px",
              cursor: "pointer",
            }}
            title="Reset start back to GI - 000001"
          >
            ↺ 1
          </button>
        </div>

        {/* Zoom Slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#cbd5e1" }}>
          <span>Scale:</span>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ width: 65, cursor: "pointer", accentColor: "#38bdf8" }}
          />
          <span style={{ fontFamily: "monospace", width: 34, color: "#f8fafc" }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(1.0)}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 4,
              color: "#cbd5e1",
              fontSize: 10,
              padding: "2px 6px",
              cursor: "pointer",
            }}
          >
            1:1
          </button>
        </div>

        <div style={{ width: 1, height: 20, background: "rgba(255, 255, 255, 0.2)" }} />

        {/* Save Layout Positions (Green) */}
        <button
          className="btn"
          onClick={handleApplyToAll}
          style={{
            ...primaryBtnStyle,
            background: "#10b981",
            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.35)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Save Layout
        </button>

        {/* Reset */}
        <button
          className="btn"
          onClick={handleReset}
          style={{
            ...primaryBtnStyle,
            background: "#64748b",
            boxShadow: "none",
          }}
        >
          Reset
        </button>

        {/* Print Tip Badge */}
        <div
          style={{
            fontSize: 10.5,
            color: "#94a3b8",
            background: "rgba(255, 255, 255, 0.05)",
            padding: "4px 9px",
            borderRadius: 4,
            borderLeft: "2.5px solid #3b82f6",
            whiteSpace: "nowrap",
          }}
        >
          <strong style={{ color: "#f8fafc" }}>A4 Portrait (3-Up)</strong> &bull; Margins:{" "}
          <strong style={{ color: "#f8fafc" }}>None</strong> &bull; 1 Page
        </div>
      </aside>

      {/* Save confirmation toast */}
      {saveToast && (
        <div
          style={{
            position: "fixed",
            top: 64,
            zIndex: 10000,
            background: "#10b981",
            color: "#fff",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            padding: "8px 18px",
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          ✓ Layout positions saved & applied to all 3 vouchers
        </div>
      )}

      {/* ─────────────────────────────── LOGO SETTINGS PANEL ─────────────────────────────── */}
      {showLogoPanel && (
        <section
          className="editor-ui"
          aria-label="Logo Configuration"
          style={{
            width: "90%",
            maxWidth: 1120,
            background: "rgba(15, 23, 42, 0.96)",
            backdropFilter: "blur(14px)",
            border: "1.5px solid #0284c7",
            borderRadius: 8,
            padding: "14px 18px",
            marginBottom: 20,
            boxShadow: "0 10px 30px rgba(2, 132, 199, 0.25)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#38bdf8",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                🖼️ Company Logo Sizing & Placement (All 3 Vouchers)
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Current: {layout.logo.w.toFixed(1)}mm &times; {layout.logo.h.toFixed(1)}mm &bull; X: {layout.logo.x.toFixed(1)}mm, Y: {layout.logo.y.toFixed(1)}mm
              </span>
            </div>
            <button
              onClick={() => setShowLogoPanel(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: "bold",
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {/* Width */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#cbd5e1" }}>
                <span style={{ fontWeight: 700 }}>Width (mm):</span>
                <span style={{ fontFamily: "monospace", color: "#38bdf8" }}>{layout.logo.w.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min={5}
                max={45}
                step={0.5}
                value={layout.logo.w}
                onChange={(e) => {
                  const newW = parseFloat(e.target.value);
                  const newH = lockAspect ? newW / 1.23 : layout.logo.h;
                  handleLogoChange({ w: newW, h: newH });
                }}
                style={{ accentColor: "#38bdf8", cursor: "pointer" }}
              />
            </div>

            {/* Height */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#cbd5e1" }}>
                <span style={{ fontWeight: 700 }}>Height (mm):</span>
                <span style={{ fontFamily: "monospace", color: "#38bdf8" }}>{layout.logo.h.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min={4}
                max={35}
                step={0.5}
                value={layout.logo.h}
                onChange={(e) => {
                  const newH = parseFloat(e.target.value);
                  const newW = lockAspect ? newH * 1.23 : layout.logo.w;
                  handleLogoChange({ w: newW, h: newH });
                }}
                style={{ accentColor: "#38bdf8", cursor: "pointer" }}
              />
            </div>

            {/* X Position */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#cbd5e1" }}>
                <span style={{ fontWeight: 700 }}>X (Horizontal Position):</span>
                <span style={{ fontFamily: "monospace", color: "#38bdf8" }}>{layout.logo.x.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min={0}
                max={130}
                step={0.5}
                value={layout.logo.x}
                onChange={(e) => handleLogoChange({ x: parseFloat(e.target.value) })}
                style={{ accentColor: "#38bdf8", cursor: "pointer" }}
              />
            </div>

            {/* Y Position */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#cbd5e1" }}>
                <span style={{ fontWeight: 700 }}>Y (Vertical Position):</span>
                <span style={{ fontFamily: "monospace", color: "#38bdf8" }}>{layout.logo.y.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                step={0.5}
                value={layout.logo.y}
                onChange={(e) => handleLogoChange({ y: parseFloat(e.target.value) })}
                style={{ accentColor: "#38bdf8", cursor: "pointer" }}
              />
            </div>
          </div>

          {/* Quick Presets & Options */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.1)", flexWrap: "wrap", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#e2e8f0", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={lockAspect}
                onChange={(e) => setLockAspect(e.target.checked)}
                style={{ accentColor: "#0284c7" }}
              />
              Lock Aspect Ratio (1.23:1)
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Presets:</span>
              <button
                onClick={() => handleLogoChange({ x: 3, y: 5.5, w: 14, h: 12 })}
                style={presetBtnStyle}
              >
                Default (14&times;12)
              </button>
              <button
                onClick={() => handleLogoChange({ x: 3, y: 5.0, w: 17, h: 14 })}
                style={presetBtnStyle}
              >
                Large (17&times;14)
              </button>
              <button
                onClick={() => handleLogoChange({ x: 3, y: 5.8, w: 11, h: 9 })}
                style={presetBtnStyle}
              >
                Compact (11&times;9)
              </button>
              <button
                onClick={() => handleLogoChange({ x: 67, y: 5.5 })}
                style={presetBtnStyle}
              >
                Center-X
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────── SLIDE-DOWN DATA ENTRY PANEL ─────────────────────────────── */}
      {showDataPanel && (
        <section
          className="editor-ui"
          aria-label="Voucher Data Form"
          style={{
            width: "90%",
            maxWidth: 1120,
            background: "rgba(15, 23, 42, 0.94)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: 8,
            padding: "14px 18px",
            marginBottom: 20,
            boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: "#38bdf8",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Fill Voucher Fields (Syncs Instantly to All 3 Vouchers)
            </span>
            <span style={{ fontSize: 10.5, color: "#94a3b8" }}>
              Leave PV No. blank to use auto-generated serials
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px" }}>
            <DataField label="Custom PV No." value={data.pvNumber} onChange={(v) => handleDataChange("pvNumber", v)} placeholder="e.g. PV-1001 (or auto)" />
            <DataField label="Date" value={data.date} onChange={(v) => handleDataChange("date", v)} type="text" placeholder="DD/MM/YYYY" />
            <DataField label="Paid To (Mr. / Ms.)" value={data.paidTo} onChange={(v) => handleDataChange("paidTo", v)} wide />

            {/* Payment Mode */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Payment Mode
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                {(["cash", "cheque", "dd", "rtgs", "neft", "bank"] as const).map((m) => {
                  const mLabel = {
                    cash: "Cash",
                    cheque: "Cheque",
                    dd: "Demand Draft",
                    rtgs: "RTGS",
                    neft: "NEFT",
                    bank: "Bank Transfer",
                  }[m];
                  return (
                    <label key={m} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", color: "#f8fafc", fontSize: 11 }}>
                      <input
                        type="radio"
                        name="paymentMode"
                        value={m}
                        checked={data.paymentMode === m}
                        onChange={() => handleDataChange("paymentMode", m)}
                        style={{ accentColor: "#2563eb" }}
                      />
                      <span>{mLabel}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <DataField label="By Cash / Cheque No." value={data.transactionNumber} onChange={(v) => handleDataChange("transactionNumber", v)} />
            <DataField label="Dated" value={data.paymentDate} onChange={(v) => handleDataChange("paymentDate", v)} placeholder="DD/MM/YYYY" />
            <DataField label="Amount (₹)" value={data.amount} onChange={(v) => handleDataChange("amount", v)} placeholder="e.g. 25,000.00" />
            <DataField label="Amount in Words" value={data.amountWords} onChange={(v) => handleDataChange("amountWords", v)} wide placeholder="e.g. Twenty Five Thousand" />
            <DataField label="Purpose / Particulars" value={data.particulars} onChange={(v) => handleDataChange("particulars", v)} wide />
          </div>
        </section>
      )}

      {/* ─────────────────────────────── A4 LANDSCAPE PRINT SHEET ─────────────────────────────── */}
      <main
        className="a4-page-viewport"
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          overflow: "auto",
          paddingBottom: 40,
        }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            transition: "transform 0.12s ease-out",
          }}
        >
          {/* Main 210mm × 297mm Sheet — Exactly 3 vouchers (1×3 Portrait) */}
          <div
            id="pv-print-sheet"
            className={isLayoutMode ? "drag-mode-active" : ""}
            style={{
              width: `${sheetWpx}px`,
              height: `${sheetHpx}px`,
              display: "grid",
              gridTemplateColumns: `${sheetWpx}px`,
              gridTemplateRows: `${voucherHpx}px ${voucherHpx}px ${voucherHpx}px`,
              background: "#ffffff",
              boxShadow: "0 15px 45px rgba(0, 0, 0, 0.6)",
              boxSizing: "border-box",
              position: "relative",
            }}
          >
            {[0, 1, 2].map((i) => (
              <SingleVoucher
                key={i}
                voucherIndex={i}
                data={data}
                layout={layout}
                isLayoutMode={isLayoutMode}
                selectedElement={selectedElement}
                onSelectElement={handleSelectElement}
                onDragEnd={handleDragEnd}
                isActive={activeVoucher === i}
                generatedPvNumber={sequentialPvNumbers[i]}
              />
            ))}
          </div>
        </div>
      </main>

      {/* ─────────────────────────────── DRAG & GEOMETRY HUD ─────────────────────────────── */}
      {isLayoutMode && hudVisible && selectedElement && (
        <DragHud
          selectedElement={selectedElement}
          layout={layout}
          onNudge={handleNudge}
          onReset={handleReset}
          onApplyToAll={handleApplyToAll}
          onClose={() => {
            setHudVisible(false);
            setSelectedElement(null);
          }}
          onResize={handleResize}
        />
      )}
    </div>

    {/* ── 2. DEDICATED PRINT SHEET (100% Isolated Pure A4, Zero Containing Blocks) ── */}
    <div id="pv-print-sheet" className="pv-print-container">
      {Array.from({ length: printBatchCount }).map((_, pageIdx) => (
        <div key={pageIdx} className="pv-print-page">
          {[0, 1, 2].map((slotIdx) => {
            const currentSerial = startSerial + pageIdx * 3 + slotIdx;
            const currentPvNum = `GR - ${String(currentSerial).padStart(6, "0")}`;
            return (
              <div key={slotIdx} className={`pv-print-slot pv-print-slot-${slotIdx}`}>
                <SingleVoucher
                  voucherIndex={slotIdx}
                  data={data}
                  layout={layout}
                  isLayoutMode={false}
                  selectedElement={null}
                  onSelectElement={() => {}}
                  onDragEnd={() => {}}
                  isActive={false}
                  generatedPvNumber={currentPvNum}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>

    {/* ─────────────────────────────── GLOBAL PRINT & INTERACTIVE STYLES ─────────────────────────────── */}
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&family=Playfair+Display:wght@700;800;900&display=swap');

      /* Interactive Drag & Position Styles */
      .drag-mode-active .pv-draggable {
        cursor: move !important;
      }

      .drag-mode-active .pv-draggable:hover {
        outline: 2px dashed #ec4899 !important;
        filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.8)) !important;
      }

      .selected-drag-target {
        outline: 2.5px solid #2563eb !important;
        filter: drop-shadow(0 0 8px rgba(37, 99, 235, 0.9)) !important;
      }

      /* Hidden on screen by default */
      .pv-print-container {
        display: none !important;
      }

      /* Pure CSS Paged Media Standard: Strict A4 Portrait */
      @page {
        size: A4 portrait;
        margin: 0 !important;
      }

      @media print {
        *, *::before, *::after {
          box-sizing: border-box !important;
        }

        /* 1. Completely eliminate screen UI, navigation, headers, footers */
        .no-print,
        .voucher-designer-root,
        header,
        footer,
        nav,
        aside,
        .navbar,
        .footer,
        .editor-ui,
        .toolbar,
        #dragHud {
          display: none !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 210mm !important;
          height: auto !important;
          max-height: none !important;
          background: #ffffff !important;
          background-color: #ffffff !important;
          overflow: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Reset all parent wrappers */
        body > div,
        body > div > div,
        .flex-1 {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          background-color: #ffffff !important;
          height: auto !important;
          max-height: none !important;
          width: 210mm !important;
          max-width: 210mm !important;
          display: block !important;
          overflow: visible !important;
        }

        /* 2. Show dedicated print pages: exact A4, 0 margins, exact 3-row grid per page */
        .pv-print-container {
          display: block !important;
          width: 210mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
        }

        .pv-print-page {
          display: grid !important;
          grid-template-columns: 210mm !important;
          grid-template-rows: 98.66mm 98.66mm 98.66mm !important;
          width: 210mm !important;
          height: 296mm !important;
          max-width: 210mm !important;
          max-height: 297mm !important;
          margin: 0 !important;
          padding: 0.3mm 0 0 0 !important;
          box-sizing: border-box !important;
          background: #ffffff !important;
          background-color: #ffffff !important;
          page-break-after: always !important;
          break-after: page !important;
          overflow: hidden !important;
        }

        .pv-print-page:last-child {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }

        .pv-print-container,
        .pv-print-container * {
          box-shadow: none !important;
          text-shadow: none !important;
          filter: none !important;
        }

        .pv-print-slot {
          width: 210mm !important;
          height: 98.66mm !important;
          max-width: 210mm !important;
          max-height: 98.66mm !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          background: #ffffff !important;
        }

        .pv-print-slot-0,
        .pv-print-slot-1 {
          border-bottom: 0.75pt dashed #94a3b8 !important;
        }

        .pv-print-slot-2 {
          border-bottom: 0.75px solid #334155 !important;
        }

        .pv-print-slot > div {
          width: 210mm !important;
          height: 98.66mm !important;
          max-width: 210mm !important;
          max-height: 98.66mm !important;
          box-sizing: border-box !important;
          border: 0.75px solid #334155 !important;
          border-bottom: none !important;
        }

        .pv-print-slot-2 > div {
          border-bottom: 0.75px solid #334155 !important;
        }

        .pv-draggable {
          outline: none !important;
          cursor: default !important;
          filter: none !important;
        }

        .selected-drag-target {
          outline: none !important;
          filter: none !important;
        }

        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `}</style>
  </>
  );
}

const DataField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  wide?: boolean;
}> = ({ label, value, onChange, type = "text", placeholder, wide }) => {
  const fieldId = `pv-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: wide ? 200 : 120, flex: wide ? 1.5 : 1 }}>
      <label
        htmlFor={fieldId}
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 9.5,
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </label>
      <input
        id={fieldId}
        name={fieldId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          padding: "4px 8px",
          background: "rgba(255, 255, 255, 0.06)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          borderRadius: 4,
          color: "#f8fafc",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
};

const primaryBtnStyle: React.CSSProperties = {
  appearance: "none",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontFamily: "'Inter', sans-serif",
  fontSize: 12,
  fontWeight: 600,
  padding: "6px 14px",
  borderRadius: 5,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  transition: "all 0.15s ease",
  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.35)",
  whiteSpace: "nowrap",
};

const presetBtnStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.08)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  color: "#f8fafc",
  fontSize: 10.5,
  fontFamily: "'Inter', sans-serif",
  fontWeight: 600,
  padding: "3px 8px",
  borderRadius: 4,
  cursor: "pointer",
  transition: "all 0.15s ease",
};
