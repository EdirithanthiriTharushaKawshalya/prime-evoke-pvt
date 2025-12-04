"use client";

import { useState, useMemo } from "react";
import { Calendar, momentLocalizer, Views, View, ToolbarProps } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Camera, Calendar as CalendarIcon, ShoppingBag, MapPin, Clock, 
  ChevronLeft, ChevronRight, CalendarDays, List 
} from "lucide-react";

// Setup the localizer
const localizer = momentLocalizer(moment);

// --- Types ---
interface BookingResource {
  id: number;
  full_name: string;
  event_date: string;
  event_type: string;
  status: string;
  inquiry_id: string;
}

interface RentalResource {
  id: number;
  client_name: string;
  start_date: string;
  end_date: string;
  status: string;
  booking_id: string;
}

interface OrderResource {
  id: number;
  customer_name: string;
  created_at: string;
  status: string;
  order_id: string;
}

interface CalendarData {
  bookings: BookingResource[];
  rentals: RentalResource[];
  orders: OrderResource[];
}

type CalendarEvent = {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  resource: BookingResource | RentalResource | OrderResource;
  type: 'booking' | 'rental' | 'order';
};

// --- RESPONSIVE TOOLBAR COMPONENT ---
const CustomToolbar = (toolbar: ToolbarProps<CalendarEvent, object>) => {
  const goToBack = () => { toolbar.onNavigate('PREV'); };
  const goToNext = () => { toolbar.onNavigate('NEXT'); };
  const goToCurrent = () => { toolbar.onNavigate('TODAY'); };
  const handleViewChange = (view: View) => { toolbar.onView(view); };

  const label = () => {
    const date = moment(toolbar.date);
    return (
      <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
        {date.format('MMMM YYYY')}
      </span>
    );
  };

  return (
    <div className="flex flex-col xl:flex-row items-center justify-between mb-4 md:mb-6 gap-4 p-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
      
      {/* Top Row on Mobile: Navigation */}
      <div className="flex w-full xl:w-auto items-center justify-between xl:justify-start gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToCurrent} className="border-white/10 hover:bg-white/10 text-xs md:text-sm h-8 md:h-9">
            Today
          </Button>
          <div className="flex items-center bg-black/20 rounded-lg p-1 border border-white/5">
            <Button variant="ghost" size="icon" onClick={goToBack} className="h-7 w-7 md:h-8 md:w-8 hover:bg-white/10">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNext} className="h-7 w-7 md:h-8 md:w-8 hover:bg-white/10">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Label (Mobile: Right aligned in top row, Desktop: Center) */}
        <div className="xl:hidden">
          {label()}
        </div>
      </div>

      {/* Center Label (Desktop Only) */}
      <div className="hidden xl:block flex-1 text-center">
        {label()}
      </div>

      {/* View Switcher (Full width on mobile) */}
      <div className="flex w-full xl:w-auto items-center justify-center bg-black/20 rounded-lg p-1 border border-white/5 overflow-x-auto">
        {['month', 'week', 'day', 'agenda'].map((v) => (
          <Button 
            key={v}
            variant={toolbar.view === v ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => handleViewChange(v as View)} 
            className={`text-xs flex-1 xl:flex-none ${toolbar.view === v ? "bg-white/10" : ""}`}
          >
            {v === 'month' && <CalendarDays className="mr-1.5 h-3 w-3" />}
            {v === 'agenda' && <List className="mr-1.5 h-3 w-3" />}
            <span className="capitalize">{v}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default function MasterCalendar({ data }: { data: CalendarData }) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // --- 1. Normalize Data ---
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // Bookings (Blue)
    data.bookings.forEach((b) => {
      if (b.event_date) {
        const d = new Date(b.event_date);
        d.setHours(12, 0, 0, 0); 
        allEvents.push({
          id: `booking-${b.id}`,
          title: `${b.full_name}`,
          start: d,
          end: d,
          resource: b,
          type: 'booking',
        });
      }
    });

    // Rentals (Purple)
    data.rentals.forEach((r) => {
      if (r.start_date && r.end_date) {
        allEvents.push({
          id: `rental-${r.id}`,
          title: `Rent: ${r.client_name}`,
          start: new Date(r.start_date),
          end: new Date(r.end_date),
          resource: r,
          type: 'rental',
        });
      }
    });

    // Orders (Orange)
    data.orders.forEach((o) => {
      if (o.created_at) {
        const d = new Date(o.created_at);
        allEvents.push({
          id: `order-${o.id}`,
          title: `Order: ${o.customer_name}`,
          start: d,
          end: d,
          resource: o,
          type: 'order',
        });
      }
    });

    return allEvents;
  }, [data]);

  // --- 2. Custom Styles for Events ---
  const eventPropGetter = (event: CalendarEvent) => {
    // Default Style (Bookings - Blue)
    const newStyle = {
      backgroundColor: '#2563eb', // blue-600
      color: 'white',
      borderRadius: '4px',
      border: 'none',
      borderLeft: '3px solid #1d4ed8', // blue-700
      display: 'block',
      fontSize: '0.75rem', // Slightly smaller text for mobile
      fontWeight: '500',
      padding: '1px 4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '1px'
    };

    if (event.type === 'rental') {
      newStyle.backgroundColor = '#7c3aed'; // purple-600
      newStyle.borderLeft = '3px solid #5b21b6'; // purple-800
    } else if (event.type === 'order') {
      newStyle.backgroundColor = '#d97706'; // amber-600
      newStyle.borderLeft = '3px solid #92400e'; // amber-800
    }

    return {
      style: newStyle
    };
  };

  const handleNavigate = (newDate: Date) => setDate(newDate);
  const handleViewChange = (newView: View) => setView(newView);

  // Helper type guards for the dialog
  const isBooking = (r: unknown): r is BookingResource => 
    typeof r === 'object' && r !== null && 'inquiry_id' in r;
  
  const isRental = (r: unknown): r is RentalResource => 
    typeof r === 'object' && r !== null && 'booking_id' in r;
  
  const isOrder = (r: unknown): r is OrderResource => 
    typeof r === 'object' && r !== null && 'order_id' in r;

  return (
    // UPDATED CONTAINER: Responsive Height (h-[600px] mobile -> h-[800px] desktop) and Padding (p-3 -> p-6)
    <div className="h-[600px] md:h-[800px] bg-zinc-950/50 backdrop-blur-sm p-3 md:p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        
        view={view}
        onView={handleViewChange}
        date={date}
        onNavigate={handleNavigate}
        
        components={{ toolbar: CustomToolbar }}
        eventPropGetter={eventPropGetter}
        onSelectEvent={(event) => setSelectedEvent(event)}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        popup
        className="text-gray-200 font-sans text-xs md:text-sm" // Scale font size
      />

      {/* --- Event Details Dialog --- */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-md w-[95vw] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
              {selectedEvent?.type === 'booking' && <Camera className="text-blue-500 h-5 w-5" />}
              {selectedEvent?.type === 'rental' && <CalendarIcon className="text-purple-500 h-5 w-5" />}
              {selectedEvent?.type === 'order' && <ShoppingBag className="text-amber-500 h-5 w-5" />}
              <span className="truncate">{selectedEvent?.title}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.type === 'booking' && "Photography Session Details"}
              {selectedEvent?.type === 'rental' && "Equipment Rental Duration"}
              {selectedEvent?.type === 'order' && "Product Order Information"}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                <span className="text-muted-foreground text-sm font-medium">Status</span>
                <Badge variant={
                  selectedEvent.resource.status === 'Confirmed' ? 'default' : 
                  selectedEvent.resource.status === 'Completed' ? 'secondary' : 'outline'
                }>
                  {selectedEvent.resource.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">Date / Time</span>
                    <span className="font-medium">
                      {moment(selectedEvent.start).format('MMM Do, YYYY')} 
                      {selectedEvent.type === 'rental' && ` — ${moment(selectedEvent.end).format('MMM Do, YYYY')}`}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">Context</span>
                    <span className="font-medium">
                      {selectedEvent.type === 'booking' ? 'Event Inquiry' : 
                       selectedEvent.type === 'rental' ? 'Store Rental' : 
                       'Product Order'}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="bg-black/30 rounded-md p-2 text-xs font-mono text-muted-foreground text-center border border-white/5 select-all break-all">
                    ID: {
                      (isBooking(selectedEvent.resource) && selectedEvent.resource.inquiry_id) || 
                      (isRental(selectedEvent.resource) && selectedEvent.resource.booking_id) || 
                      (isOrder(selectedEvent.resource) && selectedEvent.resource.order_id)
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}