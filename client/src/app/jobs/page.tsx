"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Briefcase, Plus, IndianRupee, Star, Phone, MessageSquare, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function JobBoardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Shared State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // Prevents double-clicks
  
  // Seeker State
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", description: "", category: "", budget: "" });
  const [viewBidsJobId, setViewBidsJobId] = useState<string | null>(null);
  const [jobBids, setJobBids] = useState<any[]>([]);
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);

  // Provider State
  const [openJobs, setOpenJobs] = useState<any[]>([]);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [biddingJobId, setBiddingJobId] = useState<string | null>(null);
  const [bidForm, setBidForm] = useState({ amount: "", proposal: "", phone: "" });

  // Sync Phone Number state whenever user profile loads/updates
  useEffect(() => {
    if (user?.phone) {
      setBidForm(prev => ({ ...prev, phone: user.phone }));
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (user?.role === 'seeker') {
        const res = await api.get('/jobs/my-jobs');
        setMyJobs(res.data);
      } else if (user?.role === 'provider') {
        const res = await api.get('/jobs/explore');
        setOpenJobs(res.data);
      }
    } catch (error) {
      console.error("Error fetching jobs", error);
    } finally {
      setLoading(false);
    }
  };

  // --- SEEKER ACTIONS ---
  const handlePostJob = () => {
    if (!newJob.title || !newJob.category || !newJob.budget) {
        return toast({ variant: "destructive", title: "Missing fields" });
    }
    
    setSubmitting(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
            try {
              const payload = {
                ...newJob,
                budget: Number(newJob.budget),
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              };
              const res = await api.post('/jobs', payload);
              setMyJobs([res.data, ...myJobs]);
              setIsPosting(false);
              setNewJob({ title: "", description: "", category: "", budget: "" });
              toast({ title: "Job Posted!", description: "Local providers can now bid on your job." });
            } catch (err) {
              toast({ variant: "destructive", title: "Error posting job" });
            } finally {
                setSubmitting(false);
            }
        }, 
        (err) => {
            setSubmitting(false);
            toast({ variant: "destructive", title: "Location Required", description: "Please enable GPS to post a local job request." });
        },
        { timeout: 10000 }
      );
    } else {
        setSubmitting(false);
        toast({ variant: "destructive", title: "Unsupported", description: "Browser doesn't support geolocation." });
    }
  };

  const handleViewBids = async (jobId: string) => {
    setViewBidsJobId(jobId);
    try {
      const res = await api.get(`/jobs/${jobId}/bids`);
      setJobBids(res.data);
    } catch (err) {
      toast({ variant: "destructive", title: "Could not load bids" });
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!user?.phone) {
        return toast({ 
            variant: "destructive", 
            title: "Update Profile", 
            description: "Please add a phone number to your profile settings before hiring." 
        });
    }

    setAcceptingBidId(bidId);
    try {
      await api.patch(`/jobs/bid/${bidId}/accept`, { phone: user.phone });
      toast({ title: "Hired!", description: "Booking created. Check your dashboard." });
      setViewBidsJobId(null);
      fetchData(); 
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.msg || "Action failed." });
    } finally {
        setAcceptingBidId(null);
    }
  };

  // --- PROVIDER ACTIONS ---
  const handleFindNearMe = () => {
    setGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
            try {
              const res = await api.get(`/jobs/explore?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radiusKm=15`);
              setOpenJobs(res.data);
              toast({ title: "Search Updated", description: "Showing jobs within 15km of you." });
            } catch (err) {
              toast({ variant: "destructive", title: "Search failed" });
            } finally {
              setGettingLocation(false);
            }
        },
        () => {
            setGettingLocation(false);
            toast({ variant: "destructive", title: "GPS Error", description: "Couldn't access your location." });
        },
        { timeout: 10000 }
      );
    }
  };

  const handleSubmitBid = async () => {
    if (!bidForm.amount || !bidForm.proposal || !bidForm.phone) {
        return toast({ variant: "destructive", title: "All fields required" });
    }

    setSubmitting(true);
    try {
      await api.post('/jobs/bid', {
        jobId: biddingJobId,
        amount: Number(bidForm.amount),
        proposal: bidForm.proposal,
        phone: bidForm.phone
      });
      toast({ title: "Bid Sent", description: "The client will be notified." });
      setBiddingJobId(null);
      setBidForm({ ...bidForm, amount: "", proposal: "" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Submission failed", description: err.response?.data?.msg });
    } finally {
        setSubmitting(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Please log in.</div>;
  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* ----------------- SEEKER VIEW ----------------- */}
      {user.role === 'seeker' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black font-headline tracking-tight">Marketplace Activity</h1>
              <p className="text-muted-foreground">Manage your custom requests and hire local experts.</p>
            </div>
            <Button onClick={() => setIsPosting(true)} className="font-bold shadow-sm"><Plus className="mr-2 h-4 w-4" /> New Job Request</Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myJobs.length === 0 ? (
              <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                  <p className="text-muted-foreground">You haven't posted any jobs yet. Start by clicking "New Job Request".</p>
              </div>
            ) : (
              myJobs.map(job => (
                <Card key={job._id} className="flex flex-col border-primary/10 hover:shadow-md transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl font-headline leading-none">{job.title}</CardTitle>
                      <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="capitalize">{job.status}</Badge>
                    </div>
                    <Badge variant="outline" className="w-fit mt-2 bg-primary/[0.03]">{job.category}</Badge>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-foreground/70 line-clamp-2 mb-4 leading-relaxed">{job.description}</p>
                    <div className="flex items-center text-primary font-black text-lg">
                      <IndianRupee className="h-4 w-4 mr-0.5" /> {job.budget || 'Open Budget'}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 bg-muted/50 rounded-b-xl">
                    {job.status === 'open' ? (
                      <Button className="w-full font-bold" variant="outline" onClick={() => handleViewBids(job._id)}>
                        Review Bids ({job.bidCount || 0})
                      </Button>
                    ) : (
                      <Button className="w-full" disabled variant="secondary">Assigned to Provider</Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>

          <Dialog open={isPosting} onOpenChange={setIsPosting}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader><DialogTitle className="text-2xl font-headline">What do you need help with?</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5"><label className="text-sm font-bold">Headline</label><Input placeholder="e.g. Need a Sofa Deep Clean" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-bold">Category</label><Input placeholder="e.g. Cleaning" value={newJob.category} onChange={e => setNewJob({...newJob, category: e.target.value})} /></div>
                    <div className="space-y-1.5"><label className="text-sm font-bold">Max Budget (₹)</label><Input type="number" placeholder="500" value={newJob.budget} onChange={e => setNewJob({...newJob, budget: e.target.value})} /></div>
                </div>
                <div className="space-y-1.5"><label className="text-sm font-bold">Details</label><Textarea placeholder="Describe the job, size of the area, and tools required..." rows={4} value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} /></div>
                <Button className="w-full h-12 text-lg font-bold" onClick={handlePostJob} disabled={submitting}>
                    {submitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Publish to Marketplace"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={!!viewBidsJobId} onOpenChange={(open) => !open && setViewBidsJobId(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader className="flex flex-row items-center justify-between">
                <DialogTitle className="text-2xl font-headline">Offers From Experts</DialogTitle>
                <Button variant="ghost" size="icon" onClick={() => viewBidsJobId && handleViewBids(viewBidsJobId)}><RefreshCw className="h-4 w-4" /></Button>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {jobBids.length === 0 ? <p className="text-center text-muted-foreground py-12 italic border rounded-xl">No bids yet. Local providers will see your post soon.</p> : (
                  jobBids.map(bid => (
                    <Card key={bid._id} className="border-primary/20 hover:border-primary/40 transition-colors">
                      <CardContent className="p-5 flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-primary/20"><AvatarFallback className="bg-primary/5 text-primary">{bid.providerId?.name?.charAt(0)}</AvatarFallback></Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg">{bid.providerId?.name || "Provider"}</span>
                                    <Badge variant="secondary" className="h-5 flex items-center bg-yellow-50 text-yellow-700 border-none px-1.5"><Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" /> {bid.providerId?.rating?.toFixed(1) || "New"}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Phone className="h-3 w-3" /> {bid.phone || "Contact Shared on Hire"}</p>
                            </div>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-lg border-l-4 border-l-primary/30 italic text-sm text-foreground/80 leading-relaxed relative">
                             <MessageSquare className="h-3 w-3 absolute -top-1.5 -left-1.5 text-primary opacity-40" />
                             "{bid.proposal}"
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-center gap-3 min-w-[140px] border-l pl-6">
                          <div className="text-right"><p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Quote</p><p className="text-2xl font-black text-primary">₹{bid.amount}</p></div>
                          <Button 
                            size="sm" 
                            className="w-full font-bold h-10" 
                            onClick={() => handleAcceptBid(bid._id)}
                            disabled={acceptingBidId === bid._id}
                          >
                            {acceptingBidId === bid._id ? <Loader2 className="animate-spin h-4 w-4" /> : "Hire Now"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ----------------- PROVIDER VIEW ----------------- */}
      {user.role === 'provider' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black font-headline tracking-tight">Open Jobs Dashboard</h1>
              <p className="text-muted-foreground">Find local clients and submit your service proposals.</p>
            </div>
            <Button onClick={handleFindNearMe} disabled={gettingLocation} variant="outline" className="border-primary text-primary hover:bg-primary/5 h-12 px-6 font-bold">
              {gettingLocation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              Refresh Jobs Near Me
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {openJobs.length === 0 ? (
              <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl bg-muted/10">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">No open jobs found in your area. Try refreshing with GPS.</p>
              </div>
            ) : (
              openJobs.map(job => (
                <Card key={job._id} className="flex flex-col hover:border-primary/40 transition-all hover:shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-headline leading-tight">{job.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">Client: {job.seekerId?.name || 'User'}</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-none px-2 shrink-0">{job.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <p className="text-sm text-foreground/70 line-clamp-3 leading-relaxed">{job.description}</p>
                    <div className="flex justify-between text-sm items-center pt-2">
                      <span className="flex items-center text-primary font-black text-xl"><IndianRupee className="h-4 w-4" /> {job.budget || 'Open'}</span>
                      <span className="text-[10px] uppercase font-black text-muted-foreground bg-muted px-2 py-1 rounded">{formatDistanceToNow(new Date(job.createdAt), {addSuffix: true})}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 pt-4 rounded-b-xl border-t">
                    <Button className="w-full font-bold h-11" onClick={() => setBiddingJobId(job._id)}>Submit Bid Proposal</Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>

          <Dialog open={!!biddingJobId} onOpenChange={(open) => !open && setBiddingJobId(null)}>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader><DialogTitle className="text-2xl font-headline">Create Your Proposal</DialogTitle><DialogDescription>Propose your best price and timeline to secure this job.</DialogDescription></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-bold">Your Quote (₹)</label><Input type="number" placeholder="500" value={bidForm.amount} onChange={e => setBidForm({...bidForm, amount: e.target.value})} className="h-11" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-bold">Contact Phone</label><Input placeholder="Mobile number" value={bidForm.phone} onChange={e => setBidForm({...bidForm, phone: e.target.value})} className="h-11" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-sm font-bold">Proposal Pitch</label><Textarea placeholder="Briefly describe how you will handle this job..." rows={5} value={bidForm.proposal} onChange={e => setBidForm({...bidForm, proposal: e.target.value})} className="resize-none" /></div>
                <Button className="w-full h-14 text-lg font-black shadow-lg" onClick={handleSubmitBid} disabled={submitting}>
                    {submitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Send Proposal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}