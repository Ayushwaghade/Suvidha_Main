"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import type { ServiceProvider } from '@/lib/types';
import { ProviderCard } from '@/components/provider-card';
import { FiltersSidebar, type Filters } from '@/components/filters-sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const POPULAR_CITIES = ["Mumbai", "Delhi", "Bangalore", "Pune", "Nashik", "Hyderabad"];

export default function ServicesPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: State for location search
  const [gettingLocation, setGettingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [filters, setFilters] = useState<Filters>({
    city: searchParams.get('city') || '',
    priceRange: [100, 5000], 
    minRating: 0,
    radiusKm: 10, // Default search radius
  });

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // NEW: Get Seeker's Location for GeoJSON query
  const handleGetLocation = () => {
    setGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGettingLocation(false);
          toast({ title: "Location Found", description: "Showing providers near you." });
        },
        (error) => {
          console.error(error);
          setGettingLocation(false);
          toast({ variant: "destructive", title: "Error", description: "Could not get your location." });
        }
      );
    }
  };

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const params: any = {};
        
        if (filters.city && filters.city !== 'all') params.city = filters.city;
        if (filters.minRating > 0) params.minRating = filters.minRating;
        if (searchQuery) params.service = searchQuery; 
        
        const categoryParam = searchParams.get('category');
        if (!searchQuery && categoryParam) {
            params.service = categoryParam;
        }

        // NEW: Send location params to backend if active
        if (userLocation) {
           params.lat = userLocation.lat;
           params.lng = userLocation.lng;
           params.radiusKm = filters.radiusKm;
        }

        const res = await api.get('/providers', { params });
        setProviders(res.data);
      } catch (error) {
        console.error("Failed to fetch providers", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
        fetchProviders();
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.city, filters.minRating, filters.radiusKm, searchQuery, searchParams, userLocation]);

  // Client-side filtering for Price based on the NEW schema
  const displayedProviders = useMemo(() => {
    return providers.filter(provider => {
        // Find the minimum price among all services this provider offers
        const minPrice = provider.offeredServices?.length > 0 
          ? Math.min(...provider.offeredServices.map(s => s.price)) 
          : 0;
        
        // Check if their starting price falls within the slider's range
        return minPrice >= filters.priceRange[0] && minPrice <= filters.priceRange[1];
    });
  }, [providers, filters.priceRange]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline mb-2">Find a Professional</h1>
        <p className="text-muted-foreground">Search and filter from our list of trusted service providers.</p>
        
        <div className="flex flex-col md:flex-row gap-4 mt-4 max-w-2xl">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by name or skill (e.g., Plumber)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          {/* NEW: Find Near Me Button */}
          <Button 
            variant={userLocation ? "default" : "secondary"} 
            onClick={handleGetLocation}
            disabled={gettingLocation}
            className="whitespace-nowrap"
          >
            {gettingLocation ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
            {userLocation ? "Using GPS Location" : "Find Near Me"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <aside className="md:col-span-1">
          <FiltersSidebar 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            cities={POPULAR_CITIES} 
          />
        </aside>

        <main className="md:col-span-3">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Finding the best experts for you...</p>
             </div>
          ) : displayedProviders.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayedProviders.map(provider => (
                <ProviderCard key={provider._id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold">No Providers Found</h3>
              <p className="text-muted-foreground mt-2">
                Try adjusting your search or filters to see more results.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}