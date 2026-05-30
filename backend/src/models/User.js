const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['host', 'player'],
      default: 'player',
    },
    avatar: {
      type: String,
      default: null,
    },
    stats: {
      totalGamesPlayed: { type: Number, default: 0 },
      totalWins:        { type: Number, default: 0 },
      totalScore:       { type: Number, default: 0 },
      averageScore:     { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method: verify password
userSchema.methods.correctPassword = async function (candidate, hashed) {
  return bcrypt.compare(candidate, hashed);
};

// Instance method: update aggregate stats
userSchema.methods.updateStats = async function (score, isWin) {
  this.stats.totalGamesPlayed += 1;
  this.stats.totalScore       += score;
  if (isWin) this.stats.totalWins += 1;
  this.stats.averageScore = Math.round(
    this.stats.totalScore / this.stats.totalGamesPlayed
  );
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
