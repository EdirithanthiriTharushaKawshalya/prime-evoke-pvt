"use client";

import * as React from "react";
// 1. Import the autoplay plugin
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function PortfolioCarousel({ items }: { items: React.ReactNode[] }) {
  // 2. Create a ref for the plugin
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true }) // Set delay to 3000ms (3 seconds)
  );

  return (
    <div className="relative w-full">
      <Carousel
        // 3. Pass the plugin to the Carousel component
        plugins={[plugin.current]}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
        // Optional: Add mouse enter/leave handlers to pause on hover
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {items.map((cardComponent, index) => (
            <CarouselItem
              key={index}
              className="md:basis-1/2 lg:basis-1/3 flex-shrink-0"
            >
              <div className="p-1">
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