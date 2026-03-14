"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { StarRating } from "@/components/star-rating";

// 1. Added radiusKm to the Filters type to support our new GeoJSON search
export type Filters = {
  city: string;
  priceRange: [number, number];
  minRating: number;
  radiusKm: number; 
};

type FiltersSidebarProps = {
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
  cities: string[];
};

export function FiltersSidebar({ filters, onFilterChange, cities }: FiltersSidebarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* City Filter */}
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Select
            value={filters.city}
            onValueChange={(value) => onFilterChange({ city: value === "all" ? "" : value })}
          >
            <SelectTrigger id="city">
              <SelectValue placeholder="Select a city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* NEW: Radius Slider for Location Search */}
        <div className="space-y-2">
          <Label>Search Radius ({filters.radiusKm} km)</Label>
          <Slider
            min={1}
            max={50}
            step={1}
            value={[filters.radiusKm || 10]}
            onValueChange={(value) => onFilterChange({ radiusKm: value[0] })}
            className="pt-2"
          />
        </div>

        {/* UPDATED: True Two-Way Price Range Slider */}
        <div className="space-y-2">
          <Label>Price Range (₹{filters.priceRange[0]} - ₹{filters.priceRange[1]})</Label>
          <Slider
            min={100}
            max={5000}
            step={50}
            // Passing both min and max creates a double-thumb slider
            value={filters.priceRange} 
            onValueChange={(value) => onFilterChange({ priceRange: [value[0], value[1]] })}
            className="pt-2"
          />
        </div>

        {/* Rating Filter */}
        <div className="space-y-2">
          <Label>Minimum Rating</Label>
          <div className="flex justify-center pt-2">
             <StarRating 
                rating={filters.minRating} 
                onRatingChange={(rating) => onFilterChange({ minRating: rating })}
                totalStars={5}
                interactive
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}