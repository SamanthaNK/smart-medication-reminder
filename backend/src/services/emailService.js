import { mailer } from '../config/mailer.js';
import { env } from '../config/env.js';

const FROM_ADDRESS = `"MedMate" <${env.GMAIL_USER}>`;

export const sendVerificationEmail = async (toEmail, userName, verificationToken) => {
    const verificationLink = `http://localhost:${env.PORT}/v1/auth/verify-email?token=${verificationToken}`;

    await mailer.sendMail({
        from: FROM_ADDRESS,
        to: toEmail,
        subject: 'MedMate — Verify your email address',
        html: `
      <p>Hello ${userName},</p>
      <p>Thank you for registering with MedMate.</p>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationLink}">${verificationLink}</a>
      <p>This link does not expire.</p>
    `,
    });
};

export const sendPasswordResetEmail = async (toEmail, userName, resetToken) => {
    const resetLink = `http://localhost:${env.PORT}/v1/auth/reset-password?token=${resetToken}`;

    await mailer.sendMail({
        from: FROM_ADDRESS,
        to: toEmail,
        subject: 'MedMate — Reset your password',
        html: `
      <p>Hello ${userName},</p>
      <p>We received a request to reset your MedMate password.</p>
      <p>Click the link below to set a new password (valid for 1 hour):</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
    });
};