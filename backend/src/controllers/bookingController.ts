import { Request, Response } from 'express';
import Booking from '../models/Booking';
import ServiceProvider from '../models/ServiceProvider'; // <-- Add this import!

// Create Booking
// Create Booking
export const createBooking = async (req: any, res: Response) => {
  try {
    const { providerId, date, service, notes } = req.body;
    
    const provider = await ServiceProvider.findById(providerId);
    let lockedPrice = 0;

    if (provider && provider.offeredServices) {
      const selectedService = provider.offeredServices.find((s: any) => s.name === service);
      if (selectedService) {
        lockedPrice = selectedService.price;
      }
    }

    const booking = new Booking({
      seekerId: req.user.id,
      providerId,
      date,
      service,
      notes,      
    });

    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error("Create Booking Error:", err);
    res.status(500).send('Server Error');
  }
};
// Get My Bookings
export const getMyBookings = async (req: any, res: Response) => {
  try {
    let bookings;
    
    if (req.user.role === 'seeker') {
      bookings = await Booking.find({ seekerId: req.user.id }).populate('providerId');
    } else {
      // 1. Find the provider profile linked to this authenticated user
      const providerProfile = await ServiceProvider.findOne({ userId: req.user.id });
      
      if (!providerProfile) {
        // If they don't have a profile yet, they can't have any bookings
        return res.json([]); 
      }

      // 2. Search bookings using the ServiceProvider's _id
      bookings = await Booking.find({ providerId: providerProfile._id }).populate('seekerId'); 
    }
    
    res.json(bookings);
  } catch (err) {
    console.error("Fetch Bookings Error:", err);
    res.status(500).send('Server Error');
  }

  
};

// Update Booking Status (Accept, Decline, Complete)
export const updateBookingStatus = async (req: any, res: Response) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // NEW: Time-check validation for 'completed' status
    if (status === 'completed') {
      if (!booking.date) {
        return res.status(400).json({ msg: 'Cannot complete a booking without a scheduled date.' });
      }
      
      const scheduledDate = new Date(booking.date);
      const currentDate = new Date();
      
      // If the scheduled date is strictly in the future, block it.
      if (scheduledDate > currentDate) {
        return res.status(400).json({ 
          msg: 'Cannot mark a booking as completed before its scheduled date.' 
        });
      }
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error("Update Booking Error:", err);
    res.status(500).send('Server Error');
  }
};