import Link from "next/link";
import Image from "next/image";
import type { ServiceProvider } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

type ProviderCardProps = {
  provider: ServiceProvider;
};

export function ProviderCard({ provider }: ProviderCardProps) {
  // Extract unique categories from offeredServices for the badges
  const categories = Array.from(new Set(provider.offeredServices?.map(s => s.category) || []));
  
  // Find the lowest price among their services to show "Starts at"
  const startingPrice = provider.offeredServices?.length > 0 
    ? Math.min(...provider.offeredServices.map(s => s.price)) 
    : 0;

  return (
    <Link href={`/provider/${provider._id}`} className="group block h-full">
        <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <CardHeader>
            <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/50">
                <AvatarImage src={provider.avatarUrl} alt={provider.name} />
                <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-xl font-headline">{provider.name}</CardTitle>
                <CardDescription>{provider.city}</CardDescription>
            </div>
            </div>
        </CardHeader>
        <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-2">{provider.bio}</p>
            <div className="mt-4 flex flex-wrap gap-2">
            {categories.slice(0, 3).map((category) => (
                <Badge key={category} variant="secondary">{category}</Badge>
            ))}
            </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-1 font-semibold">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{provider.rating?.toFixed(1) || "0.0"}</span>
                <span className="font-normal text-muted-foreground">({provider.reviewCount || 0} reviews)</span>
            </div>
            <div className="font-bold text-lg text-primary">
            {startingPrice > 0 ? (
              <>Starts at Rs. {startingPrice}</>
            ) : (
              <>Price varies</>
            )}
            </div>
        </CardFooter>
        </Card>
    </Link>
  );
}