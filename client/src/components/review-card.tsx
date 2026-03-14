import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function ReviewCard({ review }: { review: any }) {
  // 1. Safely extract the populated user data
  const seeker = review.seekerId || {};
  const reviewerName = seeker.name || "Anonymous";
  const reviewerAvatar = seeker.avatarUrl;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 flex gap-4">
        <Avatar>
          <AvatarImage src={reviewerAvatar} alt={reviewerName} />
          {/* 2. Safely grab the first letter of the fallback name */}
          <AvatarFallback>{reviewerName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{reviewerName}</p>
            <span className="text-xs text-muted-foreground">
              {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : 'Recently'}
            </span>
          </div>
          <div className="flex items-center mt-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted/30"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-foreground">{review.comment}</p>
        </div>
      </CardContent>
    </Card>
  );
}