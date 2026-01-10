import mongoose from 'mongoose';

const issuedItemSchema = new mongoose.Schema({
  itemRef: { type: mongoose.Schema.Types.ObjectId, required: true },
  itemType: { type: String, enum: ['weapon', 'ammunition', 'equipment'], required: true },
  itemSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  quantity: { type: Number, required: true },
  returnedQuantity: { type: Number, default: 0 },
  conditionAtIssue: { type: String, required: true },
  conditionAtReturn: String
});

const distributionSchema = new mongoose.Schema(
  {
    distributionNo: { type: String, required: true, unique: true },
    armory: { type: mongoose.Schema.Types.ObjectId, ref: 'Armory', required: true },
    officer: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer', required: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    squadName: { type: String, required: true },
    dateIssued: { type: Date, required: true, default: Date.now },
    renewalDue: { type: Date, required: true },
    renewalStatus: { 
      type: String, 
      enum: ['pending', 'due', 'overdue', 'renewed'],
      default: 'pending'
    },
    weaponsIssued: [issuedItemSchema],
    ammunitionIssued: [issuedItemSchema],
    equipmentIssued: [issuedItemSchema],
    remarks: String,
    status: { 
      type: String, 
      enum: ['issued', 'partial_return', 'returned', 'cancelled'],
      default: 'issued'
    },
    returnDate: Date,
    returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    renewalHistory: [{
      renewedAt: { type: Date, required: true },
      renewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      nextRenewalDate: { type: Date, required: true },
      condition: { type: String, required: true },
      remarks: String
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default mongoose.models.Distribution || mongoose.model('Distribution', distributionSchema);