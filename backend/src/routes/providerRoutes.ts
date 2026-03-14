import express from 'express';
import { 
  getProviders, 
  getProviderById, 
  createProvider, 
  updateProvider 
} from '../controllers/providerController';
import { auth } from '../middlewares/authMiddleware';

const router = express.Router();

// Public Routes
router.get('/', getProviders);         // GET /api/providers
router.get('/:id', getProviderById);   // GET /api/providers/:id

// Protected Routes (Require Login)
router.post('/', auth, createProvider);      // POST /api/providers (Create Profile)
router.put('/:id', auth, updateProvider);    // PUT /api/providers/:id (Update Profile)

export default router;