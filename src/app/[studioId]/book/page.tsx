// app/[studioId]/book/page.tsx - Full updated file
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  ServicePackage,
  Frame,
  PrintSize,
  Album,
  OrderedItem,
} from "@/lib/types";
import { toast } from "sonner";
import { CheckCircle, Copy, Calendar, Phone, ShoppingCart } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { submitProductOrder } from "@/lib/actions";

// --- Schemas ---
const bookingSchema = z.object({
  full_name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  mobile_number: z
    .string()
    .min(10, { message: "Mobile number must be at least 10 digits." })
    .regex(/^[0-9+\-\s()]+$/, {
      message: "Please enter a valid mobile number.",
    }),
  event_type: z.string().min(1, { message: "Please select an event type." }),
  package_name: z.string().min(1, { message: "Please select a package." }),
  event_date: z
    .string()
    .refine((date) => new Date(date) >= new Date(new Date().toDateString()), {
      message: "Event date must be today or in the future.",
    }),
  message: z.string().optional(),
});

const productOrderSchema = z
  .object({
    customer_name: z.string().min(2, "Name required"),
    customer_email: z.string().email("Invalid email"),
    customer_mobile: z
      .string()
      .min(10, "Valid mobile number required")
      .optional()
      .or(z.literal("")),
    frames: z
      .array(z.object({ id: z.string(), quantity: z.number().min(0) }))
      .optional(),
    prints: z
      .array(z.object({ id: z.string(), quantity: z.number().min(0) }))
      .optional(),
    albums: z
      .array(z.object({ id: z.string(), quantity: z.number().min(0) }))
      .optional(),
  })
  .refine(
    (data) =>
      data.frames?.some((f) => f.quantity > 0) ||
      data.prints?.some((p) => p.quantity > 0) ||
      data.albums?.some((a) => a.quantity > 0),
    { message: "Please add at least one item to your order.", path: ["frames"] }
  );

