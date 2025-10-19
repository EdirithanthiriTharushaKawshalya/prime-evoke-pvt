import Link from "next/link";
import { getStudioData } from "@/lib/data";
import { ArrowRight } from "lucide-react"; // 1. Import an icon for the link

export async function StudioFooter({ studioId }: { studioId: string }) {
  const currentYear = new Date().getFullYear();
  const studioData = await getStudioData(studioId);

  // 2. Updated the list of services
  const serviceLinks = [
    { name: "Portraits", href: `/${studioId}/services` },
    { name: "Weddings", href: `/${studioId}/services` },
    { name: "Events", href: `/${studioId}/services` },
    { name: "Birthdays", href: `/${studioId}/services` },
  ];

  return (
    <footer className="border-t border-white/10 mt-auto">
      <div className="container mx-auto px-6 py-16">
        {/* --- Main Footer Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Column 1: Studio Info (Dynamic) */}
          <div>
            <h3 className="text-2xl font-bold mb-4">{studioData.name}</h3>
            <p className="text-muted-foreground max-w-xs">
              {studioData.hero_description}
            </p>
          </div>

          {/* Column 2: Our Services (Updated) */}
          <div>
            <h4 className="font-semibold uppercase tracking-wider mb-4">
              Our Services
            </h4>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* 3. Added the new link to the packages page */}
            <Link 
              href={`/${studioId}/services`} 
              className="flex items-center gap-2 font-semibold text-white hover:underline mt-4"
            >
              See our packages
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Column 3: Contact (Static) */}
          <div>
            <h4 className="font-semibold uppercase tracking-wider mb-4">
              Contact
            </h4>
            <div className="text-muted-foreground space-y-2">
              <p className="font-bold text-white">{studioData.name}</p>
              <p>No.2, Sri Medananda Road, </p>
              <p>Ambalangoda, Sri Lanka.</p>
              <p className="pt-2">
                <span className="font-semibold text-white">Phone:</span> 0777 16 46 00
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Sub-Footer (Copyright) --- */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-6 text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center">
          <p>
            © {currentYear} {studioData.name}. All Rights Reserved. Part of{" "}
            <Link href="/" className="underline hover:text-white">
              Prime Evoke Private Limited
            </Link>
            .
          </p>
          <p className="mt-2 md:mt-0">
            Designed and developed by Tharusha Kawshalya
          </p>
        </div>
      </div>
    </footer>
  );
}