const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

// ── Create transporter (reused across calls) ─────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_PORT === '465', // true for SSL, false for TLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Sends a room invite email to the specified address.
 *
 * @param {string} toEmail      - Recipient email address
 * @param {string} roomCode     - 6-char room code
 * @param {string} hostUsername - Name of the host
 * @param {string} topic        - Quiz topic
 */
const sendRoomInvite = async (toEmail, roomCode, hostUsername, topic) => {
  const joinUrl = `${process.env.CLIENT_URL}/join?code=${roomCode}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f0f; color: #ffffff; margin: 0; padding: 0; }
          .container { max-width: 520px; margin: 40px auto; background: #1a1a1a; border-radius: 16px; overflow: hidden; }
          .header { background: #FFD600; padding: 32px; text-align: center; }
          .header h1 { color: #0f0f0f; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px; }
          .body { padding: 32px; }
          .body p { color: #cccccc; line-height: 1.6; margin: 0 0 16px; }
          .code-box { background: #0f0f0f; border: 2px solid #FFD600; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
          .code { font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #FFD600; font-family: monospace; }
          .code-label { font-size: 12px; color: #888; margin-top: 8px; text-transform: uppercase; letter-spacing: 2px; }
          .btn { display: inline-block; background: #FFD600; color: #0f0f0f; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin-top: 8px; }
          .footer { padding: 20px 32px; border-top: 1px solid #2a2a2a; text-align: center; }
          .footer p { color: #555; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚡ QuizArena</h1>
          </div>
          <div class="body">
            <p>Hey there! <strong>${hostUsername}</strong> has invited you to join a live quiz on <strong>QuizArena</strong>.</p>
            <p><strong>Topic:</strong> ${topic}</p>
            <div class="code-box">
              <div class="code">${roomCode}</div>
              <div class="code-label">Your Room Code</div>
            </div>
            <p style="text-align:center;">
              <a href="${joinUrl}" class="btn">Join Quiz Now →</a>
            </p>
            <p style="font-size:13px; color:#666;">Or go to <a href="${process.env.CLIENT_URL}" style="color:#FFD600;">${process.env.CLIENT_URL}</a> and enter code <strong>${roomCode}</strong> to join.</p>
          </div>
          <div class="footer">
            <p>QuizArena — Real-time multiplayer quiz battles</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const transporter = createTransporter();

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"QuizArena" <noreply@quizarena.com>',
      to: toEmail,
      subject: `${hostUsername} invited you to a QuizArena battle! 🎯`,
      html: htmlBody,
      text: `${hostUsername} invited you to a quiz about "${topic}" on QuizArena.\n\nRoom Code: ${roomCode}\nJoin here: ${joinUrl}`,
    });

    logger.info(`Invite email sent to ${toEmail} — messageId: ${info.messageId}`);
    return true;
  } catch (err) {
    logger.error(`Failed to send invite email to ${toEmail}: ${err.message}`);
    throw new AppError('Failed to send invite email. Please check the address and try again.', 502);
  }
};

module.exports = { sendRoomInvite };
