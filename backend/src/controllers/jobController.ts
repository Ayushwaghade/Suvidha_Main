import { Request, Response } from 'express';
import Job from '../models/Job';
import Bid from '../models/Bid';
import Booking from '../models/Booking';
import ServiceProvider from '../models/ServiceProvider';

// --- SEEKER: Post a Job ---
export const createJob = async (req: any, res: Response) => {
  try {
    const { title, description, category, budget, lat, lng } = req.body;

    const job = new Job({
      seekerId: req.user.id,
      title,
      description,
      category,
      budget,
      location: {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)]
      }
    });

    await job.save();
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// --- SEEKER: Get my posted jobs ---
export const getMyJobs = async (req: any, res: Response) => {
  try {
    const jobs = await Job.find({ seekerId: req.user.id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// --- PROVIDER: Find Open Jobs Near Me ---
export const getOpenJobs = async (req: any, res: Response) => {
  try {
    const { lat, lng, radiusKm, category } = req.query;
    let query: any = { status: 'open' };

    if (lat && lng) {
      const maxDistance = (Number(radiusKm) || 15) * 1000;
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: maxDistance
        }
      };
    }

    if (category) query.category = new RegExp(category as string, 'i');

    const jobs = await Job.find(query).populate('seekerId', 'name city avatarUrl');
    res.json(jobs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// --- PROVIDER: Place a Bid (UPDATED with Phone) ---
export const placeBid = async (req: any, res: Response) => {
  try {
    const { jobId, amount, proposal, phone } = req.body; // Extract phone from frontend

    const provider = await ServiceProvider.findOne({ userId: req.user.id });
    if (!provider) return res.status(400).json({ msg: 'Create a provider profile first to bid.' });

    const job = await Job.findById(jobId);
    if (!job || job.status !== 'open') return res.status(400).json({ msg: 'Job is no longer open.' });

    const existingBid = await Bid.findOne({ jobId, providerId: provider._id });
    if (existingBid) return res.status(400).json({ msg: 'You have already bid on this job.' });

    const bid = new Bid({
      jobId,
      providerId: provider._id,
      amount,
      proposal,
      phone // Save provider phone number to the bid
    });

    await bid.save();
    res.json(bid);
  } catch (err) {
    console.error("Place Bid Error:", err);
    res.status(500).send('Server Error');
  }
};

// --- GET BIDS FOR A JOB ---
export const getJobBids = async (req: Request, res: Response) => {
  try {
    const bids = await Bid.find({ jobId: req.params.jobId })
                          .populate('providerId', 'name rating reviewCount avatarUrl');
    res.json(bids);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// --- SEEKER: Accept a Bid (UPDATED to satisfy Booking Schema) ---
export const acceptBid = async (req: any, res: Response) => {
  try {
    const { bidId } = req.params;
    const { phone } = req.body; // Seeker phone sent from handleAcceptBid frontend

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ msg: 'Bid not found' });

    const job = await Job.findById(bid.jobId);
    if (!job) return res.status(404).json({ msg: 'Job not found' });

    if (job.seekerId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ msg: 'Job already assigned.' });
    }

    // 1. Update Bid & Job Status
    bid.status = 'accepted';
    await bid.save();

    await Bid.updateMany(
      { jobId: job._id, _id: { $ne: bid._id } },
      { $set: { status: 'rejected' } }
    );

    job.status = 'assigned';
    await job.save();

    // 2. Create the Booking (Now includes required Phone and Address)
    const booking = new Booking({
      seekerId: req.user.id,
      providerId: bid.providerId,
      date: new Date(Date.now() + 86400000), 
      service: `Custom Job: ${job.title}`,
      notes: `Accepted Bid Proposal: ${bid.proposal}`,
      price: bid.amount,
      status: 'confirmed',
      phone: phone || "Contact through profile", // Seeker's number
      address: job.description || "Location details provided in job description",
      serviceMode: 'in-person'
    });
    
    await booking.save();

    res.json({ msg: 'Bid accepted successfully! Booking created.', booking });
  } catch (err) {
    console.error("Accept Bid Error:", err);
    res.status(500).send('Server Error');
  }
};