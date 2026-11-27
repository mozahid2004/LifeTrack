
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
      maxlength: 160
    },
    category: {
      type: String,
      enum: ['work', 'skills', 'personal'],
      default: 'personal'
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    dueTime: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: '',
      maxlength: 1000
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    },
    archivedAt: {
      type: Date,
      default: null
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  { timestamps: true }
);

schema.index({ userId: 1, date: 1, createdAt: 1 });

export default mongoose.model('DailyTask', schema);
