const mongoose = require('mongoose');
const { Schema } = mongoose;

const commoditySchema = new Schema({
  goodsType: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  containerNumber: { type: String }, // For container/lorry/bus units
  itemDescription: { type: String } // For container/lorry/bus units
});
const personSchema=new Schema({
  gender: { type: String },
  age: { type: Number },
  nationality: { type: String },
  name:{type:String},
  role:{type:String}
})
// Schema for comment/operation log entries (matches API usage)
const commentSchema = new Schema({
  text: { type: String, required: true },
  role: { type: String, required: true },
  updatedBy: { type: String, required: true },
  updatedById: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now }
}, { _id: false });

const seizureSchema = new Schema({
  // Reference Information
  referenceID: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  office: { type: String, required: true },
  officeCode: { type: String, required: true },
  seizureSerialNo: { type: Number, required: true },
  
  // Case Reference
  countryOfSeizure: { type: String, required: true },
  offenceLocation: { type: String, required: true },
  offenceLocationType: { type: String, required: true },
  offenceDateTime: { type: Date, required: true, default: Date.now },
  offenceDescription: { type: String },
  service: { type: String, required: true },
  direction: { type: String, required: true },
  
  // Operation field (being updated in the API)
  operation: { type: String, default: 'Not set' },
  
  // Commodity Details (applied to all commodities)
  isIPR: { type: Boolean, default: false },
  isCounterfeit: { type: String },
  rightHolder: { type: String },
  concealment: { type: String },
  illicitTrade: [{ type: String }],
  
  // Individual commodities
  commodities: [commoditySchema],
  
  // Medicine and IPR details
  selectedMedicines: [{
    type: { type: String },
    subtypeType: { type: String },
    subtypes: [String]
  }],
  selectedIPRs: [{
    type: { type: String },
    subtypes: [String]
  }],
  
  // Detection
  detectionMethod: { type: String, required: true },
  technicalAid: { type: String },
  checkpoint: { type: String },
  warehouse: { type: String },
  
  // Conveyance
  conveyanceType: { type: String, required: true },
  conveyanceNumber: { type: String, required: true },
  
  // Route - Departure
  departureCountry: { type: String },
  departureState: { type: String },
  departureLocation: { type: String },
  departurePortCode: { type: String },
  departureTin: { type: String },
  departureTransport: { type: String },
  
  // Route - Destination
  destinationCountry: { type: String },
  destinationState: { type: String },
  destinationLocation: { type: String },
  destinationPortCode: { type: String },
  destinationTransport: { type: String },
  destinationTin:{ type: String },
persons:[personSchema],
  status: { type: String, default: 'pending' },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: {
    type: String,
    required: true
  },
  
  // Pictures
  images: [{
    url: { type: String, required: true },
    filename: { type: String },
    size: { type: Number }
  }],

  //Operational Documents
   documents: [{
    url: { type: String, required: true },
    filename: { type: String },
    size: { type: Number }
  }],
  
  // Comments/Operation logs - array of structured comment objects
  comments: [commentSchema],
  
  recommendation: String,
  dpv: { type: Number },
  gazetteNo:{type:String}
}, { timestamps: true });

export default mongoose.models.Seizure || mongoose.model('Seizure', seizureSchema);