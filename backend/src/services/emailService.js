import { mailer } from '../config/mailer.js';
import { env } from '../config/env.js';

const FROM_ADDRESS = `"MedMate" <${env.GMAIL_USER}>`;

export const sendVerificationEmail = async (toEmail, userName, code) => {
  await mailer.sendMail({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: 'MedMate — Your verification code',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #7C3AED;">Verify your MedMate account</h2>
        <p>Hello ${userName},</p>
        <p>Use the code below to verify your email address. It expires in 15 minutes.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#7C3AED;
          background:#EDE9FE;padding:24px;border-radius:12px;text-align:center;margin:24px 0;">
          ${code}
        </div>
        <p style="color:#6B7280;font-size:14px;">
          If you did not create a MedMate account, you can safely ignore this email.
        </p>
      </div>`,
  });
};

export const sendPasswordResetEmail = async (toEmail, userName, code) => {
  await mailer.sendMail({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: 'MedMate — Your password reset code',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #7C3AED;">Reset your MedMate password</h2>
        <p>Hello ${userName},</p>
        <p>Use the code below to reset your password. It expires in 1 hour.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#7C3AED;
          background:#EDE9FE;padding:24px;border-radius:12px;text-align:center;margin:24px 0;">
          ${code}
        </div>
        <p style="color:#6B7280;font-size:14px;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>`,
  });
};

export const sendMissedDoseAlertEmail = async (
  toEmail,
  caregiverName,
  patientName,
  medicationName,
  missedReason,
  consecutiveCount
) => {
  const reasonLabel = {
    forgot: 'forgot to take it',
    feeling_sick: 'was feeling sick',
    no_pills: 'ran out of pills',
    no_response: 'did not respond to reminders',
  }[missedReason] || 'did not respond';

  await mailer.sendMail({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: `⚠️ MedMate — ${patientName} has missed ${consecutiveCount} doses in a row`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;">
        <h2 style="color:#9F1239;">Missed Dose Alert</h2>
        <p>Hello ${caregiverName},</p>
        <p>
          Your patient <strong>${patientName}</strong> has missed
          <strong>${consecutiveCount} consecutive doses</strong> of
          <strong>${medicationName}</strong>.
        </p>
        <p>The most recent reason given: <em>${reasonLabel}</em>.</p>
        <p>Please follow up with them as soon as possible.</p>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
        <p style="color:#6B7280;font-size:13px;">
          You are receiving this because you are a registered caregiver for this patient
          on MedMate. Open the app for the full history.
        </p>
      </div>`,
  });
};