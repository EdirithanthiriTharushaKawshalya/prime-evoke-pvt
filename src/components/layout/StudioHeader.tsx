import { Button } from "@/components/ui/button";
import Link from "next/link";
// import { titleCase } from "@/lib/utils"; // We'll use a helper to format the name nicely

// The component now accepts a "studioId" prop
export function StudioHeader({ studioId }: { studioId: string }) {
  // Replace hyphens with spaces and capitalize the words for the display title
  const studioName = studioId.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <header className="py-4 px-6 md:px-12 border-b sticky top-0 bg-background/95 backdrop-blur z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href={`/${studioId}`} className="text-lg font-bold">
          {studioName}
        </Link>
        <nav className="hidden md:flex gap-6 items-center">
          <Link href={`/${studioId}/portfolio`} className="text-sm text-muted-foreground hover:text-foreground">
            Portfolio
          </Link>
          <Link href={`/${studioId}/services`} className="text-sm text-muted-foreground hover:text-foreground">
            Services
          </Link>
          <Link href={`/${studioId}/about`} className="text-sm text-muted-foreground hover:text-foreground">
            About
          </Link>
        </nav>
        <Button asChild>
          <Link href={`/${studioId}/book`}>Book Now</Link>
        </Button>
      </div>
    </header>
  );
}