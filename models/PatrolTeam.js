import mongoose from 'mongoose';

const patrolTeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Officer' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);



export default mongoose.models.PatrolTeam || mongoose.model('PatrolTeam', patrolTeamSchema);