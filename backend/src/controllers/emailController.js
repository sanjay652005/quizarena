const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Room = require('../models/Room');
const { sendRoomInvite } = require('../services/emailService');

/**
 * POST /api/email/invite
 * Host sends an email invite for their room.
 * Body: { email, roomCode }
 */
const sendInvite = catchAsync(async (req, res) => {
  const { email, roomCode } = req.body;

  // ── Verify room exists and caller is the host ──────────────────────────
  const room = await Room.findOne({ code: roomCode.toUpperCase() });
  if (!room) throw new AppError('Room not found.', 404);
  if (room.host.toString() !== req.user._id.toString()) {
    throw new AppError('Only the room host can send invites.', 403);
  }
  if (room.status !== 'waiting') {
    throw new AppError('Invites can only be sent while the room is in waiting status.', 400);
  }

  await sendRoomInvite(email, room.code, req.user.username, room.topic);

  res.status(200).json({
    status: 'success',
    message: `Invite sent to ${email}.`,
  });
});

module.exports = { sendInvite };
