const nodemailer = require('nodemailer');

const sendCardPaymentSuccessEmail = async ({ to, amount, currency, orderCount, items }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const currencySymbol = currency.toUpperCase() === 'LKR' ? 'LKR' : '$';

  const mailOptions = {
    from: `"Spare Ceylon Payments" <${process.env.SMTP_USER}>`,
    to: to,
    subject: `Payment Successful - ${currencySymbol} ${amount.toLocaleString()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f766e; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Payment Received!</h1>
        </div>
        <div style="padding: 30px; color: #374151;">
          <p style="font-size: 16px;">Hi there,</p>
          <p style="font-size: 16px; line-height: 1.5;">
            The payment of <strong>${currencySymbol} ${amount.toLocaleString()}</strong> has been successfully processed via Stripe.
          </p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #111827;">Order Summary</h3>
            <p style="margin: 5px 0;"><strong>Status:</strong> Payment Successful</p>
            <p style="margin: 5px 0;"><strong>Method:</strong> Credit/Debit Card (Stripe)</p>
            <p style="margin: 5px 0;"><strong>Packages:</strong> ${orderCount} Vendor Shipment(s)</p>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            Your order is now being processed by our vendors. You can track your items in your customer dashboard.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:3000/customer/orders" 
               style="background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
               View My Orders
            </a>
          </div>
        </div>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
          &copy; 2026 Spare Ceylon. All rights reserved.
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendCardPaymentSuccessEmail };