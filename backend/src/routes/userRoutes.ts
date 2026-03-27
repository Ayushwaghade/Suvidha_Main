import express from 'express';
import { updateProfile } from '../controllers/userController';
import { auth } from '../middlewares/authMiddleware'; // Make sure this path is correct for you

const router = express.Router();

// This handles: PUT http://localhost:5000/api/users/profile
router.put('/profile', auth, updateProfile);

export default router;