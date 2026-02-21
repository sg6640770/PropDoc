import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "approved" | "signed" | "declined" | "success" | "failed";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-blue-50 text-blue-700 border-blue-200",
    signed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    declined: "bg-red-50 text-red-700 border-red-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };

  const labels = {
    pending: "Pending",
    approved: "Approved",
    signed: "Signed",
    declined: "Declined",
    success: "Success",
    failed: "Failed",
  };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-medium border",
      styles[status],
      className
    )}>
      {labels[status]}
    </span>
  );
}
