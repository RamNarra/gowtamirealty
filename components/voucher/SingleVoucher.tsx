"use client";

import React, { useRef, useCallback } from "react";
import {
  VoucherData,
  LayoutMap,
  ElementId,
  VOUCHER_W_MM,
  VOUCHER_H_MM,
  mmToPx,
  ELEMENT_LABELS,
} from "./VoucherTypes";
import { VoucherLogo } from "./VoucherLogo";

interface SingleVoucherProps {
  data: VoucherData;
  layout: LayoutMap;
  voucherIndex: number;
  isLayoutMode: boolean;
  selectedElement: ElementId | null;
  onSelectElement: (id: ElementId | null, voucherIndex: number) => void;
  onDragEnd: (id: ElementId, dxMm: number, dyMm: number) => void;
  isActive: boolean;
  generatedPvNumber: string;
}

const THEME = {
  primary: "#1e1b4b",          // Deep indigo / midnight navy
  border: "#334155",           // Slate 700 outer voucher boundary
  borderLight: "#cbd5e1",      // Slate 300 rules
  borderUltralight: "#e2e8f0", // Slate 200 guidelines
  textDark: "#0f172a",         // Slate 900
  textMid: "#1e293b",          // Slate 800
  textMuted: "#475569",        // Slate 600 labels
  textSubtle: "#64748b",       // Slate 500 minor hints
  accentBlue: "#2563eb",       // Interactive blue
  accentCyan: "#0369a1",       // Cyan highlight
  badgeBg: "#eff6ff",          // Light blue badge tint
  badgeBorder: "#bfdbfe",      // Light blue badge border
  badgeText: "#1d4ed8",        // Deep blue badge text
  paperBg: "#ffffff",          // Crisp white
  zebraBg: "#f8fafc",          // Alternating card/row background
};

/** High-contrast field label in Outfit — refined, non-bold 400/500 */
const FieldLabel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <span
    style={{
      fontFamily: "'Outfit', sans-serif",
      fontSize: "8.5pt",
      fontWeight: 500,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: THEME.textMuted,
      lineHeight: 1,
      display: "inline-block",
      flexShrink: 0,
      paddingBottom: "2pt",
      ...style,
    }}
  >
    {children}
  </span>
);

/** Sleek horizontal write-line with vertical baseline alignment & ample pen writing height */
const WriteLine: React.FC<{ flex?: number; value?: string; style?: React.CSSProperties }> = ({
  flex = 1,
  value,
  style,
}) => (
  <span
    style={{
      flex,
      borderBottom: `0.75pt solid ${THEME.borderLight}`,
      display: "inline-flex",
      alignItems: "flex-end",
      height: "100%",
      minHeight: "16pt",
      paddingLeft: "4pt",
      paddingBottom: "2pt",
      boxSizing: "border-box",
      fontFamily: "'Inter', sans-serif",
      fontSize: "8.5pt",
      fontWeight: 400,
      color: THEME.textDark,
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      ...style,
    }}
  >
    {value || ""}
  </span>
);

/** Clear underline slots for pen date writing (DD / MM / YYYY) */
const DateSlots: React.FC = () => (
  <span
    style={{
      fontFamily: "'Outfit', sans-serif",
      fontSize: "9.5px",
      fontWeight: 400,
      color: THEME.textDark,
      display: "inline-flex",
      alignItems: "baseline",
      gap: "2px",
    }}
  >
    Date:
    <span
      style={{
        display: "inline-block",
        width: "14px",
        borderBottom: `0.75pt solid ${THEME.borderLight}`,
        margin: "0 2px",
      }}
    />
    /
    <span
      style={{
        display: "inline-block",
        width: "14px",
        borderBottom: `0.75pt solid ${THEME.borderLight}`,
        margin: "0 2px",
      }}
    />
    /
    <span
      style={{
        display: "inline-block",
        width: "20px",
        borderBottom: `0.75pt solid ${THEME.borderLight}`,
        margin: "0 2px",
      }}
    />
  </span>
);

