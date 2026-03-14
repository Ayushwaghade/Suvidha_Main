"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Briefcase, Plus, IndianRupee, UserCircle, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function JobBoardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Shared State
  const [loading, setLoading] = useState(true);
  
  // Seeker State
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", description: "", category: "", budget: "" });
  const [viewBidsJobId, setViewBidsJobId] = useState<string | null>(null);
  const [jobBids, setJobBids] = useState<any[]>([]);

  // Provider State
  const [openJobs, setOpenJobs] = useState<any[]>([]);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [biddingJobId, setBiddingJobId] = useState<string | null>(null);
  const [bidForm, setBidForm] = useState({ amount: "", proposal: "" });

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
        // Providers start with a basic query without GPS (can refine later)
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
    if (!newJob.title || !newJob.category) return toast({ variant: "destructive", title: "Missing fields" });
    
    // Get location to attach to the job
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
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
        }
      }, () => toast({ variant: "destructive", title: "Location required to post local jobs." }));
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
    try {
      await api.patch(`/jobs/bid/${bidId}/accept`);
      toast({ title: "Bid Accepted!", description: "A booking has been automatically created in your dashboard." });
      setViewBidsJobId(null);
      fetchData(); // Refresh jobs to show 'assigned' status
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to accept bid" });
    }
  };

  // --- PROVIDER ACTIONS ---
  const handleFindNearMe = () => {
    setGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await api.get(`/jobs/explore?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radiusKm=15`);
          setOpenJobs(res.data);
          toast({ title: "Location Found", description: "Showing jobs within 15km." });
        } catch (err) {
          toast({ variant: "destructive", title: "Error finding jobs" });
        } finally {
          setGettingLocation(false);
        }
      });
    }
  };

  const handleSubmitBid = async () => {
    if (!bidForm.amount || !bidForm.proposal) return toast({ variant: "destructive", title: "Please fill all fields" });
    try {
      await api.post('/jobs/bid', {
        jobId: biddingJobId,
        amount: Number(bidForm.amount),
        proposal: bidForm.proposal
      });
      toast({ title: "Bid Placed!", description: "The seeker will review your proposal." });
      setBiddingJobId(null);
      setBidForm({ amount: "", proposal: "" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Bid failed", description: err.response?.data?.msg || "Error placing bid." });
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
              <h1 className="text-3xl font-bold font-headline">My Job Posts</h1>
              <p className="text-muted-foreground">Manage your custom requests and review incoming bids.</p>
            </div>
            <Button onClick={() => setIsPosting(true)}><Plus className="mr-2 h-4 w-4" /> Post New Job</Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myJobs.length === 0 ? (
              <p className="text-muted-foreground col-span-full">You haven't posted any jobs yet.</p>
            ) : (
              myJobs.map(job => (
                <Card key={job._id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>{job.status}</Badge>
                    </div>
                    <CardDescription>{job.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-foreground line-clamp-3 mb-4">{job.description}</p>
                    <div className="flex items-center text-primary font-bold">
                      <IndianRupee className="h-4 w-4 mr-1" /> {job.budget ? job.budget : 'Open Budget'}
                    </div>
                  </CardContent>
                  <CardFooter>
                    {job.status === 'open' ? (
                      <Button className="w-full" variant="outline" onClick={() => handleViewBids(job._id)}>
                        View Bids
                      </Button>
                    ) : (
                      <Button className="w-full" disabled variant="secondary">Job Assigned</Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>

          {/* Post Job Modal */}
          <Dialog open={isPosting} onOpenChange={setIsPosting}>
            <DialogContent>
              <DialogHeader><DialogTitle>Post a Custom Job</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Job Title (e.g. Paint my living room)" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} />
                <Input placeholder="Category (e.g. Painting, Plumbing)" value={newJob.category} onChange={e => setNewJob({...newJob, category: e.target.value})} />
                <Input type="number" placeholder="Estimated Budget (₹)" value={newJob.budget} onChange={e => setNewJob({...newJob, budget: e.target.value})} />
                <Textarea placeholder="Describe exactly what you need done..." rows={4} value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} />
                <Button className="w-full" onClick={handlePostJob}>Publish Job to Local Providers</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* View Bids Modal */}
          <Dialog open={!!viewBidsJobId} onOpenChange={(open) => !open && setViewBidsJobId(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Incoming Bids</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {jobBids.length === 0 ? <p className="text-center text-muted-foreground py-8">No bids yet. Check back later!</p> : (
                  jobBids.map(bid => (
                    <Card key={bid._id} className="border-primary/20">
                      <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <UserCircle className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold">{bid.providerId?.name || "Unknown Provider"}</span>
                            <span className="text-sm text-yellow-600 flex items-center"><Star className="h-3 w-3 mx-1 fill-yellow-500" /> {bid.providerId?.rating?.toFixed(1) || "New"}</span>
                          </div>
                          <p className="text-sm italic text-muted-foreground">"{bid.proposal}"</p>
                        </div>
                        <div className="flex flex-col items-end justify-center gap-2 min-w-[120px]">
                          <span className="text-lg font-bold text-primary">₹{bid.amount}</span>
                          <Button size="sm" onClick={() => handleAcceptBid(bid._id)}>Accept Bid</Button>
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
              <h1 className="text-3xl font-bold font-headline">Local Job Board</h1>
              <p className="text-muted-foreground">Browse open requests from clients near you and pitch your services.</p>
            </div>
            <Button onClick={handleFindNearMe} disabled={gettingLocation} variant="secondary">
              {gettingLocation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              Find Jobs Near Me
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {openJobs.length === 0 ? (
              <p className="text-muted-foreground col-span-full">No open jobs found in your area right now.</p>
            ) : (
              openJobs.map(job => (
                <Card key={job._id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">Posted by {job.seekerId?.name || 'Unknown'}</p>
                      </div>
                      <Badge variant="outline">{job.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <p className="text-sm text-foreground line-clamp-3">{job.description}</p>
                    <div className="flex justify-between text-sm items-center">
                      <span className="flex items-center text-primary font-bold"><IndianRupee className="h-4 w-4 mr-1" /> {job.budget ? job.budget : 'Open'}</span>
                      <span className="text-muted-foreground">{formatDistanceToNow(new Date(job.createdAt), {addSuffix: true})}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={() => setBiddingJobId(job._id)}>
                      <Briefcase className="mr-2 h-4 w-4" /> Place Bid
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>

          {/* Place Bid Modal */}
          <Dialog open={!!biddingJobId} onOpenChange={(open) => !open && setBiddingJobId(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Submit Your Proposal</DialogTitle><DialogDescription>Pitch your service and quote your price for this job.</DialogDescription></DialogHeader>
              <div className="space-y-4">
                <Input type="number" placeholder="Your Quote (₹)" value={bidForm.amount} onChange={e => setBidForm({...bidForm, amount: e.target.value})} />
                <Textarea placeholder="Why should they hire you? Detail your approach..." rows={4} value={bidForm.proposal} onChange={e => setBidForm({...bidForm, proposal: e.target.value})} />
                <Button className="w-full" onClick={handleSubmitBid}>Send Proposal</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}