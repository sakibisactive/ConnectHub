const nodemailer = require('nodemailer');

let testTransporter = null;

const getTransporter = async () => {
  const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const emailHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.SMTP_PORT || '587', 10);

  // 1. If real SMTP / Email credentials exist in .env, use them to deliver to ANY user's personal inbox
  if (emailUser && emailPass) {
    return nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
  }

  // 2. Fallback to automated real Ethereal SMTP account if no credentials set yet
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
      console.log(`✉️ Test SMTP Mailer active (${testAccount.user})`);
    } catch (e) {
      console.error('Failed to create test email transport:', e.message);
    }
  }
  return testTransporter;
};

const sendOtpEmail = async (toEmail, otpCode) => {
  const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const senderEmail = emailUser || 'security@connecthub.com';

  const mailOptions = {
    from: `"ConnectHub Verification" <${senderEmail}>`,
    to: toEmail, // Dynamically sends to ANY user's personal email address
    subject: `🔐 Your ConnectHub Verification Code: ${otpCode}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background-color: #0f172a; border-radius: 16px; color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #3b82f6; margin: 0; font-size: 28px; font-weight: 800;">ConnectHub</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Security & Account Verification</p>
        </div>

        <div style="background-color: #1e293b; padding: 24px; border-radius: 12px; text-align: center; border: 1px solid #334155;">
          <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 16px;">
            Hello! You are registering a new ConnectHub account with <strong>${toEmail}</strong>.
          </p>
          <p style="font-size: 13px; color: #94a3b8; margin-bottom: 12px;">Your 6-digit OTP verification code is:</p>
          
          <div style="font-size: 36px; font-weight: bold; font-family: monospace; letter-spacing: 8px; color: #fbbf24; background-color: #0f172a; padding: 16px 28px; border-radius: 10px; display: inline-block; border: 1px solid #3b82f6;">
            ${otpCode}
          </div>

          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
            This code expires in <strong>5 minutes</strong>. If you did not request this, please ignore this email.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #64748b;">
          ConnectHub Real-Time Messaging Application • End-to-End Encrypted Auth
        </div>
      </div>
    `
  };

  try {
    const transporter = await getTransporter();
    if (!transporter) return false;

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification OTP sent to recipient: [ ${toEmail} ]`);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📩 Web Mail Inbox Preview URL for ${toEmail}: ${previewUrl}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to deliver OTP email to ${toEmail}:`, error.message);
    return false;
  }
};

module.exports = {
  sendOtpEmail
};
