import express from 'express';
import { createReview, getProviderReviews } from '../controllers/reviewController';
import { auth } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', auth, createReview);
router.get('/provider/:providerId', getProviderReviews);

// THIS IS THE LINE TYPESCRIPT IS LOOKING FOR:
export default router;