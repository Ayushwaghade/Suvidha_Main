import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  seekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true }, // e.g., "Need full house painting"
  description: { type: String, required: true },
  category: { type: String, required: true }, // e.g., "Painting", "Plumbing"
  budget: { type: Number }, // Optional: "I want to spend around ₹5000"
  
  // So providers can find jobs near them!
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  
  status: { 
    type: String, 
    enum: ['open', 'assigned', 'completed', 'cancelled'], 
    default: 'open' 
  }
}, { timestamps: true });

// Mandatory for $near queries!
jobSchema.index({ location: '2dsphere' });

export default mongoose.model('Job', jobSchema);