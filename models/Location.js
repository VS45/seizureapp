import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.models.Location || mongoose.model('Location', locationSchema);