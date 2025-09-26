import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
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
warehouseSchema.index({ user: 1, name: 1 }, { unique: true });

export default mongoose.models.Warehouse || mongoose.model('Warehouse', warehouseSchema);