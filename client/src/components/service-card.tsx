import Link from "next/link";
import Image from "next/image";
import type { ServiceCategory } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

type ServiceCardProps = {
  service: ServiceCategory;
};

export function ServiceCard({ service }: ServiceCardProps) {
  const Icon = service.icon;
  return (
    <Link href={`/services?category=${service.name.toLowerCase()}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="relative h-48 w-full">
          <Image
            src={service.image}
            alt={service.name}
            data-ai-hint={service.imageHint}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
             <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <Icon className="h-6 w-6 text-white" />
             </div>
             <h3 className="text-2xl font-bold font-headline text-white">{service.name}</h3>
          </div>
        </div>
        <CardContent className="p-4 bg-card">
            <div className="flex items-center justify-between text-primary">
                <span className="text-sm font-semibold">Explore services</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
        </CardContent>
      </Card>
    </Link>
  );
}
