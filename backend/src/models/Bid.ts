import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true },
  amount: { type: Number, required: true }, // The provider's quoted price
  proposal: { type: String, required: true }, // "I can do this tomorrow, I have my own tools..."
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  },
  phone: { type: String },
}, { timestamps: true });

export default mongoose.model('Bid', bidSchema);