const nodemailer = require('nodemailer');

// In-memory OTP Store: email -> { otp, purpose, expiresAt, payload }
const otpCache = new Map();

function buildTransportConfigs() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return [];
  const auth = {
    user: process.env.EMAIL_USER.trim(),
    pass: process.env.EMAIL_PASS.replace(/\s+/g, '')
  };
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';

  if (process.env.SMTP_PORT) {
    const port = parseInt(process.env.SMTP_PORT, 10);
    return [{
      host,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      connectionTimeout: 7000,
      greetingTimeout: 7000,
      socketTimeout: 7000,
      auth
    }];
  }

  // Try SMTPS 465 first, then STARTTLS 587 fallback
  return [
    {
      service: process.env.EMAIL_SERVICE || 'gmail',
      host,
      port: 465,
      secure: true,
      connectionTimeout: 7000,
      greetingTimeout: 7000,
      socketTimeout: 7000,
      auth
    },
    {
      host,
      port: 587,
      secure: false,
      requireTLS: true,
      connectionTimeout: 7000,
      greetingTimeout: 7000,
      socketTimeout: 7000,
      auth
    }
  ];
}

function getEmailStatus() {
  if (process.env.EMAIL_WEBHOOK_URL) return { configured: true, transport: 'https-webhook' };
  if (process.env.BREVO_API_KEY) return { configured: true, transport: 'brevo-https' };
  if (process.env.RESEND_API_KEY) return { configured: true, transport: 'resend-https' };
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) return { configured: true, transport: 'smtp' };
  return { configured: false, transport: 'none' };
}

/**
 * Generate a 6-digit OTP
 */
