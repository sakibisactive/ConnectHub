const nodemailer = require('nodemailer');

let testAccountCreated = false;
let testTransporter = null;

const getTransporter = async () => {
  // If user provided custom SMTP details in .env, use them
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Otherwise, automatically create a REAL Ethereal SMTP test account for instant internet mail dispatches
  if (!testTransporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`✉️ Automated Real SMTP Account created (${testAccount.user})`);
    } catch (e) {
      console.error('Failed to create test email transport:', e.message);
    }
  }
  return testTransporter;
};

const sendOtpEmail = async (toEmail, otpCode) => {
  const mailOptions = {
    from: `"ConnectHub Security" <${process.env.SMTP_USER || 'security@connecthub.com'}>`,
    to: toEmail,
    subject: `🔐 ConnectHub Verification Code: ${otpCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #0f172a; border-radius: 16px; color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #3b82f6; margin: 0; font-size: 28px;">ConnectHub</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Security Verification Code</p>
        </div>
        <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #334155;">
          <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 12px;">Your 6-digit email OTP verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 6px; color: #fbbf24; background-color: #0f172a; padding: 12px 24px; border-radius: 8px; display: inline-block;">
            ${otpCode}
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">This code expires in 5 minutes. Do not share this code with anyone.</p>
        </div>
      </div>
    `
  };

  try {
    const transporter = await getTransporter();
    if (!transporter) return false;

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email dispatched to ${toEmail} (Message ID: ${info.messageId})`);

    // If using test account, log preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📩 View Real Sent Email Inbox Preview: ${previewUrl}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error.message);
    return false;
  }
};

module.exports = {
  sendOtpEmail
};
