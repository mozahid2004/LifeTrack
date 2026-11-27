
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    trackingMigratedAt: {
      type: Date,
      default: null
    },
    leaderboardOptIn: {
      type: Boolean,
      default: false
    },
    reminder: {
      enabled: {
        type: Boolean,
        default: false
      },
      time: {
        type: String,
        default: '21:00'
      },
      days: {
        type: [Number],
        default: [0, 1, 2, 3, 4, 5, 6]
      }
    },
    preferences: {
      theme: {
        type: String,
        enum: ['hybrid', 'dark', 'light'],
        default: 'hybrid'
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
