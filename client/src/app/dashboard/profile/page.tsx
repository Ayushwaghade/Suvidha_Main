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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { ServiceProvider } from "@/lib/types";
import { Loader2, Plus, Trash2, MapPin, CalendarDays, Phone } from "lucide-react";

// --- Constants ---
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// --- Validation Schemas ---
const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  city: z.string().min(2, "City is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"), 
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const providerProfileSchema = profileSchema.extend({
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  experience: z.coerce.number().min(0, "Experience cannot be negative"),
  offeredServices: z.array(
    z.object({
      name: z.string().min(2, "Service name is required"),
      category: z.string().min(2, "Category is required"),
      price: z.coerce.number().min(1, "Price must be greater than 0"),
      deliveryMode: z.string().default("in-person"),
    })
  ).min(1, "Add at least one service"),
});

export default function ProfilePage() {
  // Use 'updateUser' from context instead of 'setUser'
  const { user, updateUser } = useAuth() as any; 
  const { toast } = useToast();
  
  const [providerDetails, setProviderDetails] = useState<ServiceProvider | null>(null);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
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
      phone: "", 
      lat: undefined as number | undefined,
      lng: undefined as number | undefined,
      bio: "",
      experience: 0,
      offeredServices: [{ name: "", category: "", price: 0, deliveryMode: "in-person" }], 
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
          phone: user.phone || "", 
          bio: "", 
          experience: 0, 
          offeredServices: [{ name: "", category: "", price: 0, deliveryMode: "in-person" }] 
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
              const servicesWithModes = myProfile.offeredServices.map((s: any) => ({
                ...s,
                deliveryMode: s.deliveryMode || "in-person"
              }));
              form.setValue("offeredServices", servicesWithModes);
            }
            
            if (myProfile.availability) {
                setAvailableDays(myProfile.availability);
            }

            if (myProfile.location?.coordinates) {
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

  const handleGetLocation = () => {
    setGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("lat", position.coords.latitude);
          form.setValue("lng", position.coords.longitude);
          setGettingLocation(false);
          toast({ title: "Location Updated" });
        },
        () => {
          setGettingLocation(false);
          toast({ variant: "destructive", title: "Location Error" });
        }
      );
    }
  };

  const toggleDay = (day: string) => {
    setAvailableDays((prev) => 
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  async function onSubmit(values: any) {
    if (!user) return;
    setSaving(true);
    
    try {
      // 1. Update User Profile in Database (Correct path: /users/profile)
      const userRes = await api.put('/users/profile', {
        name: values.name,
        phone: values.phone,
        city: values.city
      });

      // 2. CRITICAL: Update Global Context State & LocalStorage
      if (updateUser && userRes.data) {
        updateUser(userRes.data); 
      }

      // 3. Update Provider Details if role is provider
      if (user.role === 'provider') {
        const providerPayload = {
          bio: values.bio,
          experience: values.experience,
          city: values.city,
          lat: values.lat, 
          lng: values.lng,
          availability: availableDays,
          offeredServices: values.offeredServices 
        };

        if (providerDetails) {
          await api.put(`/providers/${providerDetails._id}`, providerPayload);
        } else {
          const res = await api.post('/providers', providerPayload);
          setProviderDetails(res.data); 
        }
      }

      toast({ title: "Profile Saved Successfully" });
    } catch (error: any) {
      console.error("Save error", error);
      toast({ variant: "destructive", title: "Save failed", description: "Please check your connection and try again." });
    } finally {
      setSaving(false);
    }
  }
  
  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Profile Settings</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
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
                
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="9876543210" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                
                <div className="flex flex-col space-y-2">
                  <FormLabel>GPS Location</FormLabel>
                  <Button type="button" variant="secondary" onClick={handleGetLocation} disabled={gettingLocation}>
                    <MapPin className="mr-2 h-4 w-4" /> Pin Current Location
                  </Button>
                </div>
              </div>

              {user.role === 'provider' && (
                <div className="space-y-6 pt-6 border-t">
                  <FormField control={form.control} name="experience" render={({ field }) => (
                    <FormItem><FormLabel>Experience (Years)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
              )}
            </CardContent>
          </Card>

          {user.role === 'provider' && (
            <Card>
              <CardHeader><CardTitle>Services Offered</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col md:flex-row gap-4 items-end bg-muted/50 p-4 rounded-lg relative border">
                    <div className="flex-1 w-full">
                      <FormField control={form.control} name={`offeredServices.${index}.name`} render={({ field }) => (
                        <FormItem><FormLabel>Service Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )}/>
                    </div>
                    <div className="flex-1 w-full">
                      <FormField control={form.control} name={`offeredServices.${index}.category`} render={({ field }) => (
                        <FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )}/>
                    </div>
                    <div className="w-full md:w-32">
                      <FormField control={form.control} name={`offeredServices.${index}.price`} render={({ field }) => (
                        <FormItem><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                      )}/>
                    </div>
                    <div className="w-full md:w-40">
                      <FormField control={form.control} name={`offeredServices.${index}.deliveryMode`} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mode</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "in-person"}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="in-person">In-Person</SelectItem>
                              <SelectItem value="online">Online</SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}/>
                    </div>
                    <Button type="button" variant="ghost" onClick={() => remove(index)} disabled={fields.length === 1}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ name: "", category: "", price: 0, deliveryMode: "in-person" })} className="w-full border-dashed"><Plus className="mr-2 h-4 w-4" /> Add Service</Button>
              </CardContent>
            </Card>
          )}

          {user.role === 'provider' && (
            <Card>
                <CardHeader><CardTitle>Weekly Availability</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => (
                      <Button key={day} type="button" variant={availableDays.includes(day) ? "default" : "outline"} onClick={() => toggleDay(day)}>{day}</Button>
                    ))}
                  </div>
                </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save All Changes
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}