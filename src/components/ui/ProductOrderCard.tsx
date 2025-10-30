// components/ui/ProductOrderCard.tsx
"use client";

import { useState } from "react";
import { ProductOrder } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, ShoppingCart, DollarSign, Camera, Edit } from "lucide-react";
import { UpdateProductOrderStatus } from "./UpdateProductOrderStatus";
import { AssignProductOrderPhotographers } from "./AssignProductOrderPhotographers";
import { ProductOrderFinancialDialog } from "./ProductOrderFinancialDialog";
import { DeleteProductOrderButton } from "./DeleteProductOrderButton";
import { EditProductOrderDialog } from "./EditProductOrderDialog";
import { Button } from "./button";

interface ProductOrderCardProps {
  order: ProductOrder;
  userRole: string;
  availableStaff: { id: string; full_name: string }[];
}

// Define proper types for ordered items
interface OrderedItem {
  size: string;
  type: string;
  material?: string;
  paper_type?: string;
  cover_type?: string;
  page_count?: number;
  quantity: number;
  line_total: number;
}

// Helper to format currency
const formatCurrency = (amount: number) => {
  return `Rs. ${amount.toLocaleString('en-LK')}`;
};

// Helper to format item details with proper typing
const formatItemDetails = (item: OrderedItem) => {
  let details = `${item.size}`;
  if (item.type === 'frame' && item.material) details += `, ${item.material}`;
  if (item.type === 'print' && item.paper_type) details += `, ${item.paper_type}`;
  if (item.type === 'album') details += `, ${item.cover_type}, ${item.page_count} Pages`;
  return details;
};

export function ProductOrderCard({ order, userRole, availableStaff }: ProductOrderCardProps) {
  const [isFinancialDialogOpen, setIsFinancialDialogOpen] = useState(false);
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
    if (!studioSlug) return "Unknown Studio";
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
                {order.customer_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Order ID: {order.order_id}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Date: {formatDate(order.created_at)}
              </p>
            </div>
            <UpdateProductOrderStatus
              orderId={order.id}
              currentStatus={order.status || "Pending"}
              userRole={userRole}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Studio Badge */}
          <div className="flex items-center gap-2 text-sm">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Studio:</span>
            <Badge variant="secondary" className="text-xs">
              {formatStudioName(order.studio_slug)}
            </Badge>
          </div>
        
          {/* Contact Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${order.customer_email}`}
                className="text-blue-600 hover:underline"
              >
                {order.customer_email}
              </a>
            </div>
            {order.customer_mobile && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${order.customer_mobile}`}
                  className="text-blue-600 hover:underline"
                >
                  {order.customer_mobile}
                </a>
              </div>
            )}
          </div>

          {/* Ordered Items */}
          <div className="border-t pt-3 space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              Ordered Items
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {order.ordered_items?.map((item, index) => (
                <li key={index} className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <span className="font-medium text-foreground">
                      {item.quantity}x
                    </span>{" "}
                    <Badge variant="secondary" className="text-xs capitalize mr-1">{item.type}</Badge>
                    {formatItemDetails(item as OrderedItem)}
                  </div>
                  <span className="font-medium text-foreground">
                    {formatCurrency(item.line_total)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Total Amount */}
          <div className="border-t pt-3 flex justify-between items-center">
            <h4 className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Total Amount
            </h4>
            <span className="text-lg font-bold">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
          
          {/* Financial Status */}
          {order.financial_entry && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Financials:</span>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                Completed
              </Badge>
            </div>
          )}
          
          {/* Assigned Photographers */}
          {order.assigned_photographers &&
            order.assigned_photographers.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Assigned Staff:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {order.assigned_photographers.map((photographer, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {photographer}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {/* Action Buttons */}
          {userRole === "management" && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFinancialDialogOpen(true)}
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Financial
              </Button>
              <AssignProductOrderPhotographers
                orderId={order.id}
                currentAssignments={order.assigned_photographers || []}
                availableStaff={availableStaff}
                userRole={userRole}
              />
              <DeleteProductOrderButton
                orderId={order.id}
                userRole={userRole}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      {userRole === "management" && (
        <EditProductOrderDialog
          order={order}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}

      {/* Financial Dialog */}
      {userRole === "management" && (
        <ProductOrderFinancialDialog
          order={order}
          open={isFinancialDialogOpen}
          onOpenChange={setIsFinancialDialogOpen}
        />
      )}
    </>
  );
}