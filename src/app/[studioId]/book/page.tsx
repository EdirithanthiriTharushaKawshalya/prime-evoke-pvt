import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function BookingPage() {
  return (
    <div className="container mx-auto py-12 md:py-24 px-6 flex items-center justify-center"
    data-aos="fade-up"
    >
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tighter">
            Book a Session
          </CardTitle>
          <CardDescription>
            Fill out the form below to inquire about our availability. We&apos;ll
            get back to you within 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type</Label>
                <Input id="event-type" placeholder="e.g., Wedding, Portrait" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-date">Preferred Date</Label>
                <Input id="event-date" type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us a little about your event or what you're looking for."
                className="min-h-[100px]"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button className="w-full" size="lg">Submit Inquiry</Button>
        </CardFooter>
      </Card>
    </div>
  );
}