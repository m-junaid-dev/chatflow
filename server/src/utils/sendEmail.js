'use strict';

const transporter = require('../config/mail');

/**
 * Send a branded OTP email for ChatFlow.
 *
 * @param {string} email   - Recipient email address.
 * @param {string} name    - Recipient display name.
 * @param {string} otp     - Plain-text 6-digit OTP.
 * @param {'verify'|'reset'} purpose - Why the OTP is being sent.
 */
async function sendOtpEmail(email, name, otp, purpose) {
  const purposeLabel =
    purpose === 'reset' ? 'Password Reset' : 'Email Verification';
  const purposeInstruction =
    purpose === 'reset'
      ? 'Use the code below to reset your ChatFlow password.'
      : 'Use the code below to verify your ChatFlow account.';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>ChatFlow OTP</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #f0f4f8; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 36px 32px 28px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 1px; }
    .header p { color: #ccfbf1; font-size: 14px; margin-top: 6px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 17px; color: #1e293b; margin-bottom: 12px; }
    .instruction { font-size: 15px; color: #475569; margin-bottom: 28px; line-height: 1.6; }
    .otp-box { background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px; }
    .otp-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
    .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #0f766e; font-family: 'Courier New', monospace; }
    .expiry { font-size: 13px; color: #ef4444; margin-top: 10px; }
    .warning { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 6px; padding: 12px 16px; font-size: 13px; color: #9a3412; margin-bottom: 24px; line-height: 1.5; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
    .footer a { color: #0d9488; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>💬 ChatFlow</h1>
      <p>${purposeLabel}</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${name},</p>
      <p class="instruction">${purposeInstruction}</p>
      <div class="otp-box">
        <p class="otp-label">Your OTP Code</p>
        <p class="otp-code">${otp}</p>
        <p class="expiry">⏱ Expires in 5 minutes</p>
      </div>
      <div class="warning">
        🔒 <strong>Never share this code.</strong> ChatFlow staff will never ask for your OTP. If you did not request this, please ignore this email.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ChatFlow. All rights reserved.<br/>
      This is an automated message — please do not reply.
    </div>
  </div>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: `"ChatFlow" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your ChatFlow OTP Code',
    html,
  });
}

module.exports = { sendOtpEmail };
