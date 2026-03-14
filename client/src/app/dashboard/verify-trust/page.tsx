"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import api from '@/lib/api';
import { analyzeProviderData } from '@/ai/flows/automated-trust-verification';
import type { AnalyzeProviderDataOutput } from '@/ai/flows/automated-trust-verification';
import type { ServiceProvider, Review } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VerifyTrustPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [providerProfile, setProviderProfile] = useState<ServiceProvider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fetchingData, setFetchingData] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeProviderDataOutput | null>(null);

  // 1. Fetch Real Data from Backend on Mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role !== 'provider') {
        setFetchingData(false);
        return;
      }

      try {
        // A. Find the current provider's profile
        const providersRes = await api.get('/providers');
        const myProfile = providersRes.data.find((p: any) => {
            // Safely extract IDs from both objects
            const providerUserId = p.userId?._id || p.userId?.id || p.userId;
            const currentUserId = user?._id || user?.id; 
            
            // Safely compare them as strings
            return String(providerUserId) === String(currentUserId);
        });

        if (myProfile) {
          setProviderProfile(myProfile);

          // B. Fetch reviews for this provider
          // We assume GET /api/reviews/provider/:id exists based on your backend spec
          try {
            const reviewsRes = await api.get(`/reviews/provider/${myProfile._id}`);
            setReviews(reviewsRes.data);
          } catch (reviewErr) {
            console.warn("Could not fetch reviews or none exist", reviewErr);
            setReviews([]); // Default to empty if endpoint fails or returns 404
          }
        }
      } catch (error) {
        console.error("Error fetching provider data", error);
        toast({ 
            variant: "destructive", 
            title: "Data Error", 
            description: "Could not retrieve your profile information." 
        });
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, [user, toast]);

  // 2. Run AI Analysis
  const handleVerification = async () => {
    if (!providerProfile) return;

    setAnalyzing(true);
    setResult(null);

    // Format data for the AI prompt
    const reviewTexts = reviews.map(r => r.comment);
    const profileDataString = `
      Name: ${providerProfile.name}
      Bio: ${providerProfile.bio || 'N/A'}
      Skills: ${providerProfile.skills.join(', ')}
      Experience: ${providerProfile.experience} years
      Rate: ${providerProfile.rate}
      City: ${providerProfile.city}
      Rating: ${providerProfile.rating} (${providerProfile.reviewCount} reviews)
    `.trim();

    try {
        // Call the Server Action (Genkit flow)
        const analysisResult = await analyzeProviderData({
            profileData: profileDataString,
            reviews: reviewTexts,
        });
        setResult(analysisResult);
    } catch (error) {
        console.error('Verification failed:', error);
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "Something went wrong while analyzing your profile."
        });
    } finally {
        setAnalyzing(false);
    }
  };
  
  if (user?.role !== 'provider') {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>This feature is available for providers only.</CardDescription>
            </CardHeader>
        </Card>
    );
  }

  if (fetchingData) {
      return (
          <div className="flex h-[50vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  if (!providerProfile) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Not Found</CardTitle>
                <CardDescription>
                    We couldn't find a provider profile linked to your account. Please complete your profile first.
                </CardDescription>
            </CardHeader>
        </Card>
      );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Automated Trust Verification</h1>
      <Card>
        <CardHeader>
          <CardTitle>Assess Your Profile's Credibility</CardTitle>
          <CardDescription>
            Our AI tool will analyze your profile and reviews for inconsistencies or potential signs of fraudulent activity. This helps build trust with customers.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <div className="rounded-md bg-muted p-4 text-sm w-full">
            <p className="font-semibold mb-2">Data to be analyzed:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Profile details (Bio, Skills, Experience, Rate)</li>
                <li>{reviews.length} Customer Reviews</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            Click the button below to start the analysis. This process may take a moment.
          </p>
          <Button onClick={handleVerification} disabled={analyzing}>
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Start Verification'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.flagged ? "border-destructive" : "border-green-500"}>
            <CardHeader>
                <CardTitle>Analysis Result</CardTitle>
            </CardHeader>
            <CardContent>
                {result.flagged ? (
                    <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Profile Flagged</AlertTitle>
                        <AlertDescription className="mt-2">
                            {result.flaggingReason}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert className="border-green-500 text-green-700 [&>svg]:text-green-700">
                        <ShieldCheck className="h-4 w-4" />
                        <AlertTitle>Profile Looks Good!</AlertTitle>
                        <AlertDescription className="mt-2">
                            Our analysis did not find any significant inconsistencies or potential issues. Keep up the great work!
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}