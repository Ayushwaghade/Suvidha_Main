import express from 'express';
import { createBooking, getMyBookings, updateBookingStatus } from '../controllers/bookingController';
import { auth } from "../middlewares/authMiddleware";
const router = express.Router();

router.post('/', auth, createBooking);
router.get('/', auth, getMyBookings);
router.patch('/:id/status', auth, updateBookingStatus); // Optional: For providers to manage bookings

export default router;