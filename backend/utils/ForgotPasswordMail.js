const nodemailer = require("nodemailer");

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  throw new Error("SMTP_USER or SMTP_PASS is missing in backend .env");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendForgotPasswordOtpMail = async ({ to, name, otp }) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Spare Ceylon Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 8px;">Password Reset Request</h2>
        <p>Hello ${name || "User"},</p>
        <p>We received a request to reset your Spare Ceylon account password.</p>
        <p>Your OTP code is:</p>
        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 6px;
          color: #0f766e;
          margin: 16px 0;
        ">
          ${otp}
        </div>
        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
        <p>If you did not request this password reset, you can safely ignore this email.</p>
        <br />
        <p>Spare Ceylon Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendForgotPasswordOtpMail;