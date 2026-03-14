"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import type { ServiceProvider } from "@/lib/types";
import type { DayPicker } from "react-day-picker";
import { Loader2, Plus, Trash2, MapPin } from "lucide-react";

// --- Validation Schemas ---
const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  city: z.string().min(2, "City is required"),
  // NEW: Optional coordinates
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const providerProfileSchema = profileSchema.extend({
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  experience: z.coerce.number().min(0, "Experience cannot be negative"),
  offeredServices: z.array(
    z.object({
      name: z.string().min(2, "Service name is required (e.g., Kitchen Plumbing)"),
      category: z.string().min(2, "Category is required (e.g., Plumbing)"),
      price: z.coerce.number().min(1, "Price must be greater than 0"),
    })
  ).min(1, "Add at least one service"),
});

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [providerDetails, setProviderDetails] = useState<ServiceProvider | null>(null);
  const [dates, setDates] = useState<Date[] | undefined>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(user?.role === 'provider' ? providerProfileSchema : profileSchema),
    defaultValues: {
      name: "",
      email: "",
      city: "",
      lat: undefined as number | undefined,
      lng: undefined as number | undefined,
      bio: "",
      experience: 0,
      offeredServices: [{ name: "", category: "", price: 0 }], 
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "offeredServices"
  });

  // --- Fetch Data on Mount ---
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        form.reset({
          name: user.name,
          email: user.email,
          city: user.city,
          bio: "", 
          experience: 0, 
          offeredServices: [{ name: "", category: "", price: 0 }] 
        });

        if (user.role === 'provider') {
          const res = await api.get('/providers');
          const myProfile = res.data.find((p: any) => 
            String(p.userId?._id || p.userId?.id || p.userId) === String(user._id || user.id)
          );

          if (myProfile) {
            setProviderDetails(myProfile);
            
            form.setValue("bio", myProfile.bio || "");
            form.setValue("experience", myProfile.experience || 0);
            
            if (myProfile.offeredServices && myProfile.offeredServices.length > 0) {
              form.setValue("offeredServices", myProfile.offeredServices);
            }
            
            if (myProfile.availability) {
                setDates(myProfile.availability.map((d: string) => new Date(d)));
            }

            // NEW: Set existing coordinates if they exist
            if (myProfile.location?.coordinates) {
              // MongoDB stores them as [longitude, latitude]
              form.setValue("lng", myProfile.location.coordinates[0]);
              form.setValue("lat", myProfile.location.coordinates[1]);
            }
          }
        }
      } catch (error) {
        console.error("Profile load error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, form]);

  // --- Handle Geolocation ---
  const handleGetLocation = () => {
    setGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("lat", position.coords.latitude);
          form.setValue("lng", position.coords.longitude);
          setGettingLocation(false);
          toast({ 
            title: "Location Updated", 
            description: "Your exact coordinates have been pinned for local searches." 
          });
        },
        (error) => {
          console.error(error);
          setGettingLocation(false);
          toast({ 
            variant: "destructive", 
            title: "Location Error", 
            description: "Could not get location. Please allow location access in your browser." 
          });
        }
      );
    } else {
      setGettingLocation(false);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Geolocation is not supported by your browser." 
      });
    }
  };

  const onDayClick: DayPicker['props']['onDayClick'] = (day, { selected }) => {
    if (selected) {
      setDates(dates?.filter(d => d.getTime() !== day.getTime()));
    } else {
      setDates([...(dates || []), day]);
    }
  };

  // --- Handle Form Submit ---
  async function onSubmit(values: any) {
    if (!user) return;
    setSaving(true);
    
    try {
      const availabilityStrings = dates?.map(d => d.toISOString()) || [];
      
      const payload = {
        bio: values.bio,
        experience: values.experience,
        city: values.city,
        lat: values.lat, // NEW: Send lat/lng to backend
        lng: values.lng,
        availability: availabilityStrings,
        offeredServices: values.offeredServices 
      };

      if (user.role === 'provider') {
        if (providerDetails) {
          await api.put(`/providers/${providerDetails._id}`, payload);
        } else {
          const res = await api.post('/providers', payload);
          setProviderDetails(res.data); 
        }
      }

      toast({ 
        title: "Profile Saved", 
        description: "Your profile has been successfully updated." 
      });

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.msg || "Could not save profile.";
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: msg 
      });
    } finally {
      setSaving(false);
    }
  }
  
  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Profile Settings</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* PERSONAL INFO CARD */}
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" disabled {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                
                {/* NEW: LOCATION CAPTURE SECTION */}
                <div className="flex flex-col space-y-2">
                  <FormLabel>Precise Location (For Nearby Searches)</FormLabel>
                  <div className="flex items-center gap-3">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={handleGetLocation} 
                      disabled={gettingLocation}
                      className="w-full md:w-auto"
                    >
                      {gettingLocation ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4 mr-2" />
                      )}
                      Use Current Location
                    </Button>
                  </div>
                  {(form.watch('lat') && form.watch('lng')) ? (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      ✓ Location pinned ({form.watch('lat')?.toFixed(4)}, {form.watch('lng')?.toFixed(4)})
                    </p>
                  ) : (
                    <FormDescription>Capture your location to appear in radius-based searches.</FormDescription>
                  )}
                </div>
              </div>

              {user.role === 'provider' && (
                <div className="space-y-6 pt-6 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="experience" render={({ field }) => (
                      <FormItem><FormLabel>Overall Experience (Years)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                  </div>
                  <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea placeholder="Tell us about yourself" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SERVICES OFFERED CARD (Providers Only) */}
          {user.role === 'provider' && (
            <Card>
              <CardHeader>
                <CardTitle>Services & Pricing</CardTitle>
                <CardDescription>List the specific services you provide and their fixed or hourly rates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col md:flex-row gap-4 items-end bg-muted/50 p-4 rounded-lg relative">
                    <div className="flex-1 w-full">
                      <FormField control={form.control} name={`offeredServices.${index}.name`} render={({ field }) => (
                        <FormItem><FormLabel>Service Description</FormLabel><FormControl><Input placeholder="e.g. Kitchen Plumbing Setup" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                    </div>
                    <div className="flex-1 w-full">
                      <FormField control={form.control} name={`offeredServices.${index}.category`} render={({ field }) => (
                        <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g. Plumbing" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                    </div>
                    <div className="w-full md:w-32">
                      <FormField control={form.control} name={`offeredServices.${index}.price`} render={({ field }) => (
                        <FormItem><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" placeholder="500" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                    </div>
                    
                    {/* Delete row button */}
                    {fields.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="text-destructive w-full md:w-auto mt-2 md:mt-0"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 md:mr-0 mr-2" />
                        <span className="md:hidden">Remove Service</span>
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => append({ name: "", category: "", price: 0 })}
                  className="w-full border-dashed"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Another Service
                </Button>
                
                {form.formState.errors.offeredServices?.root?.message && (
                    <p className="text-sm font-medium text-destructive">{form.formState.errors.offeredServices.root.message}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* AVAILABILITY CALENDAR (Providers Only) */}
          {user.role === 'provider' && (
            <Card>
                <CardHeader><CardTitle>Set Your Availability</CardTitle></CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        mode="multiple"
                        selected={dates}
                        onDayClick={onDayClick}
                        className="rounded-md border"
                    />
                </CardContent>
            </Card>
          )}

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end sticky bottom-4">
            <Button type="submit" size="lg" disabled={saving} className="shadow-lg">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save All Changes
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}