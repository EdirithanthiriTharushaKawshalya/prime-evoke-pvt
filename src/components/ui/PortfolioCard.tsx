import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { PortfolioItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react"; // 👈 Import a new icon

export async function PortfolioCard({ item }: { item: PortfolioItem }) {
  let publicImageUrl = "/placeholder.jpg"; 

  if (item.thumbnail_url) {
    const { data } = supabase.storage
      .from("portfolio-thumbnails")
      .getPublicUrl(item.thumbnail_url);
    
    if (data?.publicUrl) {
      publicImageUrl = data.publicUrl;
    }
  }

  return (
    // The whole card is a link to the Facebook post
    <a
      href={item.facebook_post_url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group block" // 👈 Changed to "block"
    >
      <Card className="overflow-hidden h-full flex flex-col rounded-2xl shadow-lg transition-transform duration-300 group-hover:-translate-y-1">
        
        {/* --- Image Section --- */}
        <CardContent className="p-0 relative">
          <Image
            src={publicImageUrl}
            alt={item.title}
            width={600}
            height={400}
            className="object-cover w-full h-64" // 👈 Fixed height for consistency
          />

          {/* Category Tag */}
          <div className="absolute top-4 left-4 bg-white/90 text-gray-900 rounded-full px-3 py-1 text-sm font-semibold">
            {item.category}
          </div>

          {/* View Full Event Overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm text-white rounded-full px-4 py-2 transition-all duration-300 group-hover:bg-black/60">
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm font-medium">View Full Event</span>
            </div>
          </div>
        </CardContent>

        {/* --- Content Section --- */}
        <div className="p-6">
          <h3 className="font-semibold text-xl mb-1">{item.title}</h3>
          <p className="text-muted-foreground">{item.description}</p>
        </div>
      </Card>
    </a>
  );
}