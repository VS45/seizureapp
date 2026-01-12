const mongoose = require('mongoose');
const { Schema } = mongoose;

// Schema for weapon items
const weaponSchema = new Schema({
  weaponType: { type: String, required: true }, // AK-47, G3, Pistol, etc.
  serialNumber: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true, default: 1 },
  /* availableQuantity: { type: Number, required: true, default: 1 }, */
  condition: { 
    type: String, 
    required: true,
    enum: ['serviceable', 'unserviceable', 'under_maintenance', 'missing'],
    default: 'serviceable'
  },
  manufacturer: { type: String },
  acquisitionDate: { type: Date },
  lastMaintenance: { type: Date },
  nextMaintenance: { type: Date },
  notes: { type: String }
});

// Schema for ammunition
const ammunitionSchema = new Schema({
  caliber: { type: String, required: true },
  type: { type: String, required: true }, // FMJ, HP, Tracer, etc.
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'rounds' },
  lotNumber: { type: String },
  manufactureDate: { type: Date },
  expiryDate: { type: Date }
});

// Schema for protective equipment
const equipmentSchema = new Schema({
  itemType: { type: String, required: true }, // Bullet Proof Jacket, Helmet, etc.
  size: { type: String },
  quantity: { type: Number, required: true },
  condition: { 
    type: String, 
    enum: ['serviceable', 'unserviceable', 'under_maintenance'],
    default: 'serviceable'
  },
  serialNumber: { type: String },
  certificationDate: { type: Date },
  expiryDate: { type: Date }
});

// Schema for comment/operation log entries
const commentSchema = new Schema({
  text: { type: String, required: true },
  category: { type: String, required: true }, // maintenance, inventory, transfer, etc.
  updatedBy: { type: String, required: true },
  updatedById: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now }
});

const armorySchema = new Schema({
  // Reference Information
  referenceID: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  armoryName: { type: String, required: true },
  armoryCode: { type: String, required: true },
  location: { type: String, required: true },
  unit: { type: String, required: true },

  // Inventory Details
  weapons: [weaponSchema],
  ammunition: [ammunitionSchema],
  equipment: [equipmentSchema],
  otherItems: [{
    itemName: { type: String, required: true },
    category: { type: String, required: true }, // tear_gas, magazines, etc.
    quantity: { type: Number, required: true },
    unit: { type: String },
    condition: { type: String },
    notes: { type: String }
  }],

  // Status and Tracking
  status: { 
    type: String, 
    enum: ['active', 'under_audit', 'closed', 'maintenance'],
    default: 'active'
  },
  lastAuditDate: { type: Date },
  nextAuditDate: { type: Date },

  // Handover/Takeover Information
  currentCustodian: {
    serviceNo: { type: String, required: true },
    rank: { type: String, required: true },
    name: { type: String, required: true },
    takeoverDate: { type: Date, required: true, default: Date.now }
  },
  handoverHistory: [{
    serviceNo: { type: String, required: true },
    rank: { type: String, required: true },
    name: { type: String, required: true },
    action: { type: String, enum: ['handing_over', 'taking_over'], required: true },
    date: { type: Date, required: true, default: Date.now },
    signature: { type: String }
  }],

  // Created By
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: {
    type: String,
    required: true
  },

  // Documents
  documents: [{
    url: { type: String, required: true },
    filename: { type: String },
    category: { type: String }, // audit_report, maintenance_log, etc.
    size: { type: Number }
  }],

  // Comments/Operation logs
  comments: [commentSchema],

  // Security
  securityLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'maximum'],
    default: 'medium'
  },
  accessCodes: [{
    code: { type: String },
    assignedTo: { type: String },
    validUntil: { type: Date }
  }]

}, { 
  timestamps: true
});

// Virtual for total weapon count
armorySchema.virtual('totalWeapons').get(function() {
  return this.weapons.reduce((total, weapon) => total + weapon.quantity, 0);
});

// Virtual for serviceable weapons count
armorySchema.virtual('serviceableWeapons').get(function() {
  return this.weapons.filter(w => w.condition === 'serviceable')
    .reduce((total, weapon) => total + weapon.quantity, 0);
});

// Virtual for total ammunition count
armorySchema.virtual('totalAmmunition').get(function() {
  return this.ammunition.reduce((total, ammo) => total + ammo.quantity, 0);
});

export default mongoose.models.Armory || mongoose.model('Armory', armorySchema);