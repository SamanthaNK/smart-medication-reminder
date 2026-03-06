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
        <div style="
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 12px;
          color: #7C3AED;
          background: #EDE9FE;
          padding: 24px;
          border-radius: 12px;
          text-align: center;
          margin: 24px 0;
        ">${code}</div>
        <p style="color: #6B7280; font-size: 14px;">
          If you did not create a MedMate account, you can safely ignore this email.
        </p>
      </div>
    `,
    });
};

// Sends a 6-digit password reset code.
// The code expires in 1 hour.
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
        <div style="
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 12px;
          color: #7C3AED;
          background: #EDE9FE;
          padding: 24px;
          border-radius: 12px;
          text-align: center;
          margin: 24px 0;
        ">${code}</div>
        <p style="color: #6B7280; font-size: 14px;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
    });
};