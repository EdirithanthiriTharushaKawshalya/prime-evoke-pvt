import Link from "next/link";

// The component now accepts the "studioId" prop
export function StudioFooter({ studioId }: { studioId: string }) {
  const currentYear = new Date().getFullYear();

  // Convert the URL slug (e.g., "evoke-gallery") into a display name ("Evoke Gallery")
  const studioName = studioId.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <footer className="py-6 px-6 md:px-12 border-t mt-auto">
      <div className="container mx-auto text-center text-muted-foreground text-sm">
        {/* The studio name is now dynamic */}
        <p>© {currentYear} {studioName}. Part of <Link href="/" className="underline hover:text-foreground">Prime Evoke Private Limited</Link>.</p>
      </div>
    </footer>
  );
}