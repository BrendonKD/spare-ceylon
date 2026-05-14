const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    logger: true,
    debug: true,
});

const verifyMailer = async () => {
    try {
        await transporter.verify();
        console.log('SMTP server is ready to send emails');
    } catch (err) {
        console.error('SMTP verification failed:', err);
    }
};

const sendOrderStatusEmail = async ({
    to,
    customerName,
    orderId,
    productTitle,
    status,
    total,
}) => {
    const statusConfig = {
        pending: {
            subject: `Order #${orderId} is pending review`,
            heading: 'Your order is pending review',
            message:
                'Thank you for your order. The vendor has received it and will review it shortly.',
            color: '#f59e0b',
        },
        confirmed: {
            subject: `Order #${orderId} has been confirmed`,
            heading: 'Your order has been confirmed',
            message:
                'Great news — the vendor has confirmed your order and is preparing it for the next step.',
            color: '#0f7b65',
        },
        shipped: {
            subject: `Order #${orderId} has been shipped`,
            heading: 'Your order is on the way',
            message:
                'Your order has been shipped. Please check your account for the latest delivery progress.',
            color: '#2563eb',
        },
        delivered: {
            subject: `Order #${orderId} has been delivered`,
            heading: 'Your order has been delivered',
            message:
                'Your order has been marked as delivered. We hope everything arrived safely and as expected.',
            color: '#16a34a',
        },
        cancelled: {
            subject: `Order #${orderId} has been cancelled`,
            heading: 'Your order has been cancelled',
            message:
                'Your order has been cancelled & refunded. If you have any questions, please contact our support team.',
            color: '#dc2626',
        },
    };

    const current = statusConfig[status] || {
        subject: `Update on your order #${orderId}`,
        heading: 'Your order status has been updated',
        message: `Your order status is now ${status}.`,
        color: '#0f7b65',
    };

    const orderUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/customer/orders`;

    const text = `
Hello ${customerName || 'Customer'},

${current.message}

Order Summary
-------------
Order ID: ${orderId}
Product: ${productTitle}
Current Status: ${status}
Order Total: Rs. ${Number(total).toLocaleString()}

You can view your orders here:
${orderUrl}

Thank you for choosing Spare Ceylon.
  `;

    const html = `
  <div style="margin:0;padding:0;background:#f4f7f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
        <div style="background:${current.color};padding:24px 28px;color:#ffffff;">
          <div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;opacity:0.9;">
            Spare Ceylon - 
          </div>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;">
            ${current.heading}
          </h1>
        </div>

        <div style="padding:28px;">
          <p style="margin:0 0 14px;font-size:15px;">Hello ${customerName || 'Customer'},</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#4b5563;">
            ${current.message}
          </p>

          <div style="border:1px solid #e5e7eb;border-radius:14px;padding:18px;background:#f9fafb;margin-bottom:22px;">
            <h2 style="margin:0 0 14px;font-size:16px;color:#111827;">Order Summary</h2>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Order ID</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${orderId}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Product</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${productTitle}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Current Status</td>
                <td style="padding:8px 0;text-align:right;">
                  <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${current.color}15;color:${current.color};font-size:13px;font-weight:700;text-transform:capitalize;">
                    ${status}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Order Total</td>
                <td style="padding:8px 0;color:#111827;font-size:15px;font-weight:700;text-align:right;">
                  Rs. ${Number(total).toLocaleString()}
                </td>
              </tr>
            </table>
          </div>

          <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#6b7280;">
            If you need help, you can contact the Spare Ceylon support team.
          </p>

          <p style="margin:0;font-size:14px;color:#111827;">
            Thank you,<br />
            <strong>Spare Ceylon</strong>
          </p>
        </div>
      </div>

      <p style="text-align:center;font-size:12px;color:#94a3b8;margin:16px 0 0;">
        This is an automated transactional email regarding your order.
      </p>
    </div>
  </div>
  `;

    return transporter.sendMail({
        from: `"Spare Ceylon Orders" <${process.env.SMTP_FROM}>`,
        to,
        subject: current.subject,
        text,
        html,
    });
};

module.exports = {
    transporter,
    verifyMailer,
    sendOrderStatusEmail,
};