function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendViaHttpsProviders({ to, subject, html, otp, purpose }) {
  // 1. Custom HTTPS Webhook (e.g. Google Apps Script Web App calling MailApp.sendEmail)
  if (process.env.EMAIL_WEBHOOK_URL) {
    const resp = await fetch(process.env.EMAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        html,
        otp,
        purpose,
        secret: process.env.EMAIL_WEBHOOK_SECRET || ''
      }),
      signal: AbortSignal.timeout(9000)
    });
    if (!resp.ok) {
      throw new Error(`Webhook HTTP ${resp.status}: ${await resp.text()}`);
    }
    return 'https-webhook';
  }

  // 2. Brevo Transactional Email API (HTTPS 443, works on Render Free Tier)
  if (process.env.BREVO_API_KEY) {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER;
    if (!senderEmail) {
      throw new Error('BREVO_SENDER_EMAIL or EMAIL_USER must be set for Brevo');
    }
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY.trim()
      },
      body: JSON.stringify({
        sender: { name: 'CyberShield Security', email: senderEmail.trim() },
        to: [{ email: to }],
        subject,
        htmlContent: html
      }),
      signal: AbortSignal.timeout(9000)
    });
    if (!resp.ok) {
      throw new Error(`Brevo HTTP ${resp.status}: ${await resp.text()}`);
    }
    return 'brevo-https';
  }

  // 3. Resend API (HTTPS 443, works on Render Free Tier)
  if (process.env.RESEND_API_KEY) {
    const fromAddr = process.env.RESEND_FROM || 'CyberShield Security <onboarding@resend.dev>';
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`
      },
      body: JSON.stringify({
        from: fromAddr,
        to: [to],
        subject,
        html
      }),
      signal: AbortSignal.timeout(9000)
    });
    if (!resp.ok) {
      throw new Error(`Resend HTTP ${resp.status}: ${await resp.text()}`);
    }
    return 'resend-https';
  }

  return null;
}

/**
 * Send an OTP via email and cache for 5 minutes.
 * Preserves any existing pending registration/user payload on resend.
 */
async function sendOtp(email, purpose = 'mfa', payload = null) {
  const cleanEmail = email.trim().toLowerCase();
  const otp = generateOtpCode();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  const existing = otpCache.get(cleanEmail);
  const resolvedPayload = payload !== null ? payload : (existing?.payload || {});

  otpCache.set(cleanEmail, {
    otp,
    purpose,
    expiresAt,
    payload: resolvedPayload
  });

  const subjectMap = {
    mfa: 'CyberShield AI - Your Login Verification Code (MFA)',
    register: 'CyberShield AI - Confirm Your Email & Complete Signup',
    reset_password: 'CyberShield AI - Password Reset Code'
  };
  const subject = subjectMap[purpose] || 'Your Verification Code';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0;">CyberShield AI / TrustMatrix</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">National Cybercrime Defense System</p>
      </div>
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <p style="color: #334155; font-size: 14px; margin-bottom: 12px;">Your one-time verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7; padding: 8px; font-family: monospace;">${otp}</div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 10px;">Expires in 5 minutes. Never share this code with anyone.</p>
      </div>
      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
        If you did not request this verification code, please ignore this email or report suspicious activity to <b>1930 Cybercrime Helpline</b>.
      </p>
    </div>
  `;

  let emailSent = false;
  let transportUsed = 'none';
  let errorReason = '';

  console.log(`\n======================================================`);
  console.log(`📨 [OTP Dispatcher] ${purpose.toUpperCase()} Code for: ${cleanEmail}`);
  console.log(`🔑 Verification OTP: ${otp} (Valid for 5 mins)`);

  // 1. Prefer HTTPS Email APIs (required on cloud hosts like Render Free Tier that block SMTP ports)
  try {
    const httpsResult = await sendViaHttpsProviders({
      to: cleanEmail,
      subject,
      html: htmlContent,
      otp,
      purpose
    });
    if (httpsResult) {
      emailSent = true;
      transportUsed = httpsResult;
      console.log(`✅ [Email Dispatcher] Delivered via ${httpsResult} to ${cleanEmail}`);
    }
  } catch (err) {
    errorReason = err.message;
    console.warn(`⚠️ [Email Dispatcher] HTTPS email provider failed: ${err.message}`);
  }

  // 2. Fallback to Nodemailer SMTP (465 SSL -> 587 STARTTLS) when HTTPS provider not used or failed
  if (!emailSent) {
    const smtpConfigs = buildTransportConfigs();
    if (smtpConfigs.length > 0) {
      for (const cfg of smtpConfigs) {
        try {
          const transporter = nodemailer.createTransport(cfg);
          const sendPromise = transporter.sendMail({
            from: `"CyberShield Security" <${process.env.EMAIL_USER}>`,
            to: cleanEmail,
            subject,
            html: htmlContent
          });
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`SMTP timeout on port ${cfg.port}`)), 7500));
          await Promise.race([sendPromise, timeoutPromise]);
          emailSent = true;
          transportUsed = `smtp:${cfg.port}`;
          console.log(`✅ [Email Dispatcher] Real email delivered via SMTP port ${cfg.port} to ${cleanEmail}`);
          break;
        } catch (err) {
          errorReason = err.message;
          console.warn(`⚠️ [Email Dispatcher] SMTP port ${cfg.port} failed: ${err.message}`);
        }
      }
    } else if (!errorReason) {
      errorReason = 'No email provider configured on server (set EMAIL_WEBHOOK_URL, BREVO_API_KEY, RESEND_API_KEY, or EMAIL_USER/EMAIL_PASS).';
      console.log(`ℹ️ [Email Dispatcher] ${errorReason}`);
    }
  }

  console.log(`======================================================\n`);

  // NOTE: Never return OTP to the client in production!
  return {
    success: true,
    email: cleanEmail,
    expiresIn: 300,
    emailSent,
    transport: transportUsed,
    ...(errorReason && !emailSent ? { errorReason } : {})
  };
}

/**
 * Verify submitted OTP
 */
function verifyOtp(email, inputOtp, purpose = null) {
  const cleanEmail = email.trim().toLowerCase();
  const record = otpCache.get(cleanEmail);

  if (!record) {
    return { valid: false, error: 'No verification code was requested for this email' };
  }

  if (Date.now() > record.expiresAt) {
    otpCache.delete(cleanEmail);
    return { valid: false, error: 'Verification code has expired. Please request a new code.' };
  }

  if (purpose && record.purpose !== purpose) {
    return { valid: false, error: 'Invalid verification session.' };
  }

  if (record.otp !== String(inputOtp).trim()) {
    return { valid: false, error: 'Incorrect 6-digit verification code. Please check your email and try again.' };
  }

  // Success: consume the OTP
  otpCache.delete(cleanEmail);
  return { valid: true, payload: record.payload };
}

module.exports = {
  sendOtp,
  verifyOtp,
  getEmailStatus
};
