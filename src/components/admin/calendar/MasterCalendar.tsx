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
import { cn } from "@/lib/utils";

// Setup the localizer
const localizer = momentLocalizer(moment);

type CalendarEvent = {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  resource: any;
  type: 'booking' | 'rental' | 'order';
};

// --- CUSTOM TOOLBAR COMPONENT ---
const CustomToolbar: React.FC<ToolbarProps<CalendarEvent, object>> = (toolbar) => {
  const goToBack = () => { toolbar.onNavigate('PREV'); };
  const goToNext = () => { toolbar.onNavigate('NEXT'); };
  const goToCurrent = () => { toolbar.onNavigate('TODAY'); };
  const handleViewChange = (view: View) => { toolbar.onView(view); };

  const label = () => {
    const date = moment(toolbar.date);
    return (
      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
        {date.format('MMMM YYYY')}
      </span>
    );
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 p-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={goToCurrent} className="border-white/10 hover:bg-white/10">
          Today
        </Button>
        <div className="flex items-center bg-black/20 rounded-lg p-1 border border-white/5">
          <Button variant="ghost" size="icon" onClick={goToBack} className="h-8 w-8 hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNext} className="h-8 w-8 hover:bg-white/10">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Center: Label */}
      <div className="flex-1 text-center">
        {label()}
      </div>

      {/* Right: View Switcher */}
      <div className="flex items-center bg-black/20 rounded-lg p-1 border border-white/5">
        <Button variant={toolbar.view === 'month' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleViewChange('month')} className="text-xs">
          <CalendarDays className="mr-2 h-3 w-3" /> Month
        </Button>
        <Button variant={toolbar.view === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleViewChange('week')} className="text-xs">
          Week
        </Button>
        <Button variant={toolbar.view === 'day' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleViewChange('day')} className="text-xs">
          Day
        </Button>
        <Button variant={toolbar.view === 'agenda' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleViewChange('agenda')} className="text-xs">
          <List className="mr-2 h-3 w-3" /> Agenda
        </Button>
      </div>
    </div>
  );
};

export default function MasterCalendar({ data }: { data: any }) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // --- 1. Normalize Data ---
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // Bookings (Blue)
    data.bookings.forEach((b: any) => {
      if (b.event_date) {
        const d = new Date(b.event_date);
        d.setHours(12, 0, 0, 0); 
        allEvents.push({
          id: `booking-${b.id}`,
          title: `${b.full_name}`,
          start: d,
          end: d,
          type: 'booking',
          resource: b,
        });
      }
    });

    // Rentals (Purple)
    data.rentals.forEach((r: any) => {
      if (r.start_date && r.end_date) {
        allEvents.push({
          id: `rental-${r.id}`,
          title: `Rent: ${r.client_name}`,
          start: new Date(r.start_date),
          end: new Date(r.end_date),
          type: 'rental',
          resource: r,
        });
      }
    });

    // Orders (Orange)
    data.orders.forEach((o: any) => {
      if (o.created_at) {
        const d = new Date(o.created_at);
        allEvents.push({
          id: `order-${o.id}`,
          title: `Order: ${o.customer_name}`,
          start: d,
          end: d,
          type: 'order',
          resource: o,
        });
      }
    });

    return allEvents;
  }, [data]);

  // --- 2. Custom Styles for Events (FIXED) ---
  const eventPropGetter = (event: CalendarEvent) => {
    // Default Style (Bookings - Blue)
    let newStyle = {
      backgroundColor: '#2563eb', // blue-600
      color: 'white',
      borderRadius: '6px',
      border: 'none',
      borderLeft: '4px solid #1d4ed8', // blue-700
      display: 'block',
      fontSize: '0.85rem',
      fontWeight: '500',
      padding: '2px 6px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    };

    if (event.type === 'rental') {
      newStyle.backgroundColor = '#7c3aed'; // purple-600
      newStyle.borderLeft = '4px solid #5b21b6'; // purple-800
    } else if (event.type === 'order') {
      newStyle.backgroundColor = '#d97706'; // amber-600
      newStyle.borderLeft = '4px solid #92400e'; // amber-800
    }

    return {
      style: newStyle
    };
  };

  const handleNavigate = (newDate: Date) => setDate(newDate);
  const handleViewChange = (newView: View) => setView(newView);

  return (
    <div className="h-[800px] bg-zinc-950/50 backdrop-blur-sm p-6 rounded-2xl border border-white/10 shadow-2xl">
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
        className="text-gray-200 font-sans"
      />

      {/* --- Event Details Dialog --- */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedEvent?.type === 'booking' && <Camera className="text-blue-500 h-5 w-5" />}
              {selectedEvent?.type === 'rental' && <CalendarIcon className="text-purple-500 h-5 w-5" />}
              {selectedEvent?.type === 'order' && <ShoppingBag className="text-amber-500 h-5 w-5" />}
              {selectedEvent?.title}
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
                  <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
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
                  <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
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
                  <div className="bg-black/30 rounded-md p-2 text-xs font-mono text-muted-foreground text-center border border-white/5 select-all">
                    ID: {
                      selectedEvent.resource.inquiry_id || 
                      selectedEvent.resource.booking_id || 
                      selectedEvent.resource.order_id
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