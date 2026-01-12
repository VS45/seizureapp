// models/ResetToken.js
import mongoose from 'mongoose';

const ResetTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '1h' } // Auto-delete after 1 hour
  },
  verified: {
    type: Boolean,
    default: false
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for faster queries
ResetTokenSchema.index({ email: 1, token: 1 });
ResetTokenSchema.index({ userId: 1, used: 1 });

export default mongoose.models.ResetToken || mongoose.model('ResetToken', ResetTokenSchema);