"use client";

import React from "react";
import { ElementId, ElementLayout, LayoutMap, ELEMENT_LABELS, pxToMm, mmToPx, VOUCHER_W_MM, VOUCHER_H_MM } from "./VoucherTypes";

interface DragHudProps {
  selectedElement: ElementId | null;
  layout: LayoutMap;
  onNudge: (dx: number, dy: number) => void;
  onReset: () => void;
  onApplyToAll: () => void;
  onClose: () => void;
  onResize: (dw: number, dh: number) => void;
}

const fmt = (mm: number) => mm.toFixed(1);
const fmtPx = (mm: number) => Math.round(mmToPx(mm));

export const DragHud: React.FC<DragHudProps> = ({
  selectedElement,
  layout,
  onNudge,
  onReset,
  onApplyToAll,
  onClose,
  onResize,
}) => {
  const el: ElementLayout | null = selectedElement ? layout[selectedElement] : null;

  return (
    <aside
      id="dragHud"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: 10,
        padding: "12px 18px",
        boxShadow: "0 15px 35px rgba(0, 0, 0, 0.6)",
        color: "#f8fafc",
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minWidth: 290,
        pointerEvents: "auto",
      }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label="Layout Adjustment HUD"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
          paddingBottom: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2">
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l3 3 3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
          </svg>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: "0.5px",
              color: "#38bdf8",
              textTransform: "uppercase",
            }}
          >
            Position & Geometry HUD
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
            padding: "0 4px",
          }}
          aria-label="Close HUD"
        >
          ✕
        </button>
      </div>

      {/* Target element label badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10.5, color: "#94a3b8" }}>Target Element:</span>
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: "#60a5fa",
            background: "rgba(37, 99, 235, 0.15)",
            border: "0.5px solid rgba(96, 165, 250, 0.3)",
            borderRadius: 4,
            padding: "1px 7px",
          }}
        >
          {selectedElement ? ELEMENT_LABELS[selectedElement] : "None"}
        </span>
      </div>

      {/* Real-time MM & PX Readouts */}
      {el && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "5px 12px",
            background: "rgba(0, 0, 0, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 6,
            padding: "8px 10px",
          }}
        >
          {[
            { label: "X", val: el.x },
            { label: "Y", val: el.y },
            { label: "W", val: el.w },
            { label: "H", val: el.h },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ color: "#94a3b8", fontSize: 9.5, fontWeight: 700, width: 12 }}>{label}:</span>
              <span style={{ color: "#f8fafc", fontWeight: 800, fontSize: 11.5, fontFamily: "monospace" }}>
                {fmt(val)}<span style={{ color: "#38bdf8", fontSize: 9, marginLeft: 1 }}>mm</span>
              </span>
              <span style={{ color: "#64748b", fontSize: 9, marginLeft: 2 }}>
                ({fmtPx(val)}px)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Width / Height adjusters */}
      {el && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 10, color: "#cbd5e1" }}>Width:</span>
            <input
              type="number"
              value={fmt(el.w)}
              step={0.5}
              min={3}
              max={VOUCHER_W_MM}
              onChange={(e) => onResize(parseFloat(e.target.value) - el.w, 0)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 10, color: "#cbd5e1" }}>Height:</span>
            <input
              type="number"
              value={fmt(el.h)}
              step={0.5}
              min={1}
              max={VOUCHER_H_MM}
              onChange={(e) => onResize(0, parseFloat(e.target.value) - el.h)}
              style={inputStyle}
            />
          </div>
          <span style={{ fontSize: 9.5, color: "#38bdf8", fontWeight: 700 }}>mm</span>
        </div>
      )}

      {/* Arrow nudge controls */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <NudgeRow>
          <NudgeBtn onClick={() => onNudge(0, -1)} title="Nudge Up (ArrowUp)" aria-label="Nudge up">↑</NudgeBtn>
        </NudgeRow>
        <NudgeRow>
          <NudgeBtn onClick={() => onNudge(-1, 0)} title="Nudge Left (ArrowLeft)" aria-label="Nudge left">←</NudgeBtn>
          <NudgeBtn onClick={() => onNudge(0, 1)} title="Nudge Down (ArrowDown)" aria-label="Nudge down">↓</NudgeBtn>
          <NudgeBtn onClick={() => onNudge(1, 0)} title="Nudge Right (ArrowRight)" aria-label="Nudge right">→</NudgeBtn>
        </NudgeRow>
        <p style={{ margin: 0, fontSize: 9, color: "#94a3b8", textAlign: "center", marginTop: 2 }}>
          Arrow keys move 1px &bull; Shift+Arrow moves 5px
        </p>
      </div>

      {/* Action buttons (Green Save/Apply, Gray Reset) */}
      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        <button
          onClick={onReset}
          style={{
            flex: 1,
            padding: "6px 0",
            background: "#475569",
            border: "none",
            borderRadius: 5,
            color: "#ffffff",
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.15s ease",
          }}
        >
          Reset
        </button>
        <button
          onClick={onApplyToAll}
          style={{
            flex: 1.5,
            padding: "6px 0",
            background: "#10b981",
            border: "none",
            borderRadius: 5,
            color: "#ffffff",
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.35)",
            transition: "background 0.15s ease",
          }}
        >
          Apply to All 3
        </button>
      </div>
    </aside>
  );
};

const inputStyle: React.CSSProperties = {
  width: 52,
  background: "rgba(255, 255, 255, 0.08)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  borderRadius: 4,
  color: "#f8fafc",
  fontFamily: "monospace",
  fontSize: 11,
  padding: "3px 6px",
  outline: "none",
  textAlign: "right",
};

const NudgeRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", gap: 3 }}>{children}</div>
);

const NudgeBtn: React.FC<{
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}> = ({ onClick, title, children, "aria-label": ariaLabel }) => (
  <button
    onClick={onClick}
    title={title}
    aria-label={ariaLabel}
    style={{
      width: 28,
      height: 26,
      background: "#334155",
      border: "none",
      borderRadius: 4,
      color: "#ffffff",
      cursor: "pointer",
      fontSize: 13,
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background 0.15s",
    }}
  >
    {children}
  </button>
);
