import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import ServiceProvider from '../models/ServiceProvider';

// Register User
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, city } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword, role, city });
    await user.save();

    // If registering as provider, create empty provider profile
    if (role === 'provider') {
      const provider = new ServiceProvider({
        userId: user._id,
        name: user.name,
        city: user.city,
        rate: 0, // Default
      });
      await provider.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name, email, role, city } });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// Login User
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, city: user.city } });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};