import mongoose from 'mongoose';

const weaponModelSchema = new mongoose.Schema({
  weaponType: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  manufacturer: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
// Check if model already exists before creating
const WeaponModel = mongoose.models.WeaponModel || mongoose.model('WeaponModel', weaponModelSchema);

export default WeaponModel;