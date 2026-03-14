import type { User, ServiceProvider, Booking, Review, ServiceCategory } from '@/lib/types';
import { Wrench, Brush, TreePine, Power, Droplets, Hammer } from 'lucide-react';
import { PlaceHolderImages } from './placeholder-images';

export const users: User[] = [
  { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com', role: 'seeker', city: 'Mumbai', avatarUrl: PlaceHolderImages.find(p => p.id === 'avatar-1')?.imageUrl || '' },
  { id: 'user-2', name: 'Bob Williams', email: 'bob@example.com', role: 'provider', city: 'Delhi', avatarUrl: PlaceHolderImages.find(p => p.id === 'avatar-2')?.imageUrl || '' },
  { id: 'user-3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'seeker', city: 'Bangalore', avatarUrl: PlaceHolderImages.find(p => p.id === 'avatar-3')?.imageUrl || '' },
  { id: 'user-4', name: 'Diana Miller', email: 'diana@example.com', role: 'provider', city: 'Mumbai', avatarUrl: PlaceHolderImages.find(p => p.id === 'avatar-4')?.imageUrl || '' },
  { id: 'user-5', name: 'Ethan Davis', email: 'ethan@example.com', role: 'provider', city: 'Bangalore', avatarUrl: PlaceHolderImages.find(p => p.id === 'avatar-5')?.imageUrl || '' },
  { id: 'user-6', name: 'Fiona Garcia', email: 'fiona@example.com', role: 'provider', city: 'Delhi', avatarUrl: PlaceHolderImages.find(p => p.id === 'avatar-6')?.imageUrl || '' },
];

export const serviceProviders: ServiceProvider[] = [
  {
    id: 'provider-1', userId: 'user-2', name: 'Bob Williams',
    skills: ['Plumbing', 'Pipe Fitting'], experience: 10, rate: 500,
    bio: '10+ years of experience in residential and commercial plumbing. Fast, reliable, and affordable.',
    rating: 4.8, reviewCount: 120, city: 'Delhi',
    avatarUrl: PlaceHolderImages.find(p => p.id === 'avatar-2')?.imageUrl || '',
    availability: ['2024-08-01', '2024-08-02', '2024-08-05', '2024-08-07', '2024-08-10']
  },
  {
    id: 'provider-2', userId: 'user-4', name: 'Diana Miller',
    skills: ['Electrical Wiring', 'Appliance Repair'], experience: 8, rate: 650,
    bio: 'Licensed electrician specializing in home wiring and appliance diagnostics. Safety is my priority.',
    rating: 4.9, reviewCount: 88, city: 'Mumbai',
    avatarUrl: PlaceHolderImages.find(p => p.id === 'avatar-4')?.imageUrl || '',
    availability: ['2024-08-03', '2024-08-04', '2024-08-06', '2024-08-08']
  },
  {
    id: 'provider-3', userId: 'user-5', name: 'Ethan Davis',
    skills: ['Interior Painting', 'Exterior Painting'], experience: 12, rate: 450,
    bio: 'Professional painter delivering high-quality finishes. I treat every home like my own.',
    rating: 4.7, reviewCount: 95, city: 'Bangalore',
    avatarUrl: PlaceHolderImages.find(p => p.id === 'avatar-5')?.imageUrl || '',
    availability: ['2024-08-01', '2024-08-03', '2024-08-05', '2024-08-09', '2024-08-11']
  },
  {
    id: 'provider-4', userId: 'user-6', name: 'Fiona Garcia',
    skills: ['Deep Cleaning', 'Office Cleaning'], experience: 5, rate: 400,
    bio: 'Detail-oriented cleaning professional. Eco-friendly products available upon request.',
    rating: 4.9, reviewCount: 210, city: 'Delhi',
    avatarUrl: PlaceHolderImages.find(p => p.id === 'avatar-6')?.imageUrl || '',
    availability: ['2024-08-02', '2024-08-04', '2024-08-06', '2024-08-12']
  },
];

export const bookings: Booking[] = [
  { id: 'booking-1', seekerId: 'user-1', providerId: 'provider-2', status: 'completed', date: '2024-07-15T10:00:00Z', service: 'Electrical Wiring' },
  { id: 'booking-2', seekerId: 'user-3', providerId: 'provider-1', status: 'confirmed', date: '2024-08-01T14:00:00Z', service: 'Plumbing' },
  { id: 'booking-3', seekerId: 'user-1', providerId: 'provider-4', status: 'pending', date: '2024-08-02T09:00:00Z', service: 'Deep Cleaning' },
];

export const reviews: Review[] = [
  { 
    id: 'review-1', bookingId: 'booking-1', reviewerId: 'user-1', providerId: 'provider-2',
    rating: 5, comment: 'Diana was amazing! She fixed our wiring issue quickly and was very professional.',
    date: '2024-07-16T11:00:00Z', 
    reviewerName: 'Alice Johnson', 
    reviewerAvatar: PlaceHolderImages.find(p => p.id === 'avatar-1')?.imageUrl || '' 
  },
  { 
    id: 'review-2', bookingId: 'booking-1', reviewerId: 'user-3', providerId: 'provider-2',
    rating: 4, comment: 'Good service, but arrived a bit late. Overall satisfied with the work.',
    date: '2024-07-18T11:00:00Z', 
    reviewerName: 'Charlie Brown', 
    reviewerAvatar: PlaceHolderImages.find(p => p.id === 'avatar-3')?.imageUrl || '' 
  },
];

export const serviceCategories: ServiceCategory[] = [
    { id: 'sc-1', name: 'Plumbing', icon: Droplets, image: PlaceHolderImages.find(p => p.id === 'plumbing-service')?.imageUrl || '', imageHint: PlaceHolderImages.find(p => p.id === 'plumbing-service')?.imageHint || '' },
    { id: 'sc-2', name: 'Cleaning', icon: Wrench, image: PlaceHolderImages.find(p => p.id === 'cleaning-service')?.imageUrl || '', imageHint: PlaceHolderImages.find(p => p.id === 'cleaning-service')?.imageHint || '' },
    { id: 'sc-3', name: 'Electrical', icon: Power, image: PlaceHolderImages.find(p => p.id === 'electrical-service')?.imageUrl || '', imageHint: PlaceHolderImages.find(p => p.id === 'electrical-service')?.imageHint || '' },
    { id: 'sc-4', name: 'Painting', icon: Brush, image: PlaceHolderImages.find(p => p.id === 'painting-service')?.imageUrl || '', imageHint: PlaceHolderImages.find(p => p.id === 'painting-service')?.imageHint || '' },
    { id: 'sc-5', name: 'Carpentry', icon: Hammer, image: PlaceHolderImages.find(p => p.id === 'carpentry-service')?.imageUrl || '', imageHint: PlaceHolderImages.find(p => p.id === 'carpentry-service')?.imageHint || '' },
    { id: 'sc-6', name: 'Gardening', icon: TreePine, image: PlaceHolderImages.find(p => p.id === 'gardening-service')?.imageUrl || '', imageHint: PlaceHolderImages.find(p => p.id === 'gardening-service')?.imageHint || '' },
];
