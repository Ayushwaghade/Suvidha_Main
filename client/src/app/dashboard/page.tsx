"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard/bookings');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
      <div className="flex items-center justify-center p-8">
        <p>Loading...</p>
      </div>
  );
}
