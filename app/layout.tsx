import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import "../styles/document.css";
import "../styles/print.css";

export const viewport: Viewport = {
  themeColor: "#0B0B10",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Gowtami Realty LLP | Payment Voucher",
  description: "Official Payment Voucher Generation & Management for Gowtami Realty LLP.",
  icons: {
    icon: "/goutami-logo.svg",
    shortcut: "/goutami-logo.svg",
    apple: "/goutami-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0b0f19] text-[#0f172a] m-0 p-0 antialiased">
        {children}
      </body>
    </html>
  );
}
