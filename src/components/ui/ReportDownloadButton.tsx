// components/ui/ReportDownloadButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { generateMonthlyReport } from "../../lib/actions";

interface ReportDownloadButtonProps {
  userRole: string;
}

export function ReportDownloadButton({ userRole }: ReportDownloadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );

  // Only show for management
  if (userRole !== "management") {
    return null;
  }

  const handleDownload = async () => {
    setIsGenerating(true);
    
    try {
      const result = await generateMonthlyReport(selectedMonth, selectedYear);

      if (result.error) {
        toast.error("Download Failed", {
          description: result.error
        });
        return;
      }

      if (result.success && result.data) {
        // Create download link
        const link = document.createElement('a');
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data}`;
        link.download = result.fileName || `report-${selectedMonth}-${selectedYear}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Report Downloaded", {
          description: `Monthly report for ${getMonthName(parseInt(selectedMonth))} ${selectedYear} has been downloaded.`
        });
        
        setIsOpen(false);
      }
    } catch {
      toast.error("Download Failed", {
        description: "An unexpected error occurred."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Monthly Report</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="month">Select Month</Label>
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month} value={month.toString()}>
                    {getMonthName(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Select Year</Label>
            <Select
              value={selectedYear}
              onValueChange={setSelectedYear}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This report will include:
            </p>
            <ul className="text-xs text-blue-600 dark:text-blue-400 mt-1 space-y-1">
              <li>• Complete booking details for {getMonthName(parseInt(selectedMonth))} {selectedYear}</li>
              <li>• Package-wise analytics and revenue</li>
              <li>• Staff assignment tracking</li>
              <li>• Category breakdown</li>
              <li>• Financial summary</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Download Excel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}