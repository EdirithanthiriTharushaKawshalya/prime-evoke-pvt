// components/layout/Footer.tsx
import Link from "next/link";
import { Settings } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-6 px-6 md:px-12 border-t mt-auto relative">
      <div className="container mx-auto text-center text-muted-foreground text-sm">
        <p>© {currentYear} Prime Evoke Private Limited. All Rights Reserved.</p>

        {/* Updated Link: Points to /admin now */}
        <Link
          href="/admin" 
          aria-label="Admin Dashboard"
          className="absolute bottom-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </footer>
  );
}