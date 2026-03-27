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
import { Loader2, Check, X, Star, Video, Phone, MapPin } from "lucide-react"; // Added Phone & MapPin
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
        
        // SORT BY CREATION DATE: Most recent on top
        const sortedBookings = res.data.sort((a: any, b: any) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setBookings(sortedBookings);
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
      toast({ title: `Booking ${newStatus}` });
    } catch (error) {
      toast({ variant: "destructive", title: "Update failed" });
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0 || !comment.trim()) return;
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        bookingId: reviewBookingId,
        providerId: reviewProviderId,
        rating,
        comment
      });
      setBookings(bookings.map(b => b._id === reviewBookingId ? { ...b, isReviewed: true } : b));
      setReviewBookingId(null);
      toast({ title: "Review Submitted" });
    } catch (error) {
      toast({ variant: "destructive", title: "Review failed" });
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
    const safeProviderId = typeof provider === 'string' ? provider : provider?._id || provider?.id;
    
    // Privacy Shield: Only show contact info if the booking is confirmed or completed
    const showContactInfo = ['confirmed', 'completed'].includes(booking.status);

    return (
      <Card key={booking._id} className="shadow-sm border-l-4 border-l-primary transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div>
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                  {booking.service}
                  {booking.serviceMode === 'online' && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 border-none">Online Call</Badge>
                  )}
                </CardTitle>
                <CardDescription className="font-medium text-foreground/70">
                   {booking.date ? format(new Date(booking.date), "EEEE, MMM do 'at' p") : 'Date not set'}
                </CardDescription>
            </div>
            <Badge variant={booking.status === 'completed' ? 'default' : booking.status === 'cancelled' ? 'destructive' : 'outline'} className="w-fit capitalize px-3 py-1">
                {booking.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
            <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg">
                <Avatar className="h-12 w-12 border border-primary/20">
                    <AvatarFallback>{partnerName?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="text-xs uppercase text-muted-foreground font-bold">{isSeeker ? 'Provider' : 'Client'}</p>
                    <p className="font-bold text-lg leading-tight">{partnerName || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{partnerCity}</p>
                </div>
                {booking.price && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Price</p>
                    <p className="text-xl font-black text-primary">₹{booking.price}</p>
                  </div>
                )}
            </div>

            {/* --- CONTACT & ADDRESS SECTION --- */}
            {showContactInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-xl bg-primary/[0.02] border-dashed border-primary/30">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full"><Phone className="h-4 w-4 text-primary" /></div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Mobile Number</p>
                    <p className="text-sm font-semibold">{booking.phone || "Not Shared"}</p>
                  </div>
                </div>
                {booking.serviceMode === 'in-person' && (
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full"><MapPin className="h-4 w-4 text-primary" /></div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Service Address</p>
                      <p className="text-sm font-semibold leading-snug">{booking.address || "Address Hidden"}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Online Consultation Banner */}
            {booking.serviceMode === 'online' && booking.meetingLink && booking.status !== 'cancelled' && (
                <div className="p-4 bg-blue-600 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-blue-500/20">
                    <div className="flex items-center gap-3">
                        <Video className="h-6 w-6" />
                        <div>
                           <p className="font-bold">Virtual Consultation Ready</p>
                           <p className="text-xs opacity-90">Meeting link generated automatically.</p>
                        </div>
                    </div>
                    {booking.status !== 'completed' && (
                      <Button asChild variant="secondary" size="sm" className="font-bold">
                          <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer">Join Video Room</a>
                      </Button>
                    )}
                </div>
            )}
            
            {/* Actions for Provider */}
            {!isSeeker && (
              <div className="pt-2">
                {booking.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => handleUpdateStatus(booking._id, 'confirmed')} className="bg-green-600 hover:bg-green-700">Accept</Button>
                    <Button onClick={() => handleUpdateStatus(booking._id, 'cancelled')} variant="destructive">Decline</Button>
                  </div>
                )}
                {booking.status === 'confirmed' && (
                  <Button onClick={() => handleUpdateStatus(booking._id, 'completed')} className="w-full h-11" disabled={isFutureBooking}>
                    {isFutureBooking ? 'Waiting for Service Time...' : 'Mark Job as Completed'}
                  </Button>
                )}
              </div>
            )}

            {/* Actions for Seeker */}
            {isSeeker && booking.status === 'completed' && (
                <div className="pt-2">
                    {!booking.isReviewed ? (
                      <Button variant="outline" className="w-full border-primary text-primary font-bold" onClick={() => { setReviewBookingId(booking._id); setReviewProviderId(safeProviderId); }}>
                        <Star className="mr-2 h-4 w-4" /> Rate Experience
                      </Button>
                    ) : (
                      <div className="text-center text-sm font-medium text-green-600 flex items-center justify-center gap-2 bg-green-50 py-2 rounded-lg">
                        <Check className="h-4 w-4" /> Review Submitted Successfully
                      </div>
                    )}
                </div>
            )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight">Manage Bookings</h1>
          <p className="text-muted-foreground">Keep track of your appointments and history.</p>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-6">
          <TabsTrigger value="active" className="px-8 font-bold">Current Jobs</TabsTrigger>
          <TabsTrigger value="history" className="px-8 font-bold">Past History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeBookings.length === 0 ? (
             <div className="text-center py-20 border-2 border-dashed rounded-3xl"><p className="text-muted-foreground font-medium">No active bookings right now.</p></div>
          ) : activeBookings.map(renderBookingCard)}
        </TabsContent>

        <TabsContent value="history" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {historyBookings.length === 0 ? (
             <div className="text-center py-20 border-2 border-dashed rounded-3xl"><p className="text-muted-foreground font-medium">Your history is currently empty.</p></div>
          ) : historyBookings.map(renderBookingCard)}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!reviewBookingId} onOpenChange={(o) => !o && setReviewBookingId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle className="text-2xl font-headline">Review Service</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-3">
                <p className="font-bold text-sm">How was your experience?</p>
                <StarRating rating={rating} onRatingChange={setRating} interactive size={40} />
            </div>
            <Textarea placeholder="Share a few words about the provider's work..." value={comment} onChange={(e) => setComment(e.target.value)} rows={4} className="resize-none" />
            <Button onClick={handleSubmitReview} className="w-full h-12 text-lg font-bold" disabled={submittingReview}>
                {submittingReview ? <Loader2 className="animate-spin h-5 w-5" /> : "Submit My Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}