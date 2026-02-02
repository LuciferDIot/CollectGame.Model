import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'neutral';
  text?: string;
  icon?: boolean;
  className?: string;
}

export function StatusBadge({ status, text, icon = true, className }: StatusBadgeProps) {
  const isSuccess = status === 'success';
  const isWarning = status === 'warning';
  const isError = status === 'error';
  const isNeutral = status === 'neutral';

  const styleMap = {
    success: "text-green-600 bg-green-950/10",
    warning: "text-amber-500 bg-amber-950/10",
    error: "text-red-500 bg-red-950/10",
    neutral: "text-primary bg-primary/10",
  };

  const iconMap = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
    neutral: Info,
  };

  const Icon = iconMap[status] || Info;
  const badgeStyle = styleMap[status] || styleMap.neutral;

  const defaultTextMap = {
      success: "Success",
      warning: "Warning",
      error: "Error",
      neutral: "Info"
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1 font-medium text-xs px-2 py-1 rounded-full",
      badgeStyle,
      className
    )}>
      {icon && <Icon className="h-3 w-3" />}
      {text || defaultTextMap[status]}
    </span>
  );
}
