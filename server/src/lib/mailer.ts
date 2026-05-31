import nodemailer from 'nodemailer';

function createTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[Mailer] SMTP_USER or SMTP_PASS not set');
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

export async function sendOTPEmail(to: string, otp: string) {
  console.log(`[Email OTP → ${to}] Code: ${otp}`);

  if (!transporter) {
    transporter = createTransporter();
  }

  if (!transporter) {
    console.warn('[Mailer] No transporter — OTP logged to console only');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Citizen Services Portal" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Your Verification Code',
      html: `
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
      `,
    });
    console.log(`[Email OTP → ${to}] Delivered`);
  } catch (err: any) {
    console.error(`[Email OTP] FAILED for ${to}:`, err.code, err.message);
    transporter = null;
    throw new Error('Failed to send verification email. Please try again.');
  }
}
