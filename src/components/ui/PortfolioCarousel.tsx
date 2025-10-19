"use client"; // This component is interactive, so it must be a client component

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PortfolioCard } from "./PortfolioCard";
import { PortfolioItem } from "@/lib/types";

// This component receives the portfolio items as a "prop"
export function PortfolioCarousel({ items }: { items: PortfolioItem[] }) {
  return (
    <div className="relative w-full">
      <Carousel
        opts={{
          align: "start",
          loop: true, // Make the carousel loop infinitely
        }}
        className="w-full"
      >
        <CarouselContent>
          {items.map((item) => (
            <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                {/* We are reusing the PortfolioCard component we already built! */}
                <PortfolioCard item={item} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* These are the navigation buttons */}
        <CarouselPrevious className="absolute left-[-20px] top-1/2 -translate-y-1/2 hidden md:inline-flex" />
        <CarouselNext className="absolute right-[-20px] top-1/2 -translate-y-1/2 hidden md:inline-flex" />
      </Carousel>
    </div>
  );
}