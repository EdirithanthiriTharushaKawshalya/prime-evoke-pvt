import Link from "next/link";
import { Settings } from "lucide-react"; // 1. Import an icon

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-6 px-6 md:px-12 border-t mt-auto relative"> {/* 2. Added relative positioning */}
      <div className="container mx-auto text-center text-muted-foreground text-sm">
        <p>© {currentYear} Prime Evoke Private Limited. All Rights Reserved.</p>

        {/* 3. Added Admin Link */}
        <Link
          href="/login" // Link to your admin login page
          aria-label="Admin Login" // For accessibility
          className="absolute bottom-4 right-4 text-muted-foreground hover:text-foreground transition-colors" // Position bottom-right
        >
          <Settings className="h-4 w-4" /> {/* Use the icon */}
        </Link>
      </div>
    </footer>
  );
}