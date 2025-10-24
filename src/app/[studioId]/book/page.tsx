// app/[studioId]/book/page.tsx - Full updated file
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ServicePackage } from "@/lib/types";
import { toast } from "sonner";
import { CheckCircle, Copy, Calendar, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// --- 1. Define Form Schema with Zod ---
const bookingSchema = z.object({
  full_name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  mobile_number: z
    .string()
    .min(10, { message: "Mobile number must be at least 10 digits." })
    .regex(/^[0-9+\-\s()]+$/, { message: "Please enter a valid mobile number." }),
  event_type: z.string().min(1, { message: "Please select an event type." }),
  package_name: z.string().min(1, { message: "Please select a package." }),
  event_date: z
    .string()
    .refine((date) => new Date(date) >= new Date(new Date().toDateString()), {
      message: "Event date must be today or in the future.",
    }),
  message: z.string().optional(),
});

// --- 2. Main Booking Component ---
export default function BookingPage() {
  const searchParams = useSearchParams();
  const params = useParams();

  const prefilledPackage = searchParams.get("package");
  const prefilledCategory = searchParams.get("category");
  const studioId = params.studioId as string;

  // Derive studio name for display and filtering
  const studioName = studioId
    ?.replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const [eventTypes] = useState<string[]>([
    "Wedding",
    "Birthday",
    "Event",
    "Portrait",
  ]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<
    string | undefined
  >(prefilledCategory || undefined);
  const [submittedInquiry, setSubmittedInquiry] = useState<{
    id: string;
    inquiryId: string;
    full_name: string;
    email: string;
    mobile_number: string;
    event_date: string;
    package_name: string;
    studio_slug: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      full_name: "",
      email: "",
      mobile_number: "",
      event_type: prefilledCategory || "",
      package_name: prefilledPackage || "",
      event_date: "",
      message: "",
    },
  });

  // --- 3. Fetch Packages when Event Type Changes ---
  useEffect(() => {
    async function fetchPackages() {
      if (!selectedEventType || prefilledCategory) {
        setPackages([]);
        return;
      }
      
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("studio_name", studioName)
        .eq("category", selectedEventType);

      if (data) {
        setPackages(data as ServicePackage[]);
        if (prefilledPackage && !prefilledCategory) {
          form.setValue("package_name", prefilledPackage);
        }
      } else {
        console.error("Error fetching packages:", error);
        toast.error("Could not load packages for this category.");
      }
    }
    
    if (selectedEventType && !prefilledCategory) {
      fetchPackages();
    }
    
    if (prefilledCategory) {
      setSelectedEventType(prefilledCategory);
    }
  }, [
    selectedEventType,
    studioName,
    form,
    prefilledCategory,
    prefilledPackage,
  ]);

  // --- 4. Generate Unique Inquiry ID ---
  function generateInquiryId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `INQ-${timestamp}-${random}`.toUpperCase();
  }

  // --- 5. Handle Form Submission ---
  async function onSubmit(values: z.infer<typeof bookingSchema>) {
    setIsSubmitting(true);
    
    const inquiryId = generateInquiryId();
    const submissionData = {
      ...values,
      event_type: prefilledCategory || values.event_type,
      package_name: prefilledPackage || values.package_name,
      studio_slug: studioId,
      status: "New",
      inquiry_id: inquiryId, // Add the unique inquiry ID
    };

    try {
      const { data, error } = await supabase
        .from("client_bookings")
        .insert([submissionData])
        .select()
        .single();

      if (error) throw error;

      // Store the submitted inquiry data for confirmation display
      setSubmittedInquiry({
        id: data.id,
        inquiryId: data.inquiry_id,
        full_name: data.full_name,
        email: data.email,
        mobile_number: data.mobile_number,
        event_date: data.event_date,
        package_name: data.package_name,
        studio_slug: data.studio_slug,
      });

      toast.success("Inquiry Submitted Successfully!", {
        description: `Your inquiry ID: ${inquiryId}`,
      });
      
    } catch (error: unknown) {
      console.error("Booking submission error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Please try again.";
      toast.error("Submission Failed", { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- 6. Copy Inquiry ID to Clipboard ---
  const copyInquiryId = async () => {
    if (submittedInquiry) {
      try {
        await navigator.clipboard.writeText(submittedInquiry.inquiryId);
        toast.success("Inquiry ID copied to clipboard!");
      } catch {
        toast.error("Failed to copy to clipboard");
      }
    }
  };

  // --- 7. Reset Form and Start New Inquiry ---
  const startNewInquiry = () => {
    setSubmittedInquiry(null);
    form.reset();
    if (!prefilledCategory) setSelectedEventType(undefined);
    if (!prefilledPackage) setPackages([]);
  };

  // --- 8. Render Confirmation Screen ---
  if (submittedInquiry) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-2xl">
        <Card className="border-green-600/30 bg-gradient-to-br from-green-900/20 to-emerald-900/10 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-100">
              Inquiry Submitted Successfully!
            </CardTitle>
            <CardDescription className="text-lg text-green-200/80">
              Thank you for your interest in {studioName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Inquiry ID Section */}
            <div className="bg-black/30 rounded-lg border border-green-600/30 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-200/80">
                  Your Inquiry ID:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyInquiryId}
                  className="flex items-center gap-2 bg-green-900/30 border-green-600/50 text-green-100 hover:bg-green-800/40 hover:border-green-500/70"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              </div>
              <div className="bg-black/40 rounded px-3 py-2 font-mono text-lg font-bold text-green-300 border border-green-600/30">
                {submittedInquiry.inquiryId}
              </div>
              <p className="text-xs text-green-200/60 mt-2">
                Please save this ID for future reference
              </p>
            </div>

            {/* Inquiry Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 bg-black/20 rounded-lg p-3 border border-white/10">
                <p className="text-sm font-medium text-green-200/80">Name</p>
                <p className="text-base text-white">{submittedInquiry.full_name}</p>
              </div>
              <div className="space-y-1 bg-black/20 rounded-lg p-3 border border-white/10">
                <p className="text-sm font-medium text-green-200/80">Email</p>
                <p className="text-base text-white">{submittedInquiry.email}</p>
              </div>
              <div className="space-y-1 bg-black/20 rounded-lg p-3 border border-white/10">
                <p className="text-sm font-medium text-green-200/80">Mobile Number</p>
                <p className="text-base text-white flex items-center gap-1">
                  <Phone className="h-4 w-4 text-green-400" />
                  {submittedInquiry.mobile_number}
                </p>
              </div>
              <div className="space-y-1 bg-black/20 rounded-lg p-3 border border-white/10">
                <p className="text-sm font-medium text-green-200/80">Package</p>
                <p className="text-base text-white">{submittedInquiry.package_name}</p>
              </div>
              <div className="space-y-1 bg-black/20 rounded-lg p-3 border border-white/10">
                <p className="text-sm font-medium text-green-200/80">Event Date</p>
                <p className="text-base text-white flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-green-400" />
                  {new Date(submittedInquiry.event_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-900/20 rounded-lg border border-blue-600/30 p-4 backdrop-blur-sm">
              <h3 className="font-semibold text-blue-200 mb-2">What&apos;s Next?</h3>
              <ul className="text-sm text-blue-200/80 space-y-1">
                <li>• We&apos;ll contact you within 24 hours to confirm details</li>
                <li>• Keep your inquiry ID handy for reference</li>
                <li>• Expect a follow-up message from us shortly regarding your inquiry</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={startNewInquiry} 
                variant="outline" 
                className="flex-1 bg-transparent border-green-600/50 text-green-100 hover:bg-green-900/30 hover:border-green-500/70"
              >
                Submit Another Inquiry
              </Button>
              <Button asChild className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                <a href={`/${studioId}`}>Return to Studio</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- 9. Render the Booking Form ---
  return (
    <div className="container mx-auto py-16 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-2 text-white">Book Your Session</h1>
      <p className="text-center text-muted-foreground mb-8">
        Submit an inquiry for {studioName}
      </p>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 bg-card/60 backdrop-blur-sm p-6 md:p-8 rounded-lg border border-white/10 shadow-lg"
        >
          {/* --- Full Name --- */}
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Full Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your full name" 
                    {...field} 
                    className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* --- Email --- */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    {...field}
                    className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* --- Mobile Number --- */}
          <FormField
            control={form.control}
            name="mobile_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Mobile Number</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="Enter your mobile number"
                    {...field}
                    className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* --- Event Type Dropdown (conditionally shown) --- */}
          {!prefilledCategory && (
            <FormField
              control={form.control}
              name="event_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Event Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedEventType(value);
                      form.setValue("package_name", "");
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-black/30 border-white/20 text-white">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-900 border-white/20 text-white">
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type} className="hover:bg-gray-800">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* --- Package Dropdown (conditionally shown/enabled) --- */}
          {!prefilledPackage && selectedEventType && (
            <FormField
              control={form.control}
              name="package_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Package</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={packages.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-black/30 border-white/20 text-white">
                        <SelectValue
                          placeholder={
                            packages.length > 0
                              ? "Select package"
                              : "Select event type first"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-900 border-white/20 text-white">
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.name || ""} className="hover:bg-gray-800">
                          {pkg.name} - {pkg.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* --- Show prefilled info if applicable --- */}
          {prefilledCategory && (
            <div className="space-y-1 rounded-md border border-white/20 p-3 bg-black/30">
              <p className="text-sm font-medium text-green-200">Event Type:</p>
              <p className="text-white">{prefilledCategory}</p>
            </div>
          )}
          {prefilledPackage && (
            <div className="space-y-1 rounded-md border border-white/20 p-3 bg-black/30">
              <p className="text-sm font-medium text-green-200">Selected Package:</p>
              <p className="text-white">{prefilledPackage}</p>
            </div>
          )}

          {/* --- Event Date --- */}
          <FormField
            control={form.control}
            name="event_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Preferred Event Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    className="bg-black/30 border-white/20 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* --- Message --- */}
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Additional Message (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us a bit more about your event or any special requests."
                    className="resize-none bg-black/30 border-white/20 text-white placeholder:text-gray-400"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? "Submitting..." : "Submit Inquiry"}
          </Button>
        </form>
      </Form>
    </div>
  );
}