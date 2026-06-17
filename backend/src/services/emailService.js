const nodemailer = require('nodemailer');

// Set up email transporter
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    const config = {
      host,
      port: parseInt(port),
      secure: port === '465' || port === 465, // true for 465, false for other ports
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false // avoids SSL handshake errors in some environments
      },
      connectionTimeout: 5000, // 5 seconds connection timeout
      greetingTimeout: 5000,   // 5 seconds greeting timeout
      timeout: 5000            // 5 seconds socket timeout
    };

    if (host.toLowerCase().includes('gmail')) {
      config.service = 'gmail';
    }

    return nodemailer.createTransport(config);
  }

  // Fallback / mock transporter if credentials are missing
  return null;
};

exports.sendOtpEmail = async (email, otp) => {
  const emailHtml = `
    <div style="font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; background-color: #111111; color: #FFFFFF; padding: 40px 20px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #FFC107;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: 2px; text-transform: uppercase;">
          TREK<span style="color: #FFC107;">NEST</span>
        </span>
      </div>
      <div style="background-color: #1A1A1A; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
        <h2 style="font-size: 20px; text-transform: uppercase; color: #FFC107; margin-top: 0;">Verify Your Email</h2>
        <p style="font-size: 13px; color: #8E8E8E; margin-bottom: 25px;">Please use the following 6-digit verification code to complete your verification.</p>
        
        <div style="font-size: 32px; font-weight: 800; color: #FFC107; background-color: #111111; padding: 15px; border-radius: 8px; border: 1px dashed #FFC107; letter-spacing: 6px; display: inline-block; margin-bottom: 25px;">
          ${otp}
        </div>
        
        <p style="font-size: 11px; color: #777777; margin: 0;">This OTP will expire in 5 minutes. Do not share this code with anyone.</p>
      </div>
      <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #777777;">
        &copy; ${new Date().getFullYear()} TrekNest Platform. Secure SSL Verified.
      </div>
    </div>
  `;

  // 1. Try Gmail REST API if configured (bypasses Render Free Tier port block, sends from Gmail account)
  if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GMAIL_CLIENT_ID,
          client_secret: process.env.GMAIL_CLIENT_SECRET,
          refresh_token: process.env.GMAIL_REFRESH_TOKEN,
          grant_type: 'refresh_token'
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || tokenData.error || 'Failed to refresh Google OAuth token');
      }

      const accessToken = tokenData.access_token;
      const fromEmail = process.env.SMTP_USER || 'treknest.support@gmail.com';

      // Construct RFC 2822 email format
      const rawMessage = [
        `From: "TrekNest Support" <${fromEmail}>`,
        `To: ${email}`,
        `Subject: ${otp} is your TrekNest Verification Code`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        emailHtml
      ].join('\r\n');

      // Encode using base64url format
      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedMessage
        })
      });

      const sendData = await sendResponse.json();
      if (sendResponse.ok) {
        console.log(`[Gmail API] Verification email successfully sent to ${email} (ID: ${sendData.id})`);
        return true;
      } else {
        console.error('[Gmail API] Send message failed:', sendData.error?.message || sendData);
      }
    } catch (err) {
      console.error('[Gmail API] Failed to send email via HTTP API:', err.message);
    }
  }

  // 2. Try Resend HTTP API if configured (bypasses Render Free Tier port block)
  if (process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'TrekNest <onboarding@resend.dev>';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: `${otp} is your TrekNest Verification Code`,
          html: emailHtml
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[Resend] Verification email successfully sent to ${email} (ID: ${data.id})`);
        return true;
      } else {
        console.error('[Resend] API returned an error:', data.message || data);
      }
    } catch (err) {
      console.error('[Resend] Failed to send email via HTTP API:', err.message);
    }
  }

  // 2. Fallback to standard SMTP
  const transporter = createTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"TrekNest Support" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `${otp} is your TrekNest Verification Code`,
        html: emailHtml
      });
      console.log(`[SMTP] Verification email sent to ${email}`);
      return true;
    } catch (err) {
      console.error('[SMTP] Failed to send verification email:', err.message);
      if (err.code === 'ETIMEOUT' || err.message.toLowerCase().includes('timeout')) {
        console.error('\n[Render SMTP Block Warning]');
        console.error('SMTP connection timed out. If you are hosting on Render\'s Free Tier, standard SMTP ports (25, 465, 587) are blocked.');
        console.error('To resolve this, please sign up for a free account at Resend.com and configure RESEND_API_KEY in your Render environment variables.\n');
      }
      return false;
    }
  } else {
    console.log(`\n=============================================================`);
    console.log(`[TrekNest OTP] Verification code for ${email}: ${otp}`);
    console.log(`[Warning] Email credentials not fully set. Falling back to Developer Mock Mode.`);
    console.log(`=============================================================\n`);
    return true; // Return true to allow developer mock flow to succeed
  }
};
