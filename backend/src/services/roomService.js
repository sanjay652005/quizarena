const Room = require('../models/Room');
const PlayerSession = require('../models/PlayerSession');
const AppError = require('../utils/AppError');
const { generateRoomCode } = require('../utils/helpers');

/**
 * Creates a new Room doc.
 * The host is auto-added to the players list.
 */
const createRoom = async ({ topic, maxPlayers, questionDurationSec, host }) => {
  // Generate a unique code — retry on (very unlikely) collision
  let code;
  let attempts = 0;
  do {
    code = generateRoomCode();
    attempts++;
    if (attempts > 10) throw new AppError('Failed to generate unique room code.', 500);
  } while (await Room.exists({ code }));

  const room = await Room.create({
    code,
    host: host._id,
    hostUsername: host.username,
    topic,
    maxPlayers: maxPlayers || 50,
    questionDurationSec: questionDurationSec || 15,
    players: [
      {
        userId: host._id,
        username: host.username,
        avatar: host.avatar,
        score: 0,
      },
    ],
  });

  return room;
};

/**
 * Adds a player to an existing waiting room.
 * Returns the updated room.
 */
const joinRoom = async ({ code, user }) => {
  const room = await Room.findOne({ code: code.toUpperCase() });
  if (!room) throw new AppError('Room not found. Check the code and try again.', 404);
  if (room.status !== 'waiting') {
    throw new AppError('This room is no longer accepting players.', 400);
  }
  if (room.players.length >= room.maxPlayers) {
    throw new AppError('This room is full.', 400);
  }

  // Prevent duplicate join
  const alreadyIn = room.players.some(
    (p) => p.userId.toString() === user._id.toString()
  );
  if (alreadyIn) return room; // Idempotent — just return the room

  room.players.push({
    userId: user._id,
    username: user.username,
    avatar: user.avatar,
    score: 0,
  });
  await room.save();

  return room;
};

/**
 * Returns a populated room by its code (safe for client consumption).
 */
const getRoomByCode = async (code) => {
  const room = await Room.findOne({ code: code.toUpperCase() }).populate(
    'questions'
  );
  if (!room) throw new AppError('Room not found.', 404);
  return room;
};

/**
 * Returns all rooms hosted by a user.
 */
const getHostRooms = async (hostId) => {
  return Room.find({ host: hostId }).sort({ createdAt: -1 }).limit(20);
};

/**
 * Returns final session results for a completed room.
 */
const getRoomResults = async (roomId) => {
  const room = await Room.findById(roomId).populate('questions');
  if (!room) throw new AppError('Room not found.', 404);

  const sessions = await PlayerSession.find({ roomId }).sort({ totalScore: -1 });

  return {
    room: {
      code: room.code,
      topic: room.topic,
      status: room.status,
      startedAt: room.startedAt,
      endedAt: room.endedAt,
      questionCount: room.questions.length,
    },
    leaderboard: sessions.map((s, i) => ({
      rank: i + 1,
      userId: s.userId,
      username: s.username,
      totalScore: s.totalScore,
      answers: s.answers,
    })),
  };
};

module.exports = { createRoom, joinRoom, getRoomByCode, getHostRooms, getRoomResults };
