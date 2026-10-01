import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function generatePdf() {
  const url = process.argv[2] || "http://localhost:3001/voucher";
  const outputPath = process.argv[3] || path.join(process.cwd(), "gowtami-realty-pv-1-to-9.pdf");

  console.log(`Connecting to ${url}...`);
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  
  // Wait for fonts to be ready
  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  await page.emulateMedia({ media: "print" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "0mm",
      right: "0mm",
      bottom: "0mm",
      left: "0mm",
    },
  });

  fs.writeFileSync(outputPath, pdf);
  await browser.close();
  console.log(`PDF saved successfully to ${outputPath}`);
}

generatePdf().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
