import mongoose from 'mongoose';

const checkpointSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  office: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Office',
      required: true
    },
}, {
  timestamps: true
});

// Create index for better query performance
checkpointSchema.index({ user: 1, name: 1 }, { unique: true });

export default mongoose.models.Checkpoint || mongoose.model('Checkpoint', checkpointSchema);