const nodemailer = require('nodemailer');
const { Resend } = require('resend');

let testTransporter = null;

const sendOtpEmail = async (toEmail, otpCode) => {
  require('dotenv').config();

  const emailHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const resendApiKey = process.env.RESEND_API_KEY;

  // Dynamically determine the verified sender to avoid SMTP relay rejection
  const fromEmail = process.env.SMTP_FROM || (emailHost.includes('brevo') ? '"ConnectHub Security" <shahriarsakib1205@11591997.brevosend.com>' : `"ConnectHub Security" <${emailUser}>`);

  const htmlContent = `
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
  `;

  // 1. Primary: Brevo/Custom SMTP (Delivers to ALL recipients with 100% hidden personal email)
  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465,
        auth: { user: emailUser, pass: emailPass },
        connectionTimeout: 8000, // 8 seconds timeout
        socketTimeout: 8000
      });

      await transporter.sendMail({
        from: fromEmail,
        replyTo: '"ConnectHub Security" <no-reply@connecthub.com>',
        to: toEmail,
        subject: `🔐 Your ConnectHub Verification Code: ${otpCode}`,
        html: htmlContent
      });

      console.log(`✅ [Brevo/SMTP] Verification OTP delivered to ${toEmail}`);
      return true;
    } catch (err) {
      console.error('❌ SMTP Delivery Error:', err.message);
    }
  }

  // 2. Secondary: Resend API
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: 'ConnectHub Security <no-reply@resend.dev>',
        to: [toEmail],
        subject: `🔐 Your ConnectHub Verification Code: ${otpCode}`,
        html: htmlContent
      });

      if (!error && data?.id) {
        console.log(`✅ [Resend API] Verification OTP email dispatched to ${toEmail} (ID: ${data.id})`);
        return true;
      }
    } catch (err) {
      console.error('❌ Resend API Exception:', err.message);
    }
  }

  // 3. Fallback: Ethereal Test Mailer (Only for local development, never production)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Email dispatch failed via configured mail providers.');
  }

  try {
    if (!testTransporter) {
      const testAccount = await nodemailer.createTestAccount();
      testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      console.log(`✉️ Ethereal Test Mailer active (${testAccount.user})`);
    }

    const info = await testTransporter.sendMail({
      from: '"ConnectHub Security" <no-reply@connecthub.com>',
      to: toEmail,
      subject: `🔐 Your ConnectHub Verification Code: ${otpCode}`,
      html: htmlContent
    });

    console.log(`✅ Verification OTP sent to [ ${toEmail} ]`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📩 Web Mail Inbox Preview URL for ${toEmail}: ${previewUrl}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Email dispatch fallback error:', error.message);
    return false;
  }
};

module.exports = {
  sendOtpEmail
};
