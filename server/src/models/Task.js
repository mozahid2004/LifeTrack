
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
      required: true
    },
    category: {
      type: String,
      enum: ['fitness', 'work', 'skills', 'self'],
      required: true
    },
    kind: {
      type: String,
      enum: ['yesno', 'metric'],
      default: 'yesno'
    },
    habitType: {
      type: String,
      enum: ['build', 'avoid'],
      default: 'build'
    },
    target: {
      type: Number,
      default: 1
    },
    unit: String,
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Task', schema);
