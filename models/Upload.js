import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  seizure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seizure',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.models.Upload || mongoose.model('Upload', uploadSchema);