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
import { toast } from "sonner"; // Using sonner for toasts

// --- 1. Define Form Schema with Zod ---
const bookingSchema = z.object({
  full_name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  event_type: z.string().min(1, { message: "Please select an event type." }),
  package_name: z.string().min(1, { message: "Please select a package." }),
  event_date: z
    .string()
    .refine((date) => new Date(date) >= new Date(new Date().toDateString()), {
      // Allow today or future
      message: "Event date must be today or in the future.",
    }),
  message: z.string().optional(),
});

// --- 2. Main Booking Component ---
export default function BookingPage() {
  const searchParams = useSearchParams();
  const params = useParams(); // { studioId: 'evoke-gallery' }

  const prefilledPackage = searchParams.get("package");
  const prefilledCategory = searchParams.get("category");
  const studioId = params.studioId as string; // Get the current studio slug

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
  ]); // Or fetch dynamically if needed
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<
    string | undefined
  >(prefilledCategory || undefined);

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      full_name: "",
      email: "",
      event_type: prefilledCategory || "",
      package_name: prefilledPackage || "",
      event_date: "",
      message: "",
    },
  });

  // --- 3. Fetch Packages when Event Type Changes ---
  useEffect(() => {
    async function fetchPackages() {
      // Don't fetch if category is prefilled, packages for it aren't needed in dropdown
      if (!selectedEventType || prefilledCategory) {
        setPackages([]);
        return;
      }
      // Fetch packages from Supabase matching studioName and selectedEventType
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("studio_name", studioName) // Correct column name is studio_name
        .eq("category", selectedEventType);

      if (data) {
        setPackages(data as ServicePackage[]);
        // If a package was prefilled but category wasn't, try to set it now
        if (prefilledPackage && !prefilledCategory) {
          form.setValue("package_name", prefilledPackage);
        }
      } else {
        console.error("Error fetching packages:", error);
        toast.error("Could not load packages for this category.");
      }
    }
    // Fetch immediately if category is selected (and not prefilled)
    if (selectedEventType && !prefilledCategory) {
      fetchPackages();
    }
    // Also fetch if category IS prefilled (to potentially set package default later)
    if (prefilledCategory) {
      setSelectedEventType(prefilledCategory); // Ensure state matches prefill
      // We might fetch here too if we want to allow changing package even if prefilled
      // fetchPackages();
    }
  }, [
    selectedEventType,
    studioName,
    form,
    prefilledCategory,
    prefilledPackage,
  ]); // Dependencies

  // --- 4. Handle Form Submission ---
  async function onSubmit(values: z.infer<typeof bookingSchema>) {
    // Ensure event_type and package_name are set correctly if prefilled
    const submissionData = {
      ...values,
      event_type: prefilledCategory || values.event_type,
      package_name: prefilledPackage || values.package_name,
      studio_slug: studioId, // Add the studio slug
      status: "New",
    };

    try {
      const { error } = await supabase
        .from("client_bookings")
        .insert([submissionData])
        .select();

      if (error) throw error;

      toast.success("Inquiry Submitted!", {
        description: "We'll get back to you soon.",
      });
      form.reset(); // Clear the form
      // Reset state only if fields were not prefilled
      if (!prefilledCategory) setSelectedEventType(undefined);
      if (!prefilledPackage) setPackages([]);
    } catch (error: unknown) {
      console.error("Booking submission error:", error);
      // Check if error is an instance of Error to access message safely
      const errorMessage =
        error instanceof Error ? error.message : "Please try again.";
      toast.error("Submission Failed", { description: errorMessage });
    }
  }

  // --- 5. Render the Form ---
  return (
    <div className="container mx-auto py-16 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-2">Book Your Session</h1>
      <p className="text-center text-muted-foreground mb-8">
        Submit an inquiry for {studioName}
      </p>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 bg-card p-6 md:p-8 rounded-lg shadow-sm"
        >
          {" "}
          {/* Added card styling */}
          {/* --- Full Name --- */}
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
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
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    {...field}
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
                  <FormLabel>Event Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedEventType(value);
                      form.setValue("package_name", ""); // Reset package when type changes
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>
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
                  <FormLabel>Package</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={packages.length === 0} // Disable if no packages loaded
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            packages.length > 0
                              ? "Select package"
                              : "Select event type first"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.name || ""}>
                          {pkg.name} - {pkg.price}
                        </SelectItem>
                      ))}{" "}
                      {/* Show price */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {/* --- Show prefilled info if applicable --- */}
          {prefilledCategory && (
            <div className="space-y-1 rounded-md border p-3 bg-secondary/50">
              <p className="text-sm font-medium">Event Type:</p>
              <p className="text-muted-foreground">{prefilledCategory}</p>
            </div>
          )}
          {prefilledPackage && (
            <div className="space-y-1 rounded-md border p-3 bg-secondary/50">
              <p className="text-sm font-medium">Selected Package:</p>
              <p className="text-muted-foreground">{prefilledPackage}</p>
            </div>
          )}
          {/* --- Event Date --- */}
          <FormField
            control={form.control}
            name="event_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Event Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                <FormLabel>Additional Message (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us a bit more about your event or any special requests."
                    className="resize-none" // Prevent resizing
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
            disabled={form.formState.isSubmitting}
            className="w-full"
          >
            {form.formState.isSubmitting ? "Submitting..." : "Submit Inquiry"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
