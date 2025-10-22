import { Booking, Profile, TeamMember } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssignPhotographers } from "./AssignPhotographers";
import { UpdateStatusDropdown } from "./UpdateStatusDropdown";
import { CalendarIcon, ClockIcon, PackageIcon, HashIcon } from "lucide-react";
import { DeleteBookingButton } from "./DeleteBookingButton";

type BookingCardProps = {
  booking: Booking;
  userRole: string;
  availableStaff: { id: string; full_name: string | null }[];
};

export function BookingCard({ booking, userRole, availableStaff }: BookingCardProps) {
  // Check if the event date is in the past
  const isPastEvent = booking.event_date 
    ? new Date(booking.event_date) < new Date()
    : false;

  // Determine if booking should show as "Past" (green) automatically
  const shouldShowAsPast = isPastEvent && booking.status?.toLowerCase() !== "cancelled";

  return (
    <Card className="flex flex-col h-full bg-card/60 backdrop-blur-sm border border-white/10 shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-1 truncate">{booking.full_name}</CardTitle>
                <CardDescription className="text-xs break-all">{booking.email}</CardDescription>
                
                {/* Inquiry ID Display */}
                {booking.inquiry_id && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <HashIcon className="h-3 w-3" />
                    <span className="font-mono bg-secondary px-2 py-1 rounded text-xs">
                      {booking.inquiry_id}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Delete Button for Management */}
              {userRole === 'management' && (
                <DeleteBookingButton 
                  bookingId={booking.id}
                  inquiryId={booking.inquiry_id}
                  className="ml-2 shrink-0"
                />
              )}
            </div>
          </div>
          
          {/* Status Badge/Dropdown */}
          <div className="ml-2 shrink-0">
            <UpdateStatusDropdown
              bookingId={booking.id}
              currentStatus={booking.status}
              userRole={userRole}
              isPast={shouldShowAsPast}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 text-sm pt-0 pb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <PackageIcon className="h-4 w-4" />
          <span>{booking.package_name ?? 'N/A'} ({booking.studio_slug?.replace(/-/g, ' ') ?? 'N/A'})</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          <span>
            Event Date: {booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-GB') : 'N/A'}
            {isPastEvent && (
              <Badge variant="outline" className="ml-2 text-xs bg-red-500/20 text-red-300 border-red-500/30">
                Past Event
              </Badge>
            )}
          </span>
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
      <CardFooter className="pt-0 border-t border-white/10 pt-4">
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