// components/ui/BookingCard.tsx - Mobile Responsive Update
"use client";

import { useState } from "react";
import { Booking, ServicePackage } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Mail, Calendar, User, Package, Building, Phone, Camera, DollarSign } from "lucide-react";
import { UpdateBookingStatus } from "./UpdateBookingStatus";
import { AssignPhotographers } from "./AssignPhotographers";
import { AssignEditor } from "./AssignEditor"; // <--- Import
import { DeleteBookingButton } from "./DeleteBookingButton";
import { EditBookingDialog } from "./EditBookingDialog";
import { FinancialDialog } from "./FinancialDialog";

interface BookingCardProps {
  booking: Booking;
  userRole: string;
  availableStaff: { id: string; full_name: string }[];
  packages?: ServicePackage[];
}

export function BookingCard({ booking, userRole, availableStaff, packages }: BookingCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFinancialDialogOpen, setIsFinancialDialogOpen] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatStudioName = (studioSlug: string) => {
    return studioSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
        <CardHeader className="pb-3 px-4 pt-4 md:px-6 md:pt-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div className="min-w-0"> {/* min-w-0 helps text truncate properly */}
              <CardTitle className="text-base md:text-lg flex items-center gap-2 truncate">
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate">{booking.full_name}</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1 break-all">
                {booking.inquiry_id}
              </p>
            </div>
            <div className="self-end sm:self-auto">
                <UpdateBookingStatus
                  bookingId={booking.id}
                  currentStatus={booking.status || "New"}
                  userRole={userRole}
                />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 px-4 pb-4 md:px-6 md:pb-6 flex-1">
          {/* Info Grid - Compact on mobile */}
          <div className="grid gap-2 text-sm">
             <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground hidden xs:inline">Studio:</span>
                <Badge variant="secondary" className="text-[10px] xs:text-xs truncate max-w-[150px]">
                  {formatStudioName(booking.studio_slug)}
                </Badge>
              </div>

             <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                 <a href={`mailto:${booking.email}`} className="text-blue-600 hover:underline truncate block w-full">
                  {booking.email}
                </a>
              </div>

             {booking.mobile_number && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${booking.mobile_number}`} className="text-blue-600 hover:underline">
                    {booking.mobile_number}
                  </a>
                </div>
              )}

             <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{formatDate(booking.event_date)}</span>
              </div>

             {booking.event_type && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{booking.event_type}</span>
                </div>
              )}

             {booking.package_name && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{booking.package_name}</span>
                </div>
              )}
          </div>

          {/* Financial Status */}
          {booking.financial_entry && (
            <div className="flex items-center gap-2 text-sm pt-1">
              <DollarSign className="h-4 w-4 text-green-600 shrink-0" />
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Financials Completed
              </Badge>
            </div>
          )}

          {/* Assigned Staff Section */}
          <div className="text-sm pt-1 space-y-1">
             {booking.assigned_photographers && booking.assigned_photographers.length > 0 && (
               <div className="flex flex-wrap gap-1 items-center">
                 <span className="text-muted-foreground text-xs">Shooters:</span>
                 {booking.assigned_photographers.map((p, i) => (
                   <Badge key={i} variant="outline" className="text-[10px]">{p}</Badge>
                 ))}
               </div>
             )}
             
             {/* NEW: Editor Badge */}
             {booking.assigned_editor && (
               <div className="flex items-center gap-1">
                 <span className="text-muted-foreground text-xs">Editor:</span>
                 <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">
                   {booking.assigned_editor}
                 </Badge>
               </div>
             )}
          </div>

           {/* Message Preview */}
          {booking.message && (
            <div className="text-sm pt-1">
              <p className="line-clamp-2 text-muted-foreground text-xs italic border-l-2 pl-2 border-muted">
                &quot;{booking.message}&quot;
              </p>
            </div>
          )}

          {/* Action Buttons - Wrap nicely */}
          <div className="flex flex-wrap gap-2 pt-3 mt-auto">
            {userRole === "management" && (
              <>
                <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => setIsFinancialDialogOpen(true)}>
                  <DollarSign className="h-3 w-3 mr-1" /> Financial
                </Button>
                
                <div className="flex gap-2 w-full sm:w-auto">
                    {/* Photographers */}
                    <AssignPhotographers
                      bookingId={booking.id}
                      currentAssignments={booking.assigned_photographers || []}
                      availableStaff={availableStaff}
                      userRole={userRole}
                    />
                    
                    {/* NEW: Editor Assignment */}
                    <AssignEditor 
                      bookingId={booking.id}
                      currentEditor={booking.assigned_editor || null}
                      availableStaff={availableStaff}
                    />
                    
                    <DeleteBookingButton bookingId={booking.id} userRole={userRole} />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {userRole === "management" && (
        <>
            <EditBookingDialog
              booking={booking}
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
            />
            <FinancialDialog
              booking={booking}
              open={isFinancialDialogOpen}
              onOpenChange={setIsFinancialDialogOpen}
              packages={packages}
            />
        </>
      )}
    </>
  );
}