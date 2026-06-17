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
      }
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
  const transporter = createTransporter();

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
      return false;
    }
  } else {
    console.log(`\n=============================================================`);
    console.log(`[TrekNest OTP] Verification code for ${email}: ${otp}`);
    console.log(`[Warning] SMTP credentials not set. Email not sent.`);
    console.log(`=============================================================\n`);
    return true;
  }
};
