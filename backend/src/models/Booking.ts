import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  seekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true },
  date: { type: Date },
  service: { type: String, required: true },
  notes: { type: String },
  price: { type: Number },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  isReviewed: { type: Boolean, default: false },
  
  // --- NEW FIELDS FOR ONLINE & PAYMENTS ---
  serviceMode: { type: String, enum: ['in-person', 'online'], default: 'in-person' },
  meetingLink: { type: String }, 
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  transactionId: { type: String }, 
  address: { type: String }, 
  phone: { type: String, required: true }, 
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);