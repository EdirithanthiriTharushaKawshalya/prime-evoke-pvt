import { Button } from "@/components/ui/button";
import Link from "next/link";

export function StudioHeader() {
  return (
    <header className="py-4 px-6 md:px-12 border-b sticky top-0 bg-background/95 backdrop-blur z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/evoke-gallery" className="text-lg font-bold">
          Evoke Gallery
        </Link>
        <nav className="hidden md:flex gap-6 items-center">
          <Link href="/evoke-gallery/portfolio" className="text-sm text-muted-foreground hover:text-foreground">
            Portfolio
          </Link>
          <Link href="/evoke-gallery/services" className="text-sm text-muted-foreground hover:text-foreground">
            Services
          </Link>
          <Link href="/evoke-gallery/about" className="text-sm text-muted-foreground hover:text-foreground">
            About
          </Link>
        </nav>
        <Button asChild>
          <Link href="/evoke-gallery/book">Book Now</Link>
        </Button>
      </div>
    </header>
  );
}