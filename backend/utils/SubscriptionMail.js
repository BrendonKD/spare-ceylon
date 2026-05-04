const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-LK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const sendSubscriptionActivatedEmail = async ({
    to,
    vendorName,
    planName,
    billingCycle,
    startDate,
    endDate,
    amount,
    currency = 'LKR',
}) => {
    const subject = `Your ${planName} subscription is now active`;

    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2 style="color: #0E544F;">Subscription Activated</h2>
      <p>Hello ${vendorName || 'Vendor'},</p>
      <p>Your vendor subscription has been activated successfully.</p>

      <table style="border-collapse: collapse; margin-top: 12px;">
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Plan</strong></td>
          <td style="padding: 8px 12px; border: 1px solid #ddd;">${planName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Billing Cycle</strong></td>
          <td style="padding: 8px 12px; border: 1px solid #ddd;">${billingCycle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Start Date</strong></td>
          <td style="padding: 8px 12px; border: 1px solid #ddd;">${formatDate(startDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>End Date</strong></td>
          <td style="padding: 8px 12px; border: 1px solid #ddd;">${formatDate(endDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Amount Paid</strong></td>
          <td style="padding: 8px 12px; border: 1px solid #ddd;">${currency} ${Number(amount || 0).toLocaleString()}</td>
        </tr>
      </table>

      <p style="margin-top: 16px;">
        You can now use the benefits included in your ${planName} plan on Spare Ceylon.
      </p>

      <p>Thank you,<br/>Spare Ceylon</p>
    </div>
  `;

    const text = `
Hello ${vendorName || 'Vendor'},

Your vendor subscription has been activated successfully.

Plan: ${planName}
Billing Cycle: ${billingCycle}
Start Date: ${formatDate(startDate)}
End Date: ${formatDate(endDate)}
Amount Paid: ${currency} ${Number(amount || 0).toLocaleString()}

Thank you,
Spare Ceylon
  `;

    return transporter.sendMail({
        from: {
            name: 'Spare Ceylon',
            address: process.env.SMTP_FROM || process.env.SMTP_USER,
        },
        to,
        subject,
        text,
        html,
    });
};

module.exports = {
    sendSubscriptionActivatedEmail,
};