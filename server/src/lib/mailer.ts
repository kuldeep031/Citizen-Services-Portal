const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = process.env.SMTP_USER || 'noreply@citizenportal.gov.in';
const SENDER_NAME = 'Citizen Services Portal';

export async function sendOTPEmail(to: string, otp: string) {
  console.log(`[Email OTP → ${to}] Code: ${otp}`);

  if (!BREVO_API_KEY) {
    console.warn('[Mailer] BREVO_API_KEY not set — OTP logged to console only');
    return;
  }

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1e293b; margin-bottom: 8px;">Email Verification</h2>
      <p style="color: #64748b; font-size: 14px;">Your one-time verification code is:</p>
      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 11px;">Citizen Services Portal</p>
    </div>
  `;

  try {
    const res = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to }],
        subject: 'Your Verification Code',
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error(`[Email OTP] FAILED for ${to}:`, res.status, data);
      throw new Error('Email delivery failed');
    }

    console.log(`[Email OTP → ${to}] Delivered via Brevo`);
  } catch (err: any) {
    console.error(`[Email OTP] Error for ${to}:`, err.message);
    throw new Error('Failed to send verification email. Please try again.');
  }
}

export async function sendWelcomeOfficerEmail(to: string, name: string, tempPassword: string) {
  console.log(`[Welcome Email → ${to}] Temp password: ${tempPassword}`);

  if (!BREVO_API_KEY) {
    console.warn('[Mailer] BREVO_API_KEY not set — welcome email logged to console only');
    return;
  }

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1e293b; margin-bottom: 8px;">Welcome to Citizen Services Portal</h2>
      <p style="color: #475569; font-size: 14px;">Hello ${name},</p>
      <p style="color: #475569; font-size: 14px;">Your officer account has been created. Use the credentials below to log in:</p>
      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${to}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
      </div>
      <p style="color: #dc2626; font-size: 14px; font-weight: 600;">Please change your password immediately upon first login.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 11px;">Citizen Services Portal</p>
    </div>
  `;

  try {
    const res = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to }],
        subject: 'Your Officer Account — Change Password Immediately',
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error(`[Welcome Email] FAILED for ${to}:`, res.status, data);
    } else {
      console.log(`[Welcome Email → ${to}] Delivered via Brevo`);
    }
  } catch (err: any) {
    console.error(`[Welcome Email] Error for ${to}:`, err.message);
  }
}
