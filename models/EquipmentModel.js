const mongoose = require('mongoose');

const equipmentModelSchema = new mongoose.Schema({
  itemType: {
    type: String,
    required: true
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
const EquipmentModel = mongoose.models.EquipmentModel || mongoose.model('EquipmentModel', equipmentModelSchema);

export default EquipmentModel;