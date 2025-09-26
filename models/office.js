import mongoose from 'mongoose';

const officeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
  },
}, {
  timestamps: true
});



export default mongoose.models.Office || mongoose.model('Office', officeSchema);