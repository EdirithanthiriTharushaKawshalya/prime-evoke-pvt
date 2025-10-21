import { Booking, Profile, TeamMember } from "@/lib/types"; // Import necessary types
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssignPhotographers } from "./AssignPhotographers"; // Import assignment component
import { CalendarIcon, ClockIcon, PackageIcon, UserIcon, CameraIcon } from "lucide-react"; // Import icons

type BookingCardProps = {
  booking: Booking;
  userRole: string; // Pass role for conditional rendering
  availableStaff: { id: string; full_name: string | null }[]; // Pass staff list
};

// Helper to determine badge color based on status
const getStatusVariant = (status: string | null): "default" | "secondary" | "destructive" | "outline" => {
  switch (status?.toLowerCase()) {
    case 'new': return 'default';
    case 'confirmed': return 'secondary'; // Or maybe 'success' if you add custom variants
    case 'completed': return 'outline';
    case 'cancelled': return 'destructive';
    default: return 'secondary';
  }
};

export function BookingCard({ booking, userRole, availableStaff }: BookingCardProps) {
  return (
    <Card className="flex flex-col h-full bg-card/60 backdrop-blur-sm border border-white/10 shadow-md"> {/* Added subtle styling */}
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg mb-1">{booking.full_name}</CardTitle>
                <CardDescription className="text-xs break-all">{booking.email}</CardDescription>
            </div>
            <Badge variant={getStatusVariant(booking.status)} className="ml-2 shrink-0">
                 {booking.status ?? 'N/A'}
             </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 text-sm pt-0 pb-4"> {/* Adjusted padding */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <PackageIcon className="h-4 w-4" />
          <span>{booking.package_name ?? 'N/A'} ({booking.studio_slug?.replace('-', ' ') ?? 'N/A'})</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
           <CalendarIcon className="h-4 w-4" />
           <span>Event Date: {booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-GB') : 'N/A'}</span>
        </div>
         <div className="flex items-center gap-2 text-muted-foreground">
           <ClockIcon className="h-4 w-4" />
           <span>Submitted: {new Date(booking.created_at).toLocaleDateString('en-GB')}</span>
         </div>
        {booking.message && (
             <p className="text-xs pt-2 border-t border-white/10 text-muted-foreground italic">
                 &quot;{booking.message}&quot;
             </p>
        )}
      </CardContent>
      <CardFooter className="pt-0 border-t border-white/10 pt-4"> {/* Added padding top */}
        {/* Assignment section */}
         <div className="w-full">
             <label className="text-xs font-medium text-muted-foreground block mb-1">Assigned Staff</label>
             <AssignPhotographers
               bookingId={booking.id}
               currentAssignments={booking.assigned_photographers || []}
               userRole={userRole}
               availableStaff={availableStaff}
             />
         </div>
      </CardFooter>
    </Card>
  );
}