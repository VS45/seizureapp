import mongoose from 'mongoose';

const officerSchema = new mongoose.Schema(
  {
    serviceNo: { type: String, required: true, unique: true },
    rank: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office', required: true },
    patrolTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'PatrolTeam', required: true },
    status: { 
      type: String, 
      required: true, 
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

// officerSchema.index({ serviceNo: 1 });
// officerSchema.index({ patrolTeam: 1 });
// officerSchema.index({ office: 1 });
// officerSchema.index({ status: 1 });

export default mongoose.models.Officer || mongoose.model('Officer', officerSchema);