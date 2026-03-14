"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import type { ServiceProvider, Review } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ReviewCard } from "@/components/review-card";
import { Briefcase, Calendar as CalendarIcon, Tag, Star, Users, Loader2, CheckCircle2 } from "lucide-react";

export default function ProviderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const providerRes = await api.get(`/providers/${id}`);
        setProvider(providerRes.data);

        try {
          const reviewsRes = await api.get(`/reviews/provider/${id}`);
          setReviews(reviewsRes.data);
        } catch (reviewErr) {
          console.warn("Could not fetch reviews", reviewErr);
          setReviews([]); 
        }

      } catch (err) {
        console.error("Error loading provider", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !provider) {
    return notFound();
  }

  // Parse availability dates
  const availabilityDates = provider.availability 
    ? provider.availability.map((dateStr) => new Date(dateStr)) 
    : [];

  // Extract unique categories for badges
  const categories = Array.from(new Set(provider.offeredServices?.map(s => s.category) || []));

  // Calculate starting price
  const startingPrice = provider.offeredServices?.length > 0 
    ? Math.min(...provider.offeredServices.map(s => s.price)) 
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Profile & Stats */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header Card */}
          <Card>
            <CardContent className="p-6 flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="h-32 w-32 border-4 border-primary">
                <AvatarImage src={provider.avatarUrl} alt={provider.name} />
                <AvatarFallback className="text-4xl">
                  {provider.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <h1 className="text-4xl font-bold font-headline">{provider.name}</h1>
                <p className="text-muted-foreground mt-1">{provider.city}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
                <p className="mt-4 text-foreground whitespace-pre-line">{provider.bio || "No bio available."}</p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-muted/50 rounded-lg">
                <Star className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">{provider.rating?.toFixed(1) || "N/A"}</p>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <Users className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">{provider.reviewCount || 0}</p>
                <p className="text-sm text-muted-foreground">Reviews</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <Briefcase className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">{provider.experience || 0}+</p>
                <p className="text-sm text-muted-foreground">Years Exp.</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <Tag className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">
                  {startingPrice > 0 ? `Rs. ${startingPrice}` : 'Varies'}
                </p>
                <p className="text-sm text-muted-foreground">Starting at</p>
              </div>
            </CardContent>
          </Card>

          {/* NEW: Detailed Services List */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Services Offered</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {provider.offeredServices && provider.offeredServices.length > 0 ? (
                  provider.offeredServices.map((service, index) => (
                    <li key={index} className="flex justify-between items-center p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-lg">{service.name}</p>
                          <p className="text-sm text-muted-foreground">{service.category}</p>
                        </div>
                      </div>
                      <div className="font-bold text-lg">
                        Rs. {service.price}
                      </div>
                    </li>
                  ))
                ) : (
                   <p className="text-muted-foreground">This provider hasn't listed specific services yet.</p>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">
                Reviews ({reviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))
              ) : (
                <p className="text-muted-foreground">No reviews yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-8">
          
          {/* Booking Card */}
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Book Services</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {startingPrice > 0 && (
                <p className="text-3xl font-bold text-primary mb-4">
                  <span className="text-base font-normal text-muted-foreground block mb-1">Services start at</span>
                  Rs. {startingPrice}
                </p>
              )}
              <Button asChild size="lg" className="w-full">
                <Link href={`/book/${id}`}>Request Booking</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Availability Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <CalendarIcon className="h-6 w-6" />
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="multiple"
                selected={availabilityDates}
                ISOWeek
                className="rounded-md border pointer-events-none" 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}