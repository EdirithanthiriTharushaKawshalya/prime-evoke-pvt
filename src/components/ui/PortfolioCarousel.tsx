"use client"; // This component is interactive

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// This component now accepts an array of already-rendered components
export function PortfolioCarousel({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="relative w-full">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {/* We map over the array of components and render them */}
          {items.map((cardComponent, index) => ( // 👈 Use 'index' here
            <CarouselItem 
              key={index} // 👈 Change key to 'index'
              className="md:basis-1/2 lg:basis-1/3 flex-shrink-0"
            >
              <div className="p-1">
                {/* Render the component that was passed in */}
                {cardComponent}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-[-20px] top-1/2 -translate-y-1/2 hidden md:inline-flex" />
        <CarouselNext className="absolute right-[-20px] top-1/2 -translate-y-1/2 hidden md:inline-flex" />
      </Carousel>
    </div>
  );
}