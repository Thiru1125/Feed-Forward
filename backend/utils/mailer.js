require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection (IMPORTANT)
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email server error:", error);
  } else {
    console.log("✅ Email server is ready");
  }
});

function sendEmail(to, subject, html) {
  return transporter.sendMail({
    from: `"FeedForward" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  })
  .then(() => console.log(`📧 Email sent to ${to}`))
  .catch(err => console.error("❌ Email failed:", err));
}

module.exports = sendEmail;
