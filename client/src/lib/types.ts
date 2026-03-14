import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

export type UserRole = 'seeker' | 'provider';

export type User = {
  _id: string; // MongoDB uses _id
  name: string;
  email: string;
  role: UserRole;
  city: string;
  avatarUrl?: string;
};

export type ServiceProvider = {
  _id: string; // MongoDB uses _id
  userId: User | string; // Can be populated User object or ID string
  name: string;
  skills: string[];
  experience: number;
  rate: number;
  bio: string;
  rating: number;
  reviewCount: number;
  city: string;
  avatarUrl?: string;
  availability: string[]; // ISO date strings
};

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type Booking = {
  _id: string;
  seekerId: User; // Backend populates this
  providerId: ServiceProvider; // Backend populates this
  status: BookingStatus;
  date: string;
  service: string;
};

export type Review = {
  _id: string;
  bookingId: string;
  reviewerId: User;
  providerId: string;
  rating: number;
  comment: string;
  date: string;
};

export type ServiceCategory = {
  id: string;
  name: string;
  icon: ComponentType<LucideProps>;
  image: string;
  imageHint: string;
};