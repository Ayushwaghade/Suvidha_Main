import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User';
import ServiceProvider from './models/ServiceProvider';

// Load env variables to get the MongoDB URI
dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('MongoDB Connected for Seeding...');

    // 1. Clear existing data (Optional: comment out if you want to keep existing data)
    await User.deleteMany();
    await ServiceProvider.deleteMany();
    console.log('Cleared existing Users and Providers.');

    // 2. Hash a common password for all mock users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 3. Create Users (2 Seekers, 3 Providers)
    const users = await User.insertMany([
      { name: 'Rahul Sharma', email: 'rahul.seeker@test.com', password: hashedPassword, role: 'seeker', city: 'Amravati' },
      { name: 'Sneha Patil', email: 'sneha.seeker@test.com', password: hashedPassword, role: 'seeker', city: 'Amravati' },
      { name: 'Amit Verma', email: 'amit.plumber@test.com', password: hashedPassword, role: 'provider', city: 'Amravati' },
      { name: 'Priya Deshmukh', email: 'priya.tutor@test.com', password: hashedPassword, role: 'provider', city: 'Amravati' },
      { name: 'Rajesh Kumar', email: 'rajesh.electric@test.com', password: hashedPassword, role: 'provider', city: 'Amravati' },
    ]);

    console.log('Mock Users created successfully!');

    // Extract the created provider users to link their profiles
    const providerUsers = users.filter(u => u.role === 'provider');

    // 4. Create Service Provider Profiles
    // Note: MongoDB GeoJSON coordinates MUST be [longitude, latitude]
    const baseLng = 77.7403;
    const baseLat = 20.8619;

    const providers = await ServiceProvider.insertMany([
      {
        userId: providerUsers[0]._id, // Amit Verma
        name: providerUsers[0].name,
        city: 'Amravati',
        location: {
          type: 'Point',
          // Approx 1-2 km away
          coordinates: [baseLng + 0.01, baseLat + 0.01] 
        },
        offeredServices: [
          { name: 'Leak Repair', category: 'Plumbing', price: 300 },
          { name: 'Pipe Installation', category: 'Plumbing', price: 800 },
          { name: 'Water Tank Cleaning', category: 'Cleaning', price: 500 }
        ],
        bio: 'Expert plumber with over 8 years of experience in residential and commercial plumbing solutions.',
        experience: 8,
        rating: 4.8,
        reviewCount: 24,
        availability: [new Date().toISOString(), new Date(Date.now() + 86400000).toISOString()] // Today and Tomorrow
      },
      {
        userId: providerUsers[1]._id, // Priya Deshmukh
        name: providerUsers[1].name,
        city: 'Amravati',
        location: {
          type: 'Point',
          // Approx 3-4 km away in opposite direction
          coordinates: [baseLng - 0.02, baseLat - 0.015] 
        },
        offeredServices: [
          { name: 'High School Math Tutoring', category: 'Education', price: 400 },
          { name: 'Science Tutoring', category: 'Education', price: 450 },
          { name: 'Graphic Design Basics', category: 'Design', price: 600 }
        ],
        bio: 'Passionate educator and freelance designer helping students achieve their academic goals.',
        experience: 4,
        rating: 4.9,
        reviewCount: 42,
        availability: []
      },
      {
        userId: providerUsers[2]._id, // Rajesh Kumar
        name: providerUsers[2].name,
        city: 'Amravati',
        location: {
          type: 'Point',
          // Very close by
          coordinates: [baseLng + 0.002, baseLat - 0.005] 
        },
        offeredServices: [
          { name: 'House Wiring Repair', category: 'Electrical', price: 500 },
          { name: 'Appliance Installation', category: 'Electrical', price: 350 },
          { name: 'Fan/Light Fitting', category: 'Electrical', price: 150 }
        ],
        bio: 'Certified electrician. Safety and quality are my top priorities. Available for emergency calls.',
        experience: 12,
        rating: 4.6,
        reviewCount: 18,
        availability: [new Date(Date.now() + 86400000).toISOString()] // Tomorrow
      }
    ]);

    console.log('Mock Service Providers created successfully!');
    
    // Ensure the Geospatial index is built immediately
    await ServiceProvider.syncIndexes();
    console.log('Geospatial indexes synced.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();