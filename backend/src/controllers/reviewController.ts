import { Request, Response } from 'express';
import Review from '../models/Review';
import Booking from '../models/Booking';
import ServiceProvider from '../models/ServiceProvider';

// Create a new review
export const createReview = async (req: any, res: Response) => {
  try {
    const { bookingId, providerId, rating, comment } = req.body;

    // 1. Verify booking exists and belongs to the seeker
    const booking = await Booking.findOne({ _id: bookingId, seekerId: req.user.id });
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (booking.status !== 'completed') return res.status(400).json({ msg: 'Can only review completed bookings' });
    if (booking.isReviewed) return res.status(400).json({ msg: 'Booking already reviewed' });

    // 2. Create the review
    const review = new Review({
      bookingId,
      seekerId: req.user.id,
      providerId,
      rating,
      comment
    });
    await review.save();

    // 3. Mark booking as reviewed
    booking.isReviewed = true;
    await booking.save();

    // 4. Recalculate Provider's Average Rating
    const allReviews = await Review.find({ providerId });
    const avgRating = allReviews.reduce((acc, item) => item.rating + acc, 0) / allReviews.length;

    await ServiceProvider.findByIdAndUpdate(providerId, {
      rating: avgRating,
      reviewCount: allReviews.length
    });

    res.json(review);
  } catch (err) {
    console.error("Create Review Error:", err);
    res.status(500).send('Server Error');
  }
};

// Get reviews for a specific provider
export const getProviderReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ providerId: req.params.providerId })
                                .populate('seekerId', 'name avatarUrl')
                                .sort({ createdAt: -1 }); // Newest first
    res.json(reviews);
  } catch (err) {
    console.error("Get Reviews Error:", err);
    res.status(500).send('Server Error');
  }
};