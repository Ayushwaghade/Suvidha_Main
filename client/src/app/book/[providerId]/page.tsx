"use client";

import { useEffect, useState, use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import api from '@/lib/api';
import type { ServiceProvider } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Updated Schema to validate the dropdown selection
const bookingSchema = z.object({
  service: z.string().min(1, { message: 'Please select the service you need.' }),
  date: z.coerce.date({ required_error: 'Please select a date.' }).refine((date) => {
    // Basic check: Date must be today or in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, { message: "Date cannot be in the past." }),
  notes: z.string().optional(),
});

export default function BookProviderPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
  });

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const res = await api.get(`/providers/${providerId}`);
        setProvider(res.data);
      } catch (error) {
        console.error("Provider not found");
      } finally {
        setLoading(false);
      }
    };
    fetchProvider();
  }, [providerId]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!provider) return notFound();
  
  // Prepare availability check (if provider has specific dates set)
  const availableDates = provider.availability ? provider.availability.map(d => new Date(d).toDateString()) : [];
  
  async function onSubmit(values: z.infer<typeof bookingSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not logged in', description: 'Please log in to book a service.' });
        router.push('/login');
        return;
    }

    // Manual check for specific availability
    if (availableDates.length > 0) {
        const selectedDateStr = values.date.toDateString();
        if (!availableDates.includes(selectedDateStr)) {
            form.setError("date", { message: "Provider is not available on this specific date." });
            return;
        }
    }

    try {
      await api.post('/bookings', {
        providerId: provider!._id,
        seekerId: user._id, 
        date: values.date.toISOString(),
        service: values.service,
        notes: values.notes 
      });

      toast({ title: 'Booking Request Sent!', description: `Your request to ${provider?.name} has been sent.` });
      router.push('/dashboard/bookings');
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Booking Failed', 
        description: error.response?.data?.msg || 'Could not complete booking.' 
      });
    }
  }
  
  // Calculate "Today" in YYYY-MM-DD format for the min attribute
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="container mx-auto flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Book {provider.name}</CardTitle>
          <CardDescription>Select the specific service you need and request a booking.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* DROPDOWN TO SELECT SPECIFIC SERVICE FROM PROVIDER'S ARRAY */}
              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Required</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service from their list" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {provider.offeredServices && provider.offeredServices.length > 0 ? (
                          provider.offeredServices.map((service: any, index: number) => (
                            <SelectItem key={index} value={service.name}>
                              {service.name} (Rs. {service.price})
                            </SelectItem>
                          ))
                        ) : (
                          // Fallback if they are using the old skills array
                          provider.skills?.map((skill: string, index: number) => (
                            <SelectItem key={index} value={skill}>
                              {skill}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* NATIVE DATE INPUT */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        min={todayStr}
                        {...field} 
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      />
                    </FormControl>
                    {availableDates.length > 0 && (
                        <FormDescription>
                            This provider has limited availability. Please check their profile for valid dates.
                        </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any specific details for the provider..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" size="lg">Send Booking Request</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}