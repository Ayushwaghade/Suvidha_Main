"use client";

import { useEffect, useState, use, useMemo } from "react";
import { notFound } from "next/navigation";
import api from "@/lib/api";
import type { ServiceProvider, Review } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReviewCard } from "@/components/review-card";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Added Textarea for address
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Briefcase, Calendar as CalendarIcon, Tag, Star, Users, 
  Loader2, CheckCircle2, CreditCard, Video, MapPin, Phone 
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ProviderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { toast } = useToast();

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // --- BOOKING MODAL STATE ---
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedDateStr, setSelectedDateStr] = useState<string>(""); 
  const [serviceMode, setServiceMode] = useState("in-person");
  
  // Contact States
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const currentService = provider?.offeredServices?.find(s => s._id === selectedServiceId || s.name === selectedServiceId);

  const availableDatesList = useMemo(() => {
    if (!provider?.availability) return [];
    const dates = [];
    const workingDays = provider.availability;

    for (let i = 0; i < 21; i++) { 
      const date = addDays(new Date(), i);
      const dayName = WEEKDAYS[date.getDay()];
      if (workingDays.includes(dayName)) {
        dates.push(date);
      }
    }
    return dates;
  }, [provider]);

  useEffect(() => {
    if (currentService) {
      // @ts-ignore
      const mode = currentService.deliveryMode;
      if (mode === 'online') setServiceMode('online');
      if (mode === 'in-person') setServiceMode('in-person');
    }
  }, [currentService]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const providerRes = await api.get(`/providers/${id}`);
        setProvider(providerRes.data);
        const reviewsRes = await api.get(`/reviews/provider/${id}`);
        setReviews(reviewsRes.data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleBookService = async () => {
    if (!currentService || !selectedDateStr || !phone) {
      return toast({ variant: "destructive", title: "Incomplete details", description: "Please fill in all contact and booking details." });
    }

    if (serviceMode === 'in-person' && !address) {
      return toast({ variant: "destructive", title: "Address Required", description: "Please provide a service location." });
    }

    if (serviceMode === 'online') {
      setIsProcessingPayment(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setSubmitting(true);
    try {
      const fakeTxId = serviceMode === 'online' ? `TXN_${Math.floor(Math.random() * 1000000000)}` : undefined;
      await api.post('/bookings', {
        providerId: provider?._id,
        service: currentService.name,
        price: currentService.price,
        date: selectedDateStr,
        serviceMode,
        phone,
        address: serviceMode === 'in-person' ? address : "Online Consultation",
        paymentStatus: serviceMode === 'online' ? 'paid' : 'pending',
        transactionId: fakeTxId
      });

      toast({ title: "Success!", description: "Your point of contact has been shared with the provider." });
      setBookingModalOpen(false);
      setPaymentSuccess(false);
      setSelectedDateStr("");
      setAddress(""); // Reset for next time
    } catch (err) {
      toast({ variant: "destructive", title: "Booking failed" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error || !provider) return notFound();

  const categories = Array.from(new Set(provider.offeredServices?.map(s => s.category) || []));
  const startingPrice = provider.offeredServices?.length > 0 ? Math.min(...provider.offeredServices.map(s => s.price)) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column Profile Content */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardContent className="p-6 flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="h-32 w-32 border-4 border-primary">
                <AvatarImage src={provider.avatarUrl} alt={provider.name} />
                <AvatarFallback className="text-4xl">{provider.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <h1 className="text-4xl font-bold font-headline">{provider.name}</h1>
                <p className="text-muted-foreground">{provider.city}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {categories.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
                </div>
                <p className="mt-4 whitespace-pre-line text-foreground/80 leading-relaxed">{provider.bio}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-2xl font-headline">Services</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {provider.offeredServices?.map((service, index) => (
                  <li key={index} className="flex justify-between items-center p-4 border rounded-xl bg-card/50">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">{service.name}</p>
                        {/* @ts-ignore */}
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight px-1 h-5">{service.deliveryMode || 'In-Person'}</Badge>
                      </div>
                    </div>
                    <div className="font-bold text-lg">₹{service.price}</div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-2xl font-headline font-bold">Client Feedback</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {reviews.length > 0 ? reviews.map((r) => <ReviewCard key={r._id} review={r} />) : <p className="text-muted-foreground italic">No reviews yet.</p>}
            </CardContent>
          </Card>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-8">
          <Card className="sticky top-24 border-primary/20 shadow-md">
            <CardHeader><CardTitle className="text-2xl font-headline">Booking</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-5 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Starting from</p>
                <p className="text-4xl font-black text-primary font-headline">₹{startingPrice}</p>
              </div>
              <Button onClick={() => setBookingModalOpen(true)} size="lg" className="w-full text-lg h-12 shadow-sm font-bold">Book This Provider</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl flex items-center gap-2 font-headline"><CalendarIcon className="h-5 w-5 text-primary" /> Availability</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {provider.availability?.map(day => <Badge key={day} variant="outline" className="bg-muted/50 border-muted-foreground/20">{day}</Badge>)}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- RE-BUILT BOOKING MODAL (100% RELIABLE) --- */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Confirm Booking</DialogTitle>
            <DialogDescription>Please provide your service details and contact info.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* 1. Service Selection */}
            <div className="space-y-3">
              <label className="text-sm font-bold">1. Select Service</label>
              <RadioGroup value={selectedServiceId} onValueChange={setSelectedServiceId} className="grid gap-2">
                {provider.offeredServices?.map((s) => (
                  <label key={s._id || s.name} className={cn("flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all", selectedServiceId === (s._id || s.name) && "border-primary bg-primary/5 ring-1 ring-primary/20")}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={s._id || s.name} />
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                    <span className="font-bold text-sm">₹{s.price}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* 2. Date Selection */}
            <div className="space-y-3 border-t pt-4">
              <label className="text-sm font-bold">2. Choose Date</label>
              <Select value={selectedDateStr} onValueChange={setSelectedDateStr}>
                <SelectTrigger className="w-full h-11 border-muted-foreground/20">
                  <SelectValue placeholder="Pick an available day..." />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  {availableDatesList.map((date) => (
                    <SelectItem key={date.toISOString()} value={date.toISOString()}>
                      {format(date, "EEEE, MMM do")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Contact Loophole Fix: Contact Info */}
            <div className="space-y-4 border-t pt-4">
              <label className="text-sm font-bold">3. Contact & Delivery</label>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                   <Phone className="h-3 w-3" /> Provider will use this to contact you
                </div>
                <Input 
                  placeholder="Mobile Number" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 border-muted-foreground/20"
                />
              </div>

              <RadioGroup value={serviceMode} onValueChange={setServiceMode} className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <RadioGroupItem value="in-person" id="inp" className="peer sr-only" 
                  // @ts-ignore
                  disabled={currentService?.deliveryMode === 'online'} />
                  <label htmlFor="inp" className="flex flex-col items-center justify-center rounded-xl border-2 border-muted p-3 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                    <MapPin className="mb-1 h-5 w-5" /><span className="text-[10px] font-bold uppercase">In-Person</span>
                  </label>
                </div>
                <div>
                  <RadioGroupItem value="online" id="onl" className="peer sr-only" 
                  // @ts-ignore
                  disabled={currentService?.deliveryMode === 'in-person'} />
                  <label htmlFor="onl" className="flex flex-col items-center justify-center rounded-xl border-2 border-muted p-3 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                    <Video className="mb-1 h-5 w-5 text-blue-500" /><span className="text-[10px] font-bold uppercase text-blue-600">Online Call</span>
                  </label>
                </div>
              </RadioGroup>

              {serviceMode === 'in-person' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Textarea 
                    placeholder="Provide full service address (House No, Street, Landmark)..." 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="border-muted-foreground/20 min-h-[80px]"
                  />
                </div>
              )}
            </div>

            {/* 4. Mock Payment */}
            {serviceMode === 'online' && currentService && (
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl space-y-3">
                <div className="flex justify-between font-bold text-sm">
                  <span className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-600" /> Secure Checkout</span>
                  <span>₹{currentService.price}</span>
                </div>
                <Input disabled placeholder="Card: •••• •••• •••• 4242" className="h-8 text-[10px] bg-background border-blue-200" />
              </div>
            )}

            <Button 
              onClick={handleBookService} 
              className="w-full h-14 text-lg font-bold shadow-lg" 
              disabled={submitting || isProcessingPayment || paymentSuccess || !selectedServiceId || !selectedDateStr || !phone || (serviceMode === 'in-person' && !address)}
            >
              {isProcessingPayment ? <Loader2 className="h-5 w-5 animate-spin" /> : paymentSuccess ? <><CheckCircle2 className="mr-2 h-5 w-5" /> Confirmed!</> : serviceMode === 'online' ? `Pay ₹${currentService?.price} & Book` : "Confirm Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}