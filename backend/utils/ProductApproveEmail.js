const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

const sendMail = async ({ to, subject, html, text }) => {
  return transporter.sendMail({
    from: `Spare Ceylon <${fromAddress}>`,
    to,
    subject,
    text,
    html
  });
};

const sendProductRequestApprovedEmail = async ({
  to,
  vendorName,
  productName,
  adminNotes
}) => {
  const safeVendorName = vendorName || "Vendor";
  const safeProductName = productName || "Requested Product";
  const safeAdminNotes = adminNotes?.trim() || "No additional note provided.";

  const subject = `Your product request was approved - ${safeProductName}`;

  const text = `
Hello ${safeVendorName},

Your product request for "${safeProductName}" has been approved by Spare Ceylon.

Your pending listing can now be reviewed in your vendor dashboard. If the listing is in "Ready to Activate" state, please activate it manually.

Admin note: ${safeAdminNotes}

Regards,
Spare Ceylon
  `.trim();

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #111827; max-width: 640px; margin: 0 auto;">
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
        <h2 style="margin: 0 0 16px; color: #0f766e;">Product Request Approved</h2>

        <p>Hello ${safeVendorName},</p>

        <p>
          Your product request for <strong>${safeProductName}</strong> has been approved by Spare Ceylon.
        </p>

        <p>
          Your pending listing can now be reviewed in your vendor dashboard.
          If the listing shows <strong>Ready to Activate</strong>, please activate it manually.
        </p>

        <div style="margin: 16px 0; padding: 12px 14px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <strong>Admin note:</strong><br />
          ${safeAdminNotes}
        </div>

        <p style="margin-top: 24px;">
          Regards,<br />
          <strong>Spare Ceylon</strong>
        </p>
      </div>
    </div>
  `;

  return sendMail({ to, subject, text, html });
};

const sendProductRequestRejectedEmail = async ({
  to,
  vendorName,
  productName,
  adminNotes
}) => {
  const safeVendorName = vendorName || "Vendor";
  const safeProductName = productName || "Requested Product";
  const safeAdminNotes = adminNotes?.trim() || "No additional note provided.";

  const subject = `Your product request was rejected - ${safeProductName}`;

  const text = `
Hello ${safeVendorName},

Your product request for "${safeProductName}" was rejected by Spare Ceylon.

Reason / admin note: ${safeAdminNotes}

You may review the request details and submit a corrected request again.

Regards,
Spare Ceylon
  `.trim();

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #111827; max-width: 640px; margin: 0 auto;">
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
        <h2 style="margin: 0 0 16px; color: #b91c1c;">Product Request Rejected</h2>

        <p>Hello ${safeVendorName},</p>

        <p>
          Your product request for <strong>${safeProductName}</strong> was rejected by Spare Ceylon.
        </p>

        <div style="margin: 16px 0; padding: 12px 14px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
          <strong>Reason / admin note:</strong><br />
          ${safeAdminNotes}
        </div>

        <p>
          You may review the request details and submit a corrected request again.
        </p>

        <p style="margin-top: 24px;">
          Regards,<br />
          <strong>Spare Ceylon</strong>
        </p>
      </div>
    </div>
  `;

  return sendMail({ to, subject, text, html });
};

module.exports = {
  sendProductRequestApprovedEmail,
  sendProductRequestRejectedEmail
};