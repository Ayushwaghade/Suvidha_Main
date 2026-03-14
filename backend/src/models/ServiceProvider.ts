import mongoose from 'mongoose';

const serviceProviderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  city: { type: String, required: true }, // Keep as fallback/display
  
  // ✅ NEW: GeoJSON Location Field
  location: {
    type: {
      type: String,
      enum: ['Point'], 
      default: 'Point'
    },
    coordinates: {
      type: [Number], // IMPORTANT: MongoDB expects [longitude, latitude]
      required: true,
      default: [0,0]
    }
  },

  offeredServices: [{
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true }
  }],
  bio: { type: String },
  experience: { type: Number },
  availability: [{ type: String }],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

// ✅ NEW: This index is MANDATORY for $near queries to work
serviceProviderSchema.index({ location: '2dsphere' });

export default mongoose.model('ServiceProvider', serviceProviderSchema);