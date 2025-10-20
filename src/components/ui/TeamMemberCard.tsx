import { TeamMember } from "@/lib/types"; // Make sure you define this type in types.ts
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Dialog, // Import the main Dialog component
} from "@/components/ui/dialog";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import ReactMarkdown from 'react-markdown';

// Assuming you'll fetch the image URL here (make it async)
// Or pass the URL as a prop if fetching on the page
export async function TeamMemberCard({ member }: { member: TeamMember }) {
  let imageUrl = "/placeholder-avatar.png"; // Default placeholder
  if (member.image_url) {
    const { data } = supabase.storage
      .from("studio-images") // Verify this is your correct bucket name
      .getPublicUrl(member.image_url); // Uses the path from the database
    if (data?.publicUrl) imageUrl = data.publicUrl;
  }

  return (
    // Wrap everything in the Dialog component for context
    <Dialog>
      <DialogTrigger asChild>
        {/* Add h-full to the Card component for consistent height */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
          <CardHeader className="flex flex-col items-center text-center pt-6">
            <Image
              src={imageUrl}
              alt={member.name}
              width={200}
              height={200}
              className="rounded-full mb-4 object-cover mx-auto" // Centered image
            />
            <CardTitle className="text-lg">{member.name}</CardTitle>
            <p className="text-sm text-muted-foreground px-2">{member.position}</p>
            {/* Display primary employment if available */}
            {member.primary_employment && (
                 <p className="text-xs text-muted-foreground/80 pt-1 px-2">({member.primary_employment})</p>
            )}
          </CardHeader>
        </Card>
      </DialogTrigger>

     <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
        {/* --- THIS IS THE PART TO CHANGE --- */}
        <DialogHeader className="items-center text-center pt-4"> {/* Added centering and padding */}
          {/* 1. Moved Image above the text and made it larger */}
          <Image
            src={imageUrl}
            alt={member.name}
            width={120} // Increased size
            height={120} // Increased size
            className="rounded-full object-cover mb-4" // Added margin-bottom
          />
          {/* 2. Text section is now below the image */}
          <div>
            <DialogTitle className="text-2xl">{member.name}</DialogTitle>
            <DialogDescription>{member.position}</DialogDescription>
          </div>
        </DialogHeader>
        {/* Body of the modal */}
        <div className="py-4 space-y-4 text-sm">
          {member.primary_employment && (
            <p>
              <strong>Primary Role:</strong>{" "}
              <span className="text-muted-foreground">{member.primary_employment}</span>
            </p>
          )}
          {member.degrees && member.degrees.length > 0 && (
            <div>
              <p>
                <strong>Qualifications:</strong>
              </p>
              <ul className="list-disc list-inside text-muted-foreground pl-4">
                {member.degrees.map((degree) => (
                  <li key={degree}>{degree}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Render the bio using ReactMarkdown */}
          {member.bio && (
            <div className="text-muted-foreground leading-relaxed space-y-2">
              <ReactMarkdown
                components={{ // Optional: Customize paragraph styling if needed
                  p: ({node, ...props}) => <p className="mb-2" {...props} />
                }}
              >
                {member.bio}
              </ReactMarkdown>
            </div>
          )}
          {/* Optional: Add LinkedIn link here if available */}
          {member.linkedin_url && (
            <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              View LinkedIn Profile
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog> // Close the main Dialog component
  );
}