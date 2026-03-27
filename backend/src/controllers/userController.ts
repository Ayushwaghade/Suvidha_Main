import { Response } from 'express';
import User from '../models/User';

export const updateProfile = async (req: any, res: Response) => {
  try {
    const { name, city, phone } = req.body;

    // Use req.user.id (from your auth middleware) to find the user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, city, phone },
      { new: true } // This returns the updated document
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).send('Server Error');
  }
};