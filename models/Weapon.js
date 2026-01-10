// models/Weapon.js
import mongoose from 'mongoose';

const weaponSchema = new mongoose.Schema({
  weaponType: {
    type: String,
    required: [true, 'Weapon type is required'],
    trim: true,
    unique: true,
    uppercase: true,
    index: true
  },
  manufacturer: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    trim: true,
    enum: ['Assault Rifle', 'Battle Rifle', 'Pistol', 'Shotgun', 'Sniper Rifle', 
           'Machine Gun', 'Submachine Gun', 'Carbine', 'Other'],
    default: 'Assault Rifle'
  },
  caliber: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Pre-save middleware
weaponSchema.pre('save', function(next) {
  // Ensure weapon type is uppercase
  if (this.weaponType) {
    this.weaponType = this.weaponType.toUpperCase().trim();
  }
  
  // Trim all string fields
  for (const [key, value] of Object.entries(this.toObject())) {
    if (typeof value === 'string') {
      this[key] = value.trim();
    }
  }
  
  next();
});

const Weapon = mongoose.models.Weapon || mongoose.model('Weapon', weaponSchema);
export default Weapon;