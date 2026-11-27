
import mongoose from 'mongoose';

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
    fitness: {
      type: [
        {
          name: String,
          done: {
            type: Boolean,
            default: false
          }
        }
      ],
      default: []
    },
    namaz: {
      fajr: {
        type: Boolean,
        default: false
      },
      dhuhr: {
        type: Boolean,
        default: false
      },
      asr: {
        type: Boolean,
        default: false
      },
      maghrib: {
        type: Boolean,
        default: false
      },
      isha: {
        type: Boolean,
        default: false
      }
    },
    work: {
      type: [
        {
          title: String,
          target: {
            type: Number,
            default: 1
          },
          completed: {
            type: Number,
            default: 0
          },
          unit: String
        }
      ],
      default: []
    },
    skills: {
      type: [
        {
          title: String,
          target: {
            type: Number,
            default: 1
          },
          completed: {
            type: Number,
            default: 0
          },
          unit: String
        }
      ],
      default: []
    },
    self: {
      type: [
        {
          name: String,
          kind: {
            type: String,
            enum: ['build', 'avoid'],
            default: 'build'
          },
          done: {
            type: Boolean,
            default: false
          }
        }
      ],
      default: []
    },
    reflection: {
      greatJob: String,
      improve: String,
      tomorrow: String
    },
    notes: String
  },
  { timestamps: true }
);

schema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('DailyEntry', schema);
