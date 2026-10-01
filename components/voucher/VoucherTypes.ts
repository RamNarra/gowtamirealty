// ============================================================
// Goutami Infrastructure LLP — Payment Voucher Types
// ============================================================

export type PaymentMode = "cash" | "cheque" | "dd" | "rtgs" | "neft" | "bank";

export interface VoucherData {
  pvNumber: string;
  date: string;
  paidTo: string;
  paymentMode: PaymentMode | null;
  transactionNumber: string; // By Cash / Cheque No.
  paymentDate: string;        // Dated
  amountWords: string;
  amount: string;
  particulars: string;
  preparedBy: string;
  approvedBy: string;
  receivedBy: string;
}

// Position + size of a draggable element — in mm units (the source of truth for print)
export interface ElementLayout {
  id: string;
  x: number;   // mm from voucher left edge
  y: number;   // mm from voucher top edge
  w: number;   // mm width
  h: number;   // mm height
}

// The canonical set of draggable element IDs in every voucher
export type ElementId =
  | "logo"
  | "companyBlock"
  | "titleBlock"
  | "headerDivider"
  | "pvNumberBlock"
  | "dateBlock"
  | "paidToRow"
  | "paymentModeRow"
  | "byCashChequeRow"
  | "amountWordsRow"
  | "particularsRow"
  | "amountRow"
  | "signaturesRow"
  | "receivedByBlock";

export type LayoutMap = Record<ElementId, ElementLayout>;

// Exact Physical Dimensions (mm)
// A4 Portrait: 210mm × 297mm
// 3-Up: 1 col × 3 rows => 210mm × 99mm per voucher
export const VOUCHER_W_MM = 210;
export const VOUCHER_H_MM = 99;
export const SHEET_W_MM = 210;
export const SHEET_H_MM = 297;

// px-per-mm conversion for the editor preview (96dpi screen)
export const PX_PER_MM = 3.7795275591;

export function mmToPx(mm: number): number {
  return mm * PX_PER_MM;
}

export function pxToMm(px: number): number {
  return px / PX_PER_MM;
}

// Default canonical layout — 210mm × 99mm Portrait 3-Up
// Generous writing heights (7.0 - 7.2mm) with comfortable vertical clearance for pen writing
export const DEFAULT_LAYOUT: LayoutMap = {
  logo: { id: "logo", x: 6, y: 3.2, w: 15, h: 13 },
  companyBlock: { id: "companyBlock", x: 23, y: 3.2, w: 124, h: 13.5 },
  titleBlock: { id: "titleBlock", x: 149, y: 3.2, w: 55, h: 13.5 },
  headerDivider: { id: "headerDivider", x: 6, y: 17.5, w: 198, h: 0.5 },
  pvNumberBlock: { id: "pvNumberBlock", x: 6, y: 19.0, w: 65, h: 5.8 },
  dateBlock: { id: "dateBlock", x: 154, y: 19.0, w: 50, h: 5.8 },
  paidToRow: { id: "paidToRow", x: 6, y: 25.8, w: 198, h: 7.0 },
  paymentModeRow: { id: "paymentModeRow", x: 6, y: 33.6, w: 198, h: 6.2 },
  byCashChequeRow: { id: "byCashChequeRow", x: 6, y: 40.6, w: 198, h: 7.2 },
  amountWordsRow: { id: "amountWordsRow", x: 6, y: 48.6, w: 198, h: 7.2 },
  particularsRow: { id: "particularsRow", x: 6, y: 56.6, w: 198, h: 7.2 },
  amountRow: { id: "amountRow", x: 6, y: 64.6, w: 131, h: 8.8 },
  signaturesRow: { id: "signaturesRow", x: 6, y: 74.2, w: 131, h: 21.8 },
  receivedByBlock: { id: "receivedByBlock", x: 139, y: 64.6, w: 65, h: 31.4 },
};

export const ELEMENT_LABELS: Record<ElementId, string> = {
  logo: "Logo",
  companyBlock: "Company Identity",
  titleBlock: "Payment Voucher Title",
  headerDivider: "Header Divider",
  pvNumberBlock: "PV Number (Serial)",
  dateBlock: "Date Field",
  paidToRow: "Paid To",
  paymentModeRow: "Payment Mode",
  byCashChequeRow: "By Cash/Cheque No. & Dated",
  amountWordsRow: "Amount in Words",
  particularsRow: "Purpose / Particulars",
  amountRow: "Amount (₹)",
  signaturesRow: "Prepared & Approved By",
  receivedByBlock: "Received By (Tall Box)",
};

export const STORAGE_KEY_LAYOUT = "gowtami-realty-pv-layout-v1";
export const STORAGE_KEY_DATA = "gowtami-realty-pv-data-v1";
export const STORAGE_KEY_SERIAL = "gowtami-realty-pv-serial-v1";

export const BLANK_DATA: VoucherData = {
  pvNumber: "",
  date: "",
  paidTo: "",
  paymentMode: null,
  transactionNumber: "",
  paymentDate: "",
  amountWords: "",
  amount: "",
  particulars: "",
  preparedBy: "",
  approvedBy: "",
  receivedBy: "",
};

// Sequential 6-digit serial formatter: GI - 000001
export function formatPvSerial(num: number): string {
  const safeNum = Math.max(1, Math.floor(num));
  return String(safeNum).padStart(6, "0");
}

export function getNextPvBatch(startNum: number): string[] {
  return [0, 1, 2].map((i) => formatPvSerial(startNum + i));
}
