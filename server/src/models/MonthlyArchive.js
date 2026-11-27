
import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    month: {
      type: String,
      required: true
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    closedAt: Date
  },
  { timestamps: true }
);

schema.index({ userId: 1, month: 1 }, { unique: true });

export default mongoose.model('MonthlyArchive', schema);
