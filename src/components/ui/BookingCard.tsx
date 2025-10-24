// components/ui/BookingCard.tsx - Full updated file
"use client";

import { useState } from "react";
import { Booking } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Mail, Calendar, User, Package, Building, Phone, Camera } from "lucide-react";
import { UpdateBookingStatus } from "./UpdateBookingStatus";
import { AssignPhotographers } from "./AssignPhotographers";
import { DeleteBookingButton } from "./DeleteBookingButton";
import { EditBookingDialog } from "./EditBookingDialog";

interface BookingCardProps {
  booking: Booking;
  userRole: string;
  availableStaff: { id: string; full_name: string }[];
}

export function BookingCard({ booking, userRole, availableStaff }: BookingCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format studio slug to readable name
  const formatStudioName = (studioSlug: string) => {
    return studioSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                {booking.full_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {booking.inquiry_id}
              </p>
            </div>
            <UpdateBookingStatus
              bookingId={booking.id}
              currentStatus={booking.status || "New"}
              userRole={userRole}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Studio Badge */}
          <div className="flex items-center gap-2 text-sm">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Studio:</span>
            <Badge variant="secondary" className="text-xs">
              {formatStudioName(booking.studio_slug)}
            </Badge>
          </div>

          {/* Email */}
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Email:</span>
            <a
              href={`mailto:${booking.email}`}
              className="text-blue-600 hover:underline"
            >
              {booking.email}
            </a>
          </div>

          {/* Mobile Number */}
          {booking.mobile_number && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Mobile:</span>
              <a
                href={`tel:${booking.mobile_number}`}
                className="text-blue-600 hover:underline"
              >
                {booking.mobile_number}
              </a>
            </div>
          )}

          {/* Event Date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Event Date:</span>
            <span>{formatDate(booking.event_date)}</span>
          </div>

          {/* Event Type */}
          {booking.event_type && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Event Type:</span>
              <span>{booking.event_type}</span>
            </div>
          )}

          {/* Package */}
          {booking.package_name && (
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Package:</span>
              <span>{booking.package_name}</span>
            </div>
          )}

          {/* Assigned Photographers */}
          {booking.assigned_photographers &&
            booking.assigned_photographers.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Assigned Staff:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {booking.assigned_photographers.map((photographer, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {photographer}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {/* Message Preview */}
          {booking.message && (
            <div className="text-sm">
              <span className="text-muted-foreground">Message:</span>
              <p className="mt-1 line-clamp-2 text-muted-foreground">
                {booking.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {userRole === "management" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <AssignPhotographers
                  bookingId={booking.id}
                  currentAssignments={booking.assigned_photographers || []}
                  availableStaff={availableStaff}
                  userRole={userRole}
                />
                <DeleteBookingButton
                  bookingId={booking.id}
                  userRole={userRole}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {userRole === "management" && (
        <EditBookingDialog
          booking={booking}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </>
  );
}