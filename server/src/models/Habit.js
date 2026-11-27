
import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    category: {
      type: String,
      enum: ['namaz', 'fitness', 'self'],
      required: true
    },
    habitType: {
      type: String,
      enum: ['build', 'avoid'],
      default: 'build'
    },
    active: {
      type: Boolean,
      default: true
    },
    archivedAt: {
      type: Date,
      default: null
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

schema.index({ userId: 1, category: 1, title: 1 });

export default mongoose.model('Habit', schema);
