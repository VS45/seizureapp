import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    validate: {
      validator: function(v) {
        // Only run validator if password is NEW or being MODIFIED
        return !this.isModified('password') || 
               /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(v);
      },
      message: props => 'Password must contain at least 8 characters, one uppercase letter, one number, and one special character'
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  serviceNo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  rank: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  office: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Office',
    required: true
  },
  role: {
    type: String,
    enum: ['creator', 'validator', 'analyst', 'admin','legal','valuation','dcenforcement','dcrevenue'],
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  verificationTokenExpires: {
    type: Date
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for office name (optional)
userSchema.virtual('officeName').get(function() {
  return this.office?.name;
});

// Virtual for office code (optional)
userSchema.virtual('officeCode').get(function() {
  return this.office?.code;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last activity
userSchema.methods.updateActivity = function() {
  this.lastActivity = Date.now();
  return this.save();
};

export default mongoose.models.User || mongoose.model('User', userSchema);