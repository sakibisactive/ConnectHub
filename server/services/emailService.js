const nodemailer = require('nodemailer');

// Configure SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || ''
  }
});

const sendOtpEmail = async (toEmail, otpCode) => {
  const mailOptions = {
    from: `"ConnectHub Security" <${process.env.SMTP_USER || 'no-reply@connecthub.com'}>`,
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
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Real OTP email sent to ${toEmail}`);
    } else {
      console.log(`ℹ️ [Email Dispatch Simulated for ${toEmail}] Verification OTP Code: ${otpCode}`);
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
