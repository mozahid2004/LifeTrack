
import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['fitness', 'namaz', 'work', 'skills', 'self'],
      required: true
    },
    startTime: String,
    endTime: String,
    notes: String,
    metricTarget: {
      type: Number,
      min: 0
    },
    unit: String,
    completed: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    date: {
      type: String,
      required: true
    },
    items: [itemSchema],
    reflection: String
  },
  { timestamps: true }
);

schema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('DailyPlan', schema);
