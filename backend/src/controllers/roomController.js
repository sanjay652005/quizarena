const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const {
  createRoom,
  joinRoom,
  getRoomByCode,
  getHostRooms,
  getRoomResults,
} = require('../services/roomService');

/**
 * POST /api/rooms
 * Host creates a new room.
 * Body: { topic, maxPlayers?, questionDurationSec? }
 */
const create = catchAsync(async (req, res) => {
  const { topic, maxPlayers, questionDurationSec } = req.body;
  const room = await createRoom({
    topic,
    maxPlayers,
    questionDurationSec,
    host: req.user,
  });

  res.status(201).json({
    status: 'success',
    message: 'Room created.',
    data: { room },
  });
});

/**
 * POST /api/rooms/join
 * Player joins a waiting room.
 * Body: { code }
 */
const join = catchAsync(async (req, res) => {
  const { code } = req.body;
  if (!code) throw new AppError('Room code is required.', 400);

  const room = await joinRoom({ code, user: req.user });

  res.status(200).json({
    status: 'success',
    message: 'Joined room successfully.',
    data: { room },
  });
});

/**
 * GET /api/rooms/:code
 * Fetch room details by code. (Public — used on the join screen)
 */
const getByCode = catchAsync(async (req, res) => {
  const room = await getRoomByCode(req.params.code);
  res.status(200).json({
    status: 'success',
    data: { room },
  });
});

/**
 * GET /api/rooms/my/hosted
 * Returns rooms created by the authenticated host.
 */
const myRooms = catchAsync(async (req, res) => {
  const rooms = await getHostRooms(req.user._id);
  res.status(200).json({
    status: 'success',
    results: rooms.length,
    data: { rooms },
  });
});

/**
 * GET /api/rooms/:id/results
 * Returns final leaderboard + answers for a completed room.
 */
const results = catchAsync(async (req, res) => {
  const data = await getRoomResults(req.params.id);
  res.status(200).json({
    status: 'success',
    data,
  });
});

module.exports = { create, join, getByCode, myRooms, results };
