const mongoose = require('mongoose');

const ammunitionModelSchema = new mongoose.Schema({
  caliber: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['FMJ', 'HP', 'Tracer', 'AP', 'Frangible', 'Other']
  },
  manufacturer: {
    type: String,
    required: true
  },
  description: {
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

const AmmunitionModel = mongoose.models.AmmunitionModel || mongoose.model('AmmunitionModel', ammunitionModelSchema);

export default AmmunitionModel;