
import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: String,
    message: String,
    type: {
      type: String,
      default: 'reminder'
    },
    read: {
      type: Boolean,
      default: false
    },
    scheduledFor: Date
  },
  { timestamps: true }
);

export default mongoose.model('Notification', schema);
