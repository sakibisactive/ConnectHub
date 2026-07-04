const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const https = require('https');

let testTransporter = null;

const sendViaBrevoApi = (apiKey, fromEmail, toEmail, subject, htmlContent) => {
  return new Promise((resolve, reject) => {
    // Extract clean email address from fromEmail string (e.g. "Name <email>" -> "email")
    let cleanSenderEmail = fromEmail;
    if (fromEmail.includes('<')) {
      cleanSenderEmail = fromEmail.split('<')[1].replace('>', '').trim();
    }

    const data = JSON.stringify({
      sender: {
        name: "ConnectHub Security",
        email: cleanSenderEmail
      },
      to: [{ email: toEmail }],
      subject: subject,
      htmlContent: htmlContent
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(data)
      }
    };

    let finished = false;

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (finished) return;
        finished = true;
        clearTimeout(hardTimeout);

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          reject(new Error(`Status ${res.statusCode}: ${body}`));
        }
      });
    });

    // Hard timeout wrapper to catch DNS, TCP connect, SSL, and greeting phase hangs
    const hardTimeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      req.destroy();
      reject(new Error('Request timed out during connection/DNS phase (6s)'));
    }, 6000);

    req.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(hardTimeout);
      reject(err);
    });

    req.write(data);
    req.end();
  });
};

const sendOtpEmail = async (toEmail, otpCode) => {
  require('dotenv').config();

  const emailHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const resendApiKey = process.env.RESEND_API_KEY;

  // Dynamically determine the verified sender to avoid SMTP relay rejection
  const fromEmail = process.env.SMTP_FROM || (emailHost.includes('brevo') ? '"ConnectHub Security" <shahriarsakib1205@11591997.brevosend.com>' : `"ConnectHub Security" <${emailUser}>`);
  const subject = `🔐 Your ConnectHub Verification Code: ${otpCode}`;

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

  // 1. Primary HTTP API Dispatch for Brevo (Do NOT fall back to SMTP if it fails, as credentials are the same and SMTP is blocked)
  if (emailHost.includes('brevo') && emailPass) {
    try {
      console.log(`📡 Attempting Brevo HTTP API dispatch for ${toEmail}...`);
      await sendViaBrevoApi(emailPass, fromEmail, toEmail, subject, htmlContent);
      console.log(`✅ [Brevo/HTTP-API] Verification OTP delivered to ${toEmail}`);
      return true;
    } catch (err) {
      console.error('❌ Brevo HTTP API failed:', err.message);
      throw new Error(`Brevo HTTP API Delivery Failed: ${err.message}`);
    }
  }

  // 2. Generic SMTP (Only used if host is not Brevo)
  if (emailUser && emailPass) {
    try {
      console.log(`📡 Connecting to SMTP host ${emailHost}...`);
      const transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465,
        auth: { user: emailUser, pass: emailPass },
        connectionTimeout: 5000,
        socketTimeout: 5000
      });

      await transporter.sendMail({
        from: fromEmail,
        replyTo: '"ConnectHub Security" <no-reply@connecthub.com>',
        to: toEmail,
        subject: subject,
        html: htmlContent
      });

      console.log(`✅ [SMTP] Verification OTP delivered to ${toEmail}`);
      return true;
    } catch (err) {
      console.error('❌ SMTP Delivery Error:', err.message);
    }
  }

  // 3. Resend API Fallback
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: 'ConnectHub Security <no-reply@resend.dev>',
        to: [toEmail],
        subject: subject,
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

  // 4. Fallback: Ethereal Test Mailer (Only for local development, never production)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Email dispatch failed via all configured mail providers.');
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
      subject: subject,
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