// --- Main Component ---
export default function BookingPage() {
  const searchParams = useSearchParams();
  const params = useParams();

  const prefilledPackage = searchParams.get("package");
  const prefilledCategory = searchParams.get("category");
  const initialTab = searchParams.get("tab") || "session";
  const studioId = params.studioId as string;

  // Derive studio name for display and filtering
  const studioName = studioId
    ?.replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // --- State ---
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
  const [frames, setFrames] = useState<Frame[]>([]);
  const [printSizes, setPrintSizes] = useState<PrintSize[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [productFetchError, setProductFetchError] = useState<string | null>(
    null
  );
  const [submittedInquiry, setSubmittedInquiry] = useState<{
    id: number;
    inquiryId: string;
    full_name: string;
    email: string;
    mobile_number: string;
    event_date: string;
    package_name: string;
    studio_slug: string;
  } | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<{
    orderId: string;
    totalAmount: number;
    items: OrderedItem[];
  } | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // --- Forms ---
  const bookingForm = useForm<z.infer<typeof bookingSchema>>({
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

  const productForm = useForm<z.infer<typeof productOrderSchema>>({
    resolver: zodResolver(productOrderSchema),
    defaultValues: {
      customer_name: "",
      customer_email: "",
      customer_mobile: "",
      frames: [],
      prints: [],
      albums: [],
    },
  });

  // --- Field Arrays for Products ---
  const { fields: frameFields } = useFieldArray({
    control: productForm.control,
    name: "frames",
  });
  const { fields: printFields } = useFieldArray({
    control: productForm.control,
    name: "prints",
  });
  const { fields: albumFields } = useFieldArray({
    control: productForm.control,
    name: "albums",
  });

  // --- Fetch Data ---
  // Fetch Service Packages (existing useEffect)
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
          bookingForm.setValue("package_name", prefilledPackage);
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
    bookingForm,
    prefilledCategory,
    prefilledPackage,
  ]);

  // Fetch Products (Frames, Prints, Albums) - runs once
  useEffect(() => {
    async function fetchProducts() {
      try {
        const [framesRes, printsRes, albumsRes] = await Promise.all([
          supabase.from("frames").select("*").order("id"),
          supabase.from("print_sizes").select("*").order("id"),
          supabase.from("albums").select("*").order("id"),
        ]);
        if (framesRes.error) throw framesRes.error;
        if (printsRes.error) throw printsRes.error;
        if (albumsRes.error) throw albumsRes.error;

        // Just set the state
        setFrames(framesRes.data as Frame[]);
        setPrintSizes(printsRes.data as PrintSize[]);
        setAlbums(albumsRes.data as Album[]);
      } catch (error: unknown) {
        console.error("Error fetching products:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        setProductFetchError(
          "Could not load product options. Please try again later."
        );
        toast.error("Error loading products", { description: errorMessage });
      }
    }
    fetchProducts();
  }, []); // Empty dependency array runs once

  // ** THIS IS THE CRITICAL FIX **
  // Re-populate form arrays when product data loads
  useEffect(() => {
    // Only run this if frames are fetched but field array is still empty
    if (frames.length > 0 && frameFields.length === 0) {
      // Keep existing customer data if they already typed
      const customerData = productForm.getValues();

      productForm.reset({
        customer_name: customerData.customer_name,
        customer_email: customerData.customer_email,
        customer_mobile: customerData.customer_mobile,
        frames: frames.map((f) => ({ id: String(f.id), quantity: 0 })),
        prints: printSizes.map((p) => ({ id: String(p.id), quantity: 0 })),
        albums: albums.map((a) => ({ id: String(a.id), quantity: 0 })),
      });
    }
    // This effect depends on the fetched data and the form's state
  }, [frames, printSizes, albums, frameFields.length, productForm]);

  // --- Calculate Order Total ---
  const watchFrames = productForm.watch("frames");
  const watchPrints = productForm.watch("prints");
  const watchAlbums = productForm.watch("albums");

  // Calculate the total directly.
  // The 'watch' functions trigger a re-render, so this will always be current.
  let orderTotal = 0;
  watchFrames?.forEach((item, index) => {
    orderTotal += (item.quantity || 0) * (frames[index]?.price || 0);
  });
  watchPrints?.forEach((item, index) => {
    orderTotal += (item.quantity || 0) * (printSizes[index]?.price || 0);
  });
  watchAlbums?.forEach((item, index) => {
    orderTotal += (item.quantity || 0) * (albums[index]?.price || 0);
  });

  // --- Generate Unique Inquiry ID ---
  function generateInquiryId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `INQ-${timestamp}-${random}`.toUpperCase();
  }

  // --- Submission Handlers ---
  async function onBookingSubmit(values: z.infer<typeof bookingSchema>) {
    setIsSubmittingBooking(true);

    const inquiryId = generateInquiryId();
    const submissionData = {
      ...values,
      event_type: prefilledCategory || values.event_type,
      package_name: prefilledPackage || values.package_name,
      studio_slug: studioId,
      status: "New",
      inquiry_id: inquiryId,
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
      setIsSubmittingBooking(false);
    }
  }

  async function onProductOrderSubmit(
    values: z.infer<typeof productOrderSchema>
  ) {
    setIsSubmittingOrder(true);
    const orderedItems: OrderedItem[] = [];

    // Compile ordered items list
    values.frames?.forEach((item, index) => {
      if (item.quantity > 0 && frames[index]) {
        const frame = frames[index];
        orderedItems.push({
          type: "frame",
          id: frame.id,
          size: frame.size,
          material: frame.material,
          quantity: item.quantity,
          price: frame.price,
          line_total: item.quantity * frame.price,
        });
      }
    });

    values.prints?.forEach((item, index) => {
      if (item.quantity > 0 && printSizes[index]) {
        const print = printSizes[index];
        orderedItems.push({
          type: "print",
          id: print.id,
          size: print.size,
          paper_type: print.paper_type,
          quantity: item.quantity,
          price: print.price,
          line_total: item.quantity * print.price,
        });
      }
    });

    values.albums?.forEach((item, index) => {
      if (item.quantity > 0 && albums[index]) {
        const album = albums[index];
        orderedItems.push({
          type: "album",
          id: album.id,
          size: album.size,
          cover_type: album.cover_type,
          page_count: album.page_count,
          quantity: item.quantity,
          price: album.price,
          line_total: item.quantity * album.price,
        });
      }
    });

    const submissionData = {
      customer_name: values.customer_name,
      customer_email: values.customer_email,
      customer_mobile: values.customer_mobile || null,
      ordered_items: orderedItems,
      total_amount: orderTotal,
      studio_slug: studioId, // <-- ADD THIS LINE
    };

    // Call Server Action
    const result = await submitProductOrder(submissionData);

    if (result.error) {
      toast.error("Order Failed", { description: result.error });
    } else if (result.success && result.orderId) {
      setSubmittedOrder({
        orderId: result.orderId,
        totalAmount: orderTotal,
        items: orderedItems,
      });
      toast.success("Order Placed Successfully!", {
        description: `Your Order ID: ${result.orderId}`,
      });
      productForm.reset(); // Reset form
    }
    setIsSubmittingOrder(false);
  }

  // --- Copy Inquiry ID to Clipboard ---
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

  // --- Copy Order ID to Clipboard ---
  const copyOrderId = async () => {
    if (submittedOrder) {
      try {
        await navigator.clipboard.writeText(submittedOrder.orderId);
        toast.success("Order ID copied to clipboard!");
      } catch {
        toast.error("Failed to copy to clipboard");
      }
    }
  };

  // --- Reset / New Inquiry/Order ---
  const startNewInquiry = () => {
    setSubmittedInquiry(null);
    bookingForm.reset();
    if (!prefilledCategory) setSelectedEventType(undefined);
    if (!prefilledPackage) setPackages([]);
  };

  const startNewOrder = () => {
    setSubmittedOrder(null);
    // Reset the form, repopulating the product arrays
    productForm.reset({
      customer_name: "",
      customer_email: "",
      customer_mobile: "",
      frames: frames.map((f) => ({ id: String(f.id), quantity: 0 })),
      prints: printSizes.map((p) => ({ id: String(p.id), quantity: 0 })),
      albums: albums.map((a) => ({ id: String(a.id), quantity: 0 })),
    });
  };

  // --- Render Confirmation Screens ---
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
                <p className="text-base text-white">
                  {submittedInquiry.full_name}
                </p>
              </div>
              <div className="space-y-1 bg-black/20 rounded-lg p-3 border border-white/10">
                <p className="text-sm font-medium text-green-200/80">Email</p>
                <p className="text-base text-white">{submittedInquiry.email}</p>
              </div>
              <div className="space-y-1 bg-black/20 rounded-lg p-3 border border-white/10">
                <p className="text-sm font-medium text-green-200/80">
                  Mobile Number
                </p>
                <p className="text-base text-white flex items-center gap-1">
                  <Phone className="h-4 w-4 text-green-400" />
                  {submittedInquiry.mobile_number}
                </p>
              </div>
              <div className="space-y-1 bg-black/20 rounded-lg p-3 border border-white/10">
                <p className="text-sm font-medium text-green-200/80">Package</p>
                <p className="text-base text-white">
                  {submittedInquiry.package_name}
                </p>
              </div>
              <div className="space-y-1 bg-black/20 rounded-lg p-3 border border-white/10">
                <p className="text-sm font-medium text-green-200/80">
                  Event Date
                </p>
                <p className="text-base text-white flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-green-400" />
                  {new Date(submittedInquiry.event_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-900/20 rounded-lg border border-blue-600/30 p-4 backdrop-blur-sm">
              <h3 className="font-semibold text-blue-200 mb-2">
                What&apos;s Next?
              </h3>
              <ul className="text-sm text-blue-200/80 space-y-1">
                <li>
                  • We&apos;ll contact you within 24 hours to confirm details
                </li>
                <li>• Keep your inquiry ID handy for reference</li>
                <li>
                  • Expect a follow-up message from us shortly regarding your
                  inquiry
                </li>
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
              <Button
                asChild
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <a href={`/${studioId}`}>Return to Studio</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submittedOrder) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-2xl">
        <Card className="border-blue-600/30 bg-gradient-to-br from-blue-900/20 to-cyan-900/10 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-blue-100">
              Order Placed Successfully!
            </CardTitle>
            <CardDescription className="text-lg text-blue-200/80">
              Thank you for your order from {studioName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order ID Section */}
            <div className="bg-black/30 rounded-lg border border-blue-600/30 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-200/80">
                  Your Order ID:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyOrderId}
                  className="flex items-center gap-2 bg-blue-900/30 border-blue-600/50 text-blue-100 hover:bg-blue-800/40 hover:border-blue-500/70"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              </div>
              <div className="bg-black/40 rounded px-3 py-2 font-mono text-lg font-bold text-blue-300 border border-blue-600/30">
                {submittedOrder.orderId}
              </div>
              <p className="text-xs text-blue-200/60 mt-2">
                Please save this ID for order tracking
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-black/20 rounded-lg p-4 border border-white/10">
              <h3 className="font-semibold text-blue-200 mb-3">
                Order Summary
              </h3>
              <div className="space-y-2">
                {submittedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-white">
                      {item.quantity}x {item.size} {item.type}
                      {item.material && ` (${item.material})`}
                      {item.paper_type && ` (${item.paper_type})`}
                      {item.cover_type && ` (${item.cover_type})`}
                    </span>
                    <span className="text-blue-300">
                      Rs. {item.line_total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/20 mt-3 pt-3 flex justify-between text-lg font-bold">
                <span className="text-blue-200">Total:</span>
                <span className="text-blue-300">
                  Rs. {submittedOrder.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-green-900/20 rounded-lg border border-green-600/30 p-4 backdrop-blur-sm">
              <h3 className="font-semibold text-green-200 mb-2">
                What&apos;s Next?
              </h3>
              <ul className="text-sm text-green-200/80 space-y-1">
                <li>
                  • We&apos;ll process your order and contact you within 24
                  hours
                </li>
                <li>• Keep your order ID handy for order tracking</li>
                <li>
                  • You&apos;ll receive updates on your order status via email
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={startNewOrder}
                variant="outline"
                className="flex-1 bg-transparent border-blue-600/50 text-blue-100 hover:bg-blue-900/30 hover:border-blue-500/70"
              >
                Place Another Order
              </Button>
              <Button
                asChild
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <a href={`/${studioId}`}>Return to Studio</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Render Tabs and Forms ---
  return (
    <div className="container mx-auto py-16 px-4 max-w-3xl">
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 rounded-full">
          <TabsTrigger value="session" className="rounded-full">Book a Session</TabsTrigger>
          <TabsTrigger value="products" className="rounded-full">Order Products</TabsTrigger>
        </TabsList>

        {/* --- Session Booking Tab --- */}
        <TabsContent value="session">
          <h1 className="text-3xl font-bold text-center mb-2 text-white">
            Book Your Session
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Submit an inquiry for {studioName}
          </p>
          <Form {...bookingForm}>
            <form
              onSubmit={bookingForm.handleSubmit(onBookingSubmit)}
              className="space-y-6 bg-card/60 backdrop-blur-sm p-6 md:p-8 rounded-lg border border-white/10 shadow-lg"
            >
              {/* --- Full Name --- */}
              <FormField
                control={bookingForm.control}
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
                control={bookingForm.control}
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
                control={bookingForm.control}
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
                  control={bookingForm.control}
                  name="event_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Event Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedEventType(value);
                          bookingForm.setValue("package_name", "");
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
                            <SelectItem
                              key={type}
                              value={type}
                              className="hover:bg-gray-800"
                            >
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
                  control={bookingForm.control}
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
                            <SelectItem
                              key={pkg.id}
                              value={pkg.name || ""}
                              className="hover:bg-gray-800"
                            >
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
                  <p className="text-sm font-medium text-green-200">
                    Event Type:
                  </p>
                  <p className="text-white">{prefilledCategory}</p>
                </div>
              )}
              {prefilledPackage && (
                <div className="space-y-1 rounded-md border border-white/20 p-3 bg-black/30">
                  <p className="text-sm font-medium text-green-200">
                    Selected Package:
                  </p>
                  <p className="text-white">{prefilledPackage}</p>
                </div>
              )}

              {/* --- Event Date --- */}
              <FormField
                control={bookingForm.control}
                name="event_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">
                      Preferred Event Date
                    </FormLabel>
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
                control={bookingForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">
                      Additional Message (Optional)
                    </FormLabel>
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
                disabled={isSubmittingBooking}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmittingBooking ? "Submitting..." : "Submit Inquiry"}
              </Button>
            </form>
          </Form>
        </TabsContent>

        {/* --- Product Order Tab --- */}
        <TabsContent value="products">
          <h1 className="text-3xl font-bold text-center mb-2 text-white">
            Order Products
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Select frames, prints, or albums for purchase.
          </p>
          {productFetchError && (
            <p className="text-destructive text-center mb-4">
              {productFetchError}
            </p>
          )}
          <Form {...productForm}>
            <form
              onSubmit={productForm.handleSubmit(onProductOrderSubmit)}
              className="space-y-8 bg-card/60 backdrop-blur-sm p-6 md:p-8 rounded-lg border border-white/10 shadow-lg"
            >
              {/* Customer Details */}
              <div className="space-y-4">
                <FormField
                  control={productForm.control}
                  name="customer_name"
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
                <FormField
                  control={productForm.control}
                  name="customer_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Email Address
                      </FormLabel>
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
                <FormField
                  control={productForm.control}
                  name="customer_mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Mobile Number (Optional)
                      </FormLabel>
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
              </div>

              {/* Frames Section */}
              {frames.length > 0 && (
                <Card className="bg-black/30 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Frames
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Select quantities for frame orders
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {frameFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-lg bg-black/20 border border-white/5"
                      >
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-white">
                            {frames[index]?.size}{" "}
                            {frames[index]?.material &&
                              `(${frames[index]?.material})`}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Rs. {frames[index]?.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentValue =
                                productForm.getValues(
                                  `frames.${index}.quantity`
                                ) || 0;
                              if (currentValue > 0) {
                                productForm.setValue(
                                  `frames.${index}.quantity`,
                                  currentValue - 1
                                );
                              }
                            }}
                            className="h-8 w-8 p-0 bg-red-600/20 border-red-500/30 text-white hover:bg-red-600/30 hover:border-red-500/50"
                            disabled={
                              (productForm.getValues(
                                `frames.${index}.quantity`
                              ) || 0) === 0
                            }
                          >
                            -
                          </Button>
                          <FormField
                            control={productForm.control}
                            name={`frames.${index}.quantity`}
                            render={({ field: qtyField }) => (
                              <Input
                                type="number"
                                min="0"
                                {...qtyField}
                                onChange={(e) =>
                                  qtyField.onChange(
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-16 h-8 text-sm bg-black/50 border-white/20 text-white text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            )}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentValue =
                                productForm.getValues(
                                  `frames.${index}.quantity`
                                ) || 0;
                              productForm.setValue(
                                `frames.${index}.quantity`,
                                currentValue + 1
                              );
                            }}
                            className="h-8 w-8 p-0 bg-green-600/20 border-green-500/30 text-white hover:bg-green-600/30 hover:border-green-500/50"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Prints Section */}
              {printSizes.length > 0 && (
                <Card className="bg-black/30 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Prints
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Select quantities for print orders
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {printFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-lg bg-black/20 border border-white/5"
                      >
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-white">
                            {printSizes[index]?.size}{" "}
                            {printSizes[index]?.paper_type &&
                              `(${printSizes[index]?.paper_type})`}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Rs. {printSizes[index]?.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentValue =
                                productForm.getValues(
                                  `prints.${index}.quantity`
                                ) || 0;
                              if (currentValue > 0) {
                                productForm.setValue(
                                  `prints.${index}.quantity`,
                                  currentValue - 1
                                );
                              }
                            }}
                            className="h-8 w-8 p-0 bg-red-600/20 border-red-500/30 text-white hover:bg-red-600/30 hover:border-red-500/50"
                            disabled={
                              (productForm.getValues(
                                `prints.${index}.quantity`
                              ) || 0) === 0
                            }
                          >
                            -
                          </Button>
                          <FormField
                            control={productForm.control}
                            name={`prints.${index}.quantity`}
                            render={({ field: qtyField }) => (
                              <Input
                                type="number"
                                min="0"
                                {...qtyField}
                                onChange={(e) =>
                                  qtyField.onChange(
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-16 h-8 text-sm bg-black/50 border-white/20 text-white text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            )}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentValue =
                                productForm.getValues(
                                  `prints.${index}.quantity`
                                ) || 0;
                              productForm.setValue(
                                `prints.${index}.quantity`,
                                currentValue + 1
                              );
                            }}
                            className="h-8 w-8 p-0 bg-green-600/20 border-green-500/30 text-white hover:bg-green-600/30 hover:border-green-500/50"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Albums Section */}
              {albums.length > 0 && (
                <Card className="bg-black/30 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Albums
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Select quantities for album orders
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {albumFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-lg bg-black/20 border border-white/5"
                      >
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-white">
                            {albums[index]?.size}{" "}
                            {albums[index]?.cover_type &&
                              `(${albums[index]?.cover_type})`}{" "}
                            - {albums[index]?.page_count} pages
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Rs. {albums[index]?.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentValue =
                                productForm.getValues(
                                  `albums.${index}.quantity`
                                ) || 0;
                              if (currentValue > 0) {
                                productForm.setValue(
                                  `albums.${index}.quantity`,
                                  currentValue - 1
                                );
                              }
                            }}
                            className="h-8 w-8 p-0 bg-red-600/20 border-red-500/30 text-white hover:bg-red-600/30 hover:border-red-500/50"
                            disabled={
                              (productForm.getValues(
                                `albums.${index}.quantity`
                              ) || 0) === 0
                            }
                          >
                            -
                          </Button>
                          <FormField
                            control={productForm.control}
                            name={`albums.${index}.quantity`}
                            render={({ field: qtyField }) => (
                              <Input
                                type="number"
                                min="0"
                                {...qtyField}
                                onChange={(e) =>
                                  qtyField.onChange(
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-16 h-8 text-sm bg-black/50 border-white/20 text-white text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            )}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentValue =
                                productForm.getValues(
                                  `albums.${index}.quantity`
                                ) || 0;
                              productForm.setValue(
                                `albums.${index}.quantity`,
                                currentValue + 1
                              );
                            }}
                            className="h-8 w-8 p-0 bg-green-600/20 border-green-500/30 text-white hover:bg-green-600/30 hover:border-green-500/50"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Order Total - Simple Green Design */}
              <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-6 text-center">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-200">
                    Order Total
                  </p>
                  <p className="text-3xl font-bold text-green-300">
                    Rs. {orderTotal.toLocaleString()}
                  </p>
                  {orderTotal === 0 ? (
                    <p className="text-sm text-green-200/70">
                      Add items to your cart
                    </p>
                  ) : (
                    <p className="text-sm text-green-200/70">
                      Ready to place order
                    </p>
                  )}
                </div>
              </div>
              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmittingOrder || orderTotal === 0}
                className="w-full bg-green-600 hover:bg-blue-700 text-white"
              >
                {isSubmittingOrder
                  ? "Placing Order..."
                  : `Place Order - Rs. ${orderTotal.toLocaleString()}`}
              </Button>
              {productForm.formState.errors.frames && (
                <p className="text-sm font-medium text-destructive text-center">
                  {productForm.formState.errors.frames.message}
                </p>
              )}
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
