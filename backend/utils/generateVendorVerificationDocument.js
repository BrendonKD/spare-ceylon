const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const escapeHtml = (value) => {
  if (value === null || value === undefined) return "-";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const formatDateTime = (date) => {
  try {
    return new Date(date).toLocaleString("en-LK", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (error) {
    return new Date().toLocaleString();
  }
};

const generateVendorVerificationDocument = async (vendor) => {
  let browser;

  try {
    const outputDir = path.join(__dirname, "../uploads/vendor-documents");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const sealPath = path.join(__dirname, "seal.png");

    if (!fs.existsSync(sealPath)) {
      throw new Error("Verified seal image not found at utils/seal.png");
    }

    const sealBase64 = fs.readFileSync(sealPath).toString("base64");
    const sealDataUri = `data:image/png;base64,${sealBase64}`;

    const fileName = `vendor-verification-${vendor._id}.pdf`;
    const finalPath = path.join(outputDir, fileName);
    const tempPath = path.join(outputDir, `temp-${vendor._id}.pdf`);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Vendor Verification Document</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: Arial, sans-serif;
            padding: 34px;
            color: #222;
            line-height: 1.45;
            background: #ffffff;
          }

          .page {
            position: relative;
            min-height: 100%;
          }

          .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 18px;
          }

          .brand-block {
            flex: 1;
          }

          .brand-title {
            font-size: 24px;
            font-weight: 700;
            color: #0E544F;
            margin: 0 0 6px;
          }

          .brand-subtitle {
            margin: 0;
            color: #555;
            font-size: 14px;
            max-width: 480px;
          }

          .seal-container {
            width: 130px;
            flex-shrink: 0;
          }

          .seal-container img {
            width: 100%;
            height: auto;
            display: block;
          }

          .verified-badge {
            display: inline-block;
            margin-top: 10px;
            padding: 7px 14px;
            background: #ddf4ee;
            color: #0E544F;
            border-radius: 999px;
            font-weight: 700;
            font-size: 13px;
          }

          .section-title {
            font-size: 17px;
            margin: 24px 0 10px;
            color: #0E544F;
            font-weight: 700;
            border-bottom: 1px solid #ddd;
            padding-bottom: 6px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }

          td {
            border: 1px solid #ddd;
            padding: 10px;
            vertical-align: top;
            font-size: 14px;
            word-break: break-word;
          }

          td.label {
            width: 32%;
            font-weight: 700;
            background: #f7f7f7;
          }

          .note {
            margin-top: 24px;
            font-size: 13px;
            color: #444;
          }

          .warning {
            margin-top: 16px;
            color: #9b1c1c;
            font-size: 13px;
            font-weight: 700;
          }

          .footer {
            margin-top: 28px;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e4e4e4;
            padding-top: 12px;
          }

          .muted {
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="top-bar">
            <div class="brand-block">
              <h1 class="brand-title">Vendor Verification Certificate</h1>
              <p class="brand-subtitle">
                This document confirms that the vendor details below were reviewed and approved by the Spare Ceylon admin team.
              </p>
              <div class="verified-badge">Verified Vendor Document</div>
            </div>

            <div class="seal-container">
              <img src="${sealDataUri}" alt="Verified Seal" />
            </div>
          </div>

          <div class="section-title">Business Information</div>
          <table>
            <tr>
              <td class="label">Company name</td>
              <td>${escapeHtml(vendor.business_name)}</td>
            </tr>
            <tr>
              <td class="label">Business registration number</td>
              <td>${escapeHtml(vendor.business_reg_no)}</td>
            </tr>
            <tr>
              <td class="label">Address</td>
              <td>${escapeHtml(vendor.address)}</td>
            </tr>
            <tr>
              <td class="label">Description</td>
              <td>${escapeHtml(vendor.description || "-")}</td>
            </tr>
            <tr>
              <td class="label">Verification status</td>
              <td>${escapeHtml(vendor.verification_status || "verified")}</td>
            </tr>
            <tr>
              <td class="label">Verified on</td>
              <td>${escapeHtml(formatDateTime(new Date()))}</td>
            </tr>
          </table>

          <div class="section-title">Owner Information</div>
          <table>
            <tr>
              <td class="label">Owner full name</td>
              <td>${escapeHtml(vendor.vendor_id?.full_name)}</td>
            </tr>
            <tr>
              <td class="label">Owner email</td>
              <td>${escapeHtml(vendor.vendor_id?.email)}</td>
            </tr>
            <tr>
              <td class="label">Phone</td>
              <td>${escapeHtml(vendor.vendor_id?.phone)}</td>
            </tr>
          </table>

          <p class="note">
            This verification document is generated by the Spare Ceylon admin system after manual review and approval of the submitted vendor information and supporting documents.
          </p>

          <p class="warning">
            This document is for administrative verification purposes and should be considered valid only while the vendor remains approved in the system.
          </p>

          <div class="footer">
            Generated by Spare Ceylon Admin Verification System
            <span class="muted">| File: ${escapeHtml(fileName)}</span>
          </div>
        </div>
      </body>
      </html>
    `;

    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 1240,
      height: 1754,
      deviceScaleFactor: 1,
    });

    await page.setContent(html, { waitUntil: "networkidle0" });

    await page.pdf({
      path: tempPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    await browser.close();
    browser = null;

    if (fs.existsSync(finalPath)) {
      fs.unlinkSync(finalPath);
    }

    fs.renameSync(tempPath, finalPath);

    return `/uploads/vendor-documents/${fileName}`;
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Failed to close Puppeteer browser:", closeError.message);
      }
    }

    console.error("Vendor verification document generation error:", error);
    throw new Error(`Document generation failed: ${error.message}`);
  }
};

module.exports = generateVendorVerificationDocument;