"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Loader2, Check, X, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/star-rating";

export default function BookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewProviderId, setReviewProviderId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings');
        setBookings(res.data);
      } catch (error) {
        console.error("Failed to fetch bookings", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchBookings();
  }, [user]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
    } catch (error) {
      alert("Failed to update booking status.");
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) return toast({ variant: "destructive", title: "Error", description: "Please select a rating." });
    if (!comment.trim()) return toast({ variant: "destructive", title: "Error", description: "Please write a review." });

    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        bookingId: reviewBookingId,
        providerId: reviewProviderId,
        rating,
        comment
      });

      toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
      
      setBookings(bookings.map(b => b._id === reviewBookingId ? { ...b, isReviewed: true } : b));
      
      setReviewBookingId(null);
      setRating(0);
      setComment("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to submit", description: error.response?.data?.msg || "Something went wrong." });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Please log in.</div>;
  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const activeBookings = bookings.filter(b => ['pending', 'confirmed'].includes(b.status));
  const historyBookings = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));

  const renderBookingCard = (booking: any) => {
    const isSeeker = user.role === 'seeker';
    const provider = booking.providerId as any;
    const seeker = booking.seekerId as any;
    
    const partnerName = isSeeker ? provider?.name : seeker?.name;
    const partnerCity = isSeeker ? provider?.city : seeker?.city;
    const isFutureBooking = booking.date ? new Date(booking.date) > new Date() : false;

    // Safely extract the ID whether it's a raw string or an object
    const safeProviderId = typeof provider === 'string' ? provider : provider?._id || provider?.id;
    
    return (
      <Card key={booking._id} className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div>
                <CardTitle className="text-xl font-headline">{booking.service}</CardTitle>
                <CardDescription>{booking.date ? format(new Date(booking.date), "PPP 'at' p") : 'Date not set'}</CardDescription>
            </div>
            <Badge variant={booking.status === 'completed' ? 'default' : booking.status === 'cancelled' ? 'destructive' : booking.status === 'confirmed' ? 'outline' : 'secondary'} className="w-fit capitalize">
                {booking.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-4">
                <Avatar>
                    <AvatarFallback>{partnerName?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{isSeeker ? 'Provider' : 'Client'}: {partnerName || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{partnerCity}</p>
                    {booking.price && <p className="text-sm font-medium text-primary mt-1">Agreed Price: ₹{booking.price}</p>}
                </div>
            </div>
            
            {/* Provider Actions */}
            {!isSeeker && booking.status === 'pending' && (
              <div className="flex gap-3 mt-6 border-t pt-4">
                <Button onClick={() => handleUpdateStatus(booking._id, 'confirmed')} className="w-full bg-green-600 hover:bg-green-700 text-white"><Check className="mr-2 h-4 w-4" /> Accept</Button>
                <Button onClick={() => handleUpdateStatus(booking._id, 'cancelled')} variant="destructive" className="w-full"><X className="mr-2 h-4 w-4" /> Decline</Button>
              </div>
            )}
            {!isSeeker && booking.status === 'confirmed' && (
                <div className="mt-6 border-t pt-4 flex flex-col gap-2">
                <Button onClick={() => handleUpdateStatus(booking._id, 'completed')} className="w-full" disabled={isFutureBooking}>
                  {isFutureBooking ? 'Service Date Pending...' : 'Mark as Completed'}
                </Button>
                </div>
            )}

            {/* Provider viewing review notification */}
            {!isSeeker && booking.status === 'completed' && booking.isReviewed && (
                <div className="mt-6 border-t pt-4 text-center">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-3">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 
                        The client left a review for your service!
                    </p>
                    <Button variant="outline" asChild className="w-full">
                        <Link href={`/provider/${safeProviderId}`}>Read Review on Profile</Link>
                    </Button>
                </div>
            )}

            {/* Seeker Actions */}
            {isSeeker && booking.status === 'completed' && !booking.isReviewed && (
                <div className="mt-6 border-t pt-4">
                    <Button 
                        variant="outline" 
                        className="w-full border-primary text-primary hover:bg-primary/10"
                        onClick={() => {
                            setReviewBookingId(booking._id);
                            // CORRECTED: Ensure we use safeProviderId here so it doesn't crash on undefined!
                            setReviewProviderId(safeProviderId); 
                        }}
                    >
                        <Star className="mr-2 h-4 w-4" /> Leave a Review
                    </Button>
                </div>
            )}
            {isSeeker && booking.status === 'completed' && booking.isReviewed && (
                <div className="mt-6 border-t pt-4">
                    <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
                        <Check className="h-4 w-4 text-green-500" /> You reviewed this service
                    </p>
                </div>
            )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">My Bookings</h1>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 max-w-md">
          <TabsTrigger value="active">Active ({activeBookings.length})</TabsTrigger>
          <TabsTrigger value="history">History ({historyBookings.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-6">
          {activeBookings.length === 0 ? (
             <Card><CardContent className="p-12 text-center text-muted-foreground"><p>You have no active bookings.</p></CardContent></Card>
          ) : (
            <div className="grid gap-6">
              {activeBookings.map(renderBookingCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {historyBookings.length === 0 ? (
             <Card><CardContent className="p-12 text-center text-muted-foreground"><p>Your booking history is empty.</p></CardContent></Card>
          ) : (
            <div className="grid gap-6">
              {historyBookings.map(renderBookingCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!reviewBookingId} onOpenChange={(open) => !open && setReviewBookingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate your experience</DialogTitle>
            <DialogDescription>Your feedback helps others find great service providers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center space-y-2">
                <p className="font-medium">Tap to rate</p>
                <StarRating rating={rating} onRatingChange={setRating} interactive totalStars={5} size={32} />
            </div>
            <div className="space-y-2">
                <p className="font-medium text-sm">Write a review</p>
                <Textarea 
                    placeholder="Tell us about the service quality, professionalism, etc." 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                />
            </div>
            <Button onClick={handleSubmitReview} className="w-full" disabled={submittingReview}>
                {submittingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}