export const SingleVoucher: React.FC<SingleVoucherProps> = ({
  data,
  layout,
  voucherIndex,
  isLayoutMode,
  selectedElement,
  onSelectElement,
  onDragEnd,
  isActive,
  generatedPvNumber,
}) => {
  const voucherRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    id: ElementId;
    startMouseX: number;
    startMouseY: number;
  } | null>(null);

  const wPx = mmToPx(VOUCHER_W_MM);
  const hPx = mmToPx(VOUCHER_H_MM);

  const getElementStyle = useCallback(
    (id: ElementId): React.CSSProperties => {
      const el = layout[id];
      if (!el) return {};
      const isSelected = isLayoutMode && isActive && selectedElement === id;
      const base: React.CSSProperties = {
        position: "absolute",
        left: mmToPx(el.x),
        top: mmToPx(el.y),
        width: mmToPx(el.w),
        height: mmToPx(el.h),
        boxSizing: "border-box",
        userSelect: isLayoutMode ? "none" : "auto",
      };
      if (isLayoutMode) {
        return {
          ...base,
          cursor: "move",
          outline: isSelected ? "2.5px solid #2563eb" : undefined,
          filter: isSelected ? "drop-shadow(0 0 8px rgba(37, 99, 235, 0.9))" : undefined,
        };
      }
      return base;
    },
    [layout, isLayoutMode, isActive, selectedElement]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, id: ElementId) => {
      if (!isLayoutMode) return;
      e.preventDefault();
      e.stopPropagation();
      onSelectElement(id, voucherIndex);

      dragState.current = {
        id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
      };

      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
    },
    [isLayoutMode, onSelectElement, voucherIndex]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent, id: ElementId) => {
      if (!dragState.current || dragState.current.id !== id) return;
      const ds = dragState.current;
      const dxPx = e.clientX - ds.startMouseX;
      const dyPx = e.clientY - ds.startMouseY;
      onDragEnd(id, dxPx / mmToPx(1), dyPx / mmToPx(1));

      dragState.current = {
        id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
      };
    },
    [onDragEnd]
  );

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  const elProps = (id: ElementId) => ({
    style: getElementStyle(id),
    onPointerDown: (e: React.PointerEvent) => handlePointerDown(e, id),
    onPointerMove: (e: React.PointerEvent) => handlePointerMove(e, id),
    onPointerUp: handlePointerUp,
    "data-element-id": id,
    title: isLayoutMode ? ELEMENT_LABELS[id] : undefined,
    className: isLayoutMode
      ? `pv-draggable${isActive && selectedElement === id ? " selected-drag-target" : ""}`
      : undefined,
  });

  const handleVoucherClick = (e: React.MouseEvent) => {
    if (!isLayoutMode) return;
    const target = e.target as HTMLElement;
    if (!target.closest("[data-element-id]")) {
      onSelectElement(null, voucherIndex);
    }
  };

  const rawPv = (data.pvNumber || generatedPvNumber || "1").trim();
  const digitsOnly = rawPv.replace(/\D/g, "");
  const sixDigitSerial = digitsOnly.length >= 6 ? digitsOnly.slice(-6) : (digitsOnly ? digitsOnly.padStart(6, "0") : "000001");

  return (
    <div
      ref={voucherRef}
      onClick={handleVoucherClick}
      style={{
        position: "relative",
        width: wPx,
        height: hPx,
        background: THEME.paperBg,
        boxSizing: "border-box",
        overflow: "hidden",
        border: `0.75px solid ${THEME.border}`,
        flexShrink: 0,
      }}
    >
      {/* ── SUBTLE WATERMARK ── */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "65mm",
          height: "52mm",
          opacity: 0.035,
          pointerEvents: "none",
          zIndex: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <VoucherLogo height="100%" />
      </div>

      {/* ── 1. LOGO (Fluid scaling with draggable & resizable bounds) ── */}
      <div
        {...elProps("logo")}
        style={{
          ...getElementStyle("logo"),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <VoucherLogo width="100%" height="100%" />
      </div>

      {/* ── 2. COMPANY BLOCK (Increased fonts, address + new line for contacts) ── */}
      <div
        {...elProps("companyBlock")}
        style={{
          ...getElementStyle("companyBlock"),
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "13pt",
            fontWeight: 500,
            color: THEME.primary,
            letterSpacing: "0.08em",
            lineHeight: 1.15,
            textTransform: "uppercase",
          }}
        >
          Gowtami Realty
        </div>
        <div
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "7.2pt",
            fontWeight: 400,
            color: THEME.accentCyan,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginTop: "1.5pt",
          }}
        >
          Corporate Office &bull; Jubilee Hills, Hyderabad
        </div>
        {/* Address Line (Expanded across the block) */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "7.5pt",
            fontWeight: 400,
            color: THEME.textMid,
            letterSpacing: "0.02em",
            lineHeight: 1.3,
            marginTop: "2pt",
            whiteSpace: "nowrap",
          }}
        >
          Plot No.144, Rd 72, Jubilee Hills, Hyderabad, Telangana 500096
        </div>
      </div>

      {/* ── 3. TITLE BLOCK (Outline only, black text, zero color block) ── */}
      <div
        {...elProps("titleBlock")}
        style={{
          ...getElementStyle("titleBlock"),
          background: "#ffffff",
          border: `1.2px solid ${THEME.border}`,
          borderRadius: "4px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5pt 5pt",
          boxShadow: "none",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "12px",
            fontWeight: 500,
            color: THEME.textDark,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          Payment Voucher
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "2.5pt",
            width: "100%",
          }}
        >
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "8.5px",
              fontWeight: 400,
              color: THEME.textMuted,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            CASH / CHEQUE
          </span>
        </div>
      </div>

      {/* ── 4. HEADER DIVIDER ── */}
      <div
        {...elProps("headerDivider")}
        style={{
          ...getElementStyle("headerDivider"),
          background: THEME.primary,
          height: "0.75pt",
          zIndex: 2,
        }}
      />

      {/* ── 5a. PV NO. (Separate Draggable Element) ── */}
      <div
        {...elProps("pvNumberBlock")}
        style={{
          ...getElementStyle("pvNumberBlock"),
          display: "flex",
          alignItems: "flex-end",
          gap: "5pt",
          padding: "0 2pt",
          zIndex: 2,
        }}
      >
        <FieldLabel style={{ paddingBottom: "1.5pt" }}>PV No.</FieldLabel>
        <span
          suppressHydrationWarning
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "2pt",
            borderBottom: `0.75pt solid ${THEME.borderLight}`,
            padding: "0 6pt 1pt 2pt",
            minWidth: "62pt",
            height: "11pt",
          }}
        >
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "9.5pt",
              fontWeight: 500,
              color: THEME.primary,
              letterSpacing: "0.04em",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            GR
          </span>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "9pt",
              fontWeight: 400,
              color: THEME.textMuted,
              margin: "0 2pt",
            }}
          >
            &minus;
          </span>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "9.2pt",
              fontWeight: 400,
              color: THEME.primary,
              letterSpacing: "0.08em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {sixDigitSerial}
          </span>
        </span>
      </div>

      {/* ── 5b. DATE (Separate Draggable Element) ── */}
      <div
        {...elProps("dateBlock")}
        style={{
          ...getElementStyle("dateBlock"),
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          gap: "5pt",
          padding: "0 2pt",
          zIndex: 2,
        }}
      >
        <FieldLabel style={{ paddingBottom: "1.5pt" }}>Date</FieldLabel>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "8.2pt",
            fontWeight: 400,
            color: THEME.textDark,
            borderBottom: `0.75pt solid ${THEME.borderLight}`,
            padding: "0 6pt 1pt 4pt",
            minWidth: "48pt",
            height: "11pt",
            textAlign: "center",
            display: "inline-flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          {data.date || ""}
        </span>
      </div>

      {/* ── 6. PAID TO (Mr. / Ms.) ── */}
      <div
        {...elProps("paidToRow")}
        style={{
          ...getElementStyle("paidToRow"),
          display: "flex",
          alignItems: "flex-end",
          gap: "5pt",
          padding: "0 2pt",
          zIndex: 2,
        }}
      >
        <FieldLabel>Paid To&ensp;Mr.&thinsp;/&thinsp;Ms.</FieldLabel>
        <WriteLine value={data.paidTo} />
      </div>

      {/* ── 7. PAYMENT MODE (Cash, Cheque, Bank Transfer) ── */}
      <div
        {...elProps("paymentModeRow")}
        style={{
          ...getElementStyle("paymentModeRow"),
          display: "flex",
          alignItems: "center",
          gap: "10pt",
          background: THEME.zebraBg,
          border: `0.75pt solid ${THEME.borderLight}`,
          borderRadius: "3px",
          padding: "0 6pt",
          zIndex: 2,
        }}
      >
        <FieldLabel>Payment Mode</FieldLabel>
        {(["cash", "cheque", "dd", "rtgs", "neft", "bank"] as const).map((mode) => {
          const labels = {
            cash: "Cash",
            cheque: "Cheque",
            dd: "Demand Draft",
            rtgs: "RTGS",
            neft: "NEFT",
            bank: "Bank Transfer",
          };
          const checked = data.paymentMode === mode;
          return (
            <span
              key={mode}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "7.1pt",
                fontWeight: 400,
                color: checked ? THEME.badgeText : THEME.textMid,
                background: checked ? THEME.badgeBg : "#ffffff",
                border: `0.75pt solid ${checked ? THEME.accentBlue : THEME.borderLight}`,
                borderRadius: "3px",
                padding: "1pt 4pt",
                display: "inline-flex",
                alignItems: "center",
                gap: "2.5pt",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: "6pt",
                  height: "6pt",
                  borderRadius: "1.5px",
                  border: `0.75pt solid ${checked ? THEME.accentBlue : THEME.borderLight}`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: checked ? THEME.accentBlue : "transparent",
                  color: "#ffffff",
                  fontSize: "4.8pt",
                  lineHeight: 1,
                  fontWeight: 400,
                }}
              >
                {checked ? "✓" : ""}
              </span>
              {labels[mode]}
            </span>
          );
        })}
      </div>

      {/* ── 8. BY CASH / CHEQUE NO. & DATED ── */}
      <div
        {...elProps("byCashChequeRow")}
        style={{
          ...getElementStyle("byCashChequeRow"),
          display: "flex",
          alignItems: "flex-end",
          gap: "5pt",
          padding: "0 2pt",
          zIndex: 2,
        }}
      >
        <FieldLabel>By Cash / Cheque No.</FieldLabel>
        <WriteLine value={data.transactionNumber} flex={2} />
        <FieldLabel style={{ marginLeft: "8pt" }}>Dated</FieldLabel>
        <WriteLine value={data.paymentDate} flex={1} style={{ textAlign: "center" }} />
      </div>

      {/* ── 9. AMOUNT IN WORDS (Rupees ... only) ── */}
      <div
        {...elProps("amountWordsRow")}
        style={{
          ...getElementStyle("amountWordsRow"),
          display: "flex",
          alignItems: "flex-end",
          gap: "5pt",
          padding: "0 2pt",
          zIndex: 2,
        }}
      >
        <FieldLabel>Amount in Words</FieldLabel>
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "8.2pt",
            fontWeight: 400,
            color: THEME.textMuted,
            paddingBottom: "2pt",
          }}
        >
          Rupees
        </span>
        <WriteLine value={data.amountWords} flex={1} />
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "8.2pt",
            fontWeight: 400,
            color: THEME.textMuted,
            paddingBottom: "2pt",
          }}
        >
          Only
        </span>
      </div>

      {/* ── 10. PURPOSE / PARTICULARS (Single clean line) ── */}
      <div
        {...elProps("particularsRow")}
        style={{
          ...getElementStyle("particularsRow"),
          display: "flex",
          alignItems: "flex-end",
          gap: "5pt",
          padding: "0 2pt",
          zIndex: 2,
        }}
      >
        <FieldLabel>Purpose / Particulars</FieldLabel>
        <WriteLine value={data.particulars} />
      </div>

      {/* ── 11. AMOUNT BOX (Clean outline, zero blue color fill) ── */}
      <div
        {...elProps("amountRow")}
        style={{
          ...getElementStyle("amountRow"),
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#ffffff",
          border: `1.2px solid ${THEME.border}`,
          borderRadius: "3px",
          padding: "0 8pt",
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6pt" }}>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "12px",
              fontWeight: 500,
              color: THEME.textDark,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Amount
          </span>
          <span
            style={{
              background: "#ffffff",
              border: `0.5px solid ${THEME.borderLight}`,
              borderRadius: "2px",
              padding: "1pt 4pt",
              fontSize: "10px",
              fontWeight: 400,
              fontFamily: "'Outfit', sans-serif",
              color: THEME.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            INR
          </span>
        </div>

        {/* Right side: Money value written to the LEFT of ₹, and ₹ at the RIGHT END */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "6pt", flex: 1, justifyContent: "flex-end" }}>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "12px",
              fontWeight: 500,
              color: THEME.textDark,
              letterSpacing: "0.04em",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
              minWidth: "32mm",
              textAlign: "right",
              paddingRight: "4pt",
            }}
          >
            {data.amount || ""}
          </span>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "12px",
              fontWeight: 500,
              color: THEME.textDark,
              lineHeight: 1,
            }}
          >
            ₹
          </span>
        </div>
      </div>

      {/* ── 12. PREPARED & APPROVED BY GRID (Larger height under Amount) ── */}
      <div
        {...elProps("signaturesRow")}
        style={{
          ...getElementStyle("signaturesRow"),
          border: `1.2px solid ${THEME.border}`,
          borderRadius: "3px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "#ffffff",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        {(["Prepared By", "Approved By"] as const).map((label, idx) => (
          <div
            key={label}
            style={{
              padding: "4pt 8pt",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderRight: idx === 0 ? `1px solid ${THEME.borderLight}` : "none",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "12px",
                color: THEME.primary,
                textTransform: "uppercase",
                fontWeight: 500,
                letterSpacing: "0.05em",
                lineHeight: 1,
              }}
            >
              {label}
            </span>
            <div style={{ flex: 1, minHeight: "12pt" }} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                borderTop: `0.5pt dashed ${THEME.borderLight}`,
                paddingTop: "2pt",
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "10px",
                  color: THEME.textSubtle,
                  textTransform: "uppercase",
                  fontWeight: 400,
                }}
              >
                Sign & Stamp
              </span>
              <DateSlots />
            </div>
          </div>
        ))}
      </div>

      {/* ── 13. RECEIVED BY (Tall Box spanning entire height of Amount + Signatures) ── */}
      <div
        {...elProps("receivedByBlock")}
        style={{
          ...getElementStyle("receivedByBlock"),
          border: `1.2px solid ${THEME.border}`,
          borderRadius: "3px",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "4pt 8pt",
          boxSizing: "border-box",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "12px",
            color: THEME.primary,
            textTransform: "uppercase",
            fontWeight: 500,
            letterSpacing: "0.05em",
            lineHeight: 1,
          }}
        >
          Received By
        </span>

        {/* Spacious open signature & stamp room */}
        <div style={{ flex: 1, minHeight: "20pt" }} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: `0.5pt dashed ${THEME.borderLight}`,
            paddingTop: "2pt",
          }}
        >
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "10px",
              color: THEME.textSubtle,
              textTransform: "uppercase",
              fontWeight: 400,
            }}
          >
            Receiver's Sign & Stamp
          </span>
          <DateSlots />
        </div>
      </div>
    </div>
  );
};
