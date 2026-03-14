import { Request, Response } from 'express';
import ServiceProvider from '../models/ServiceProvider';
import User from '../models/User';

// --- Get All Providers (with filters & location) ---
export const getProviders = async (req: Request, res: Response) => {
  try {
    const { city, service, minRating, lat, lng, radiusKm } = req.query;
    let query: any = {};

    // 1. Location-Based Radius Search (GeoJSON)
    if (lat && lng) {
      const maxDistanceInMeters = (Number(radiusKm) || 10) * 1000; // Default 10km

      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)] // [longitude, latitude]
          },
          $maxDistance: maxDistanceInMeters
        }
      };
    } else if (city) {
      // 2. Fallback to City string search if no GPS coordinates are provided
      query.city = city;
    }

    // 3. Service Category Search
    if (service) {
      query['offeredServices.category'] = { $in: [new RegExp(service as string, 'i')] };
    }
    
    // 4. Rating Search
    if (minRating) query.rating = { $gte: Number(minRating) };

    const providers = await ServiceProvider.find(query).populate('userId', 'name email avatarUrl');
    res.json(providers);
  } catch (err) {
    console.error("Get Providers Error:", err);
    res.status(500).send('Server Error');
  }
};

// --- Get Single Provider by ID ---
export const getProviderById = async (req: Request, res: Response) => {
  try {
    const provider = await ServiceProvider.findById(req.params.id).populate('userId', 'name email avatarUrl');
    if (!provider) return res.status(404).json({ msg: 'Provider not found' });
    res.json(provider);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// --- Create New Profile (Fixes "Profile Not Found") ---
export const createProvider = async (req: any, res: Response) => {
  try {
    // Added lat and lng extraction from req.body
    const { offeredServices, experience, bio, city, availability, lat, lng } = req.body;
    
    // 1. Check if profile already exists for this user
    let provider = await ServiceProvider.findOne({ userId: req.user.id });
    if (provider) {
      return res.status(400).json({ msg: 'Provider profile already exists' });
    }

    // 2. Fetch basic user details to populate defaults
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // 3. Create the new profile
    provider = new ServiceProvider({
      userId: req.user.id,
      name: user.name, // Sync name from User model
      city: city || user.city, // Prefer payload city, fallback to User city
      
      // ✅ Set the GeoJSON location using lat/lng
      location: {
        type: 'Point',
        coordinates: [Number(lng) || 0, Number(lat) || 0] // [longitude, latitude]
      },

      offeredServices, // Replaced skills and rate with the array of objects
      experience,
      bio,
      availability,
      rating: 0,
      reviewCount: 0
    });

    await provider.save();
    res.json(provider);
  } catch (err) {
    console.error("Create Provider Error:", err);
    res.status(500).send('Server Error');
  }
};

// --- Update Existing Profile ---
export const updateProvider = async (req: any, res: Response) => {
  try {
    // Try to find provider by the ID in the URL
    let provider = await ServiceProvider.findById(req.params.id);

    // If not found (or if ID is invalid), try finding by the logged-in User ID
    if (!provider) {
       provider = await ServiceProvider.findOne({ userId: req.user.id });
    }

    if (!provider) return res.status(404).json({ msg: 'Provider profile not found' });

    // Verify that the logged-in user owns this profile
    if (provider.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this profile' });
    }

    // Update fields including lat and lng
    const { offeredServices, experience, bio, availability, city, lat, lng } = req.body;

    // Replaced skills and rate with offeredServices
    if (offeredServices) provider.offeredServices = offeredServices;
    if (experience) provider.experience = experience;
    if (bio) provider.bio = bio;
    if (availability) provider.availability = availability;
    if (city) provider.city = city;

    // ✅ Update GeoJSON location if coordinates are provided
    if (lat !== undefined && lng !== undefined) {
      provider.location = {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)] // [longitude, latitude]
      };
    }

    await provider.save();
    res.json(provider);
  } catch (err) {
    console.error("Update Provider Error:", err);
    res.status(500).send('Server Error');
  }
};