"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServiceCard } from "@/components/service-card";
import { serviceCategories } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Search } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/services?query=${searchQuery.trim()}`);
    }
  };

  return (
    <div className="flex flex-col gap-16">
      <section className="relative h-[500px] w-full">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 text-center text-white">
          <h1 className="text-5xl font-bold font-headline md:text-7xl">
            Find Trusted Help, Instantly.
          </h1>
          <p className="max-w-2xl text-lg md:text-xl">
            From plumbing to cleaning, connect with verified professionals in your area.
          </p>
          <form
            onSubmit={handleSearch}
            className="mt-4 flex w-full max-w-xl items-center space-x-2 rounded-full bg-white p-2 shadow-lg"
          >
            <Input
              type="text"
              placeholder="What service do you need?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow border-none bg-transparent text-base text-foreground ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-label="Search for services"
            />
            <Button type="submit" size="icon" className="rounded-full bg-accent hover:bg-accent/90">
              <Search className="h-5 w-5 text-white" />
              <span className="sr-only">Search</span>
            </Button>
          </form>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-4xl font-bold font-headline">Popular Services</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {serviceCategories.slice(0, 6).map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>
    </div>
  );
}
