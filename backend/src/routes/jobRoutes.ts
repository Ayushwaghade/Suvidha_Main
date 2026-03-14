import express from 'express';
import { 
    createJob, 
    getMyJobs, 
    getOpenJobs, 
    placeBid, 
    getJobBids, 
    acceptBid // <-- Imported new function
} from '../controllers/jobController';
import { auth } from '../middlewares/authMiddleware';

const router = express.Router();

// Job Routes
router.post('/', auth, createJob);
router.get('/my-jobs', auth, getMyJobs);
router.get('/explore', getOpenJobs); 

// Bid Routes
router.post('/bid', auth, placeBid);
router.get('/:jobId/bids', getJobBids);
router.patch('/bid/:bidId/accept', auth, acceptBid); // <-- Added Accept Route

export default router;