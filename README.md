# Gowtami Realty — Corporate Payment Voucher System

A precision-engineered, print-calibrated Next.js web application for generating, customizing, and printing official **Gowtami Realty** payment vouchers (3-up per A4 portrait page).

## Features

- **Strict A4 Paged Media Layout**: 3 payment vouchers per page (each precisely 210mm × 98.66mm) with zero margin drift, zero page overflows, and zero cutoffs.
- **Sequential Serial Auto-Numbering**: Automatic `GR - 000001` through `GR - 000009` multi-page batch generation (configurable start serial).
- **Interactive Move & Place Engine**: Visual canvas editor allowing live drag-and-drop repositioning and nudging of voucher fields.
- **Enterprise Print Styles**: Dedicated isolated `@media print` DOM structure completely detached from screen controls.
- **High-Definition Vector Branding**: Gowtami Realty vector emblem, crisp typography, clean outline title blocks, and signature stamps.

## Tech Stack

- **Framework**: Next.js 16 (Turbopack, App Router)
- **UI & Styling**: React 19, Tailwind CSS v4, Lucide Icons
- **Headless PDF Engine**: Playwright Chromium automation

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate batch PDF (PV 1 to 9)
npm run generate:pdf
```

## Routes

- `/` — Voucher Designer & Multi-Sheet Optimizer
- `/voucher` — Dedicated Voucher Route
