import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

export async function sendOTPEmail(to: string, otp: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email OTP → ${to}] Code: ${otp} (SMTP not configured)`);
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
    await transporter.sendMail({
      from: `"Citizen Services Portal" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Your Verification Code',
      html,
    });
    console.log(`[Email OTP → ${to}] Sent successfully`);
  } catch (err: any) {
    console.error(`[Email OTP → ${to}] Failed:`, err.message);
    throw new Error('Failed to send verification email. Please try again.');
  }
}
