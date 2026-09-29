import React from "react";
import {
  Globe,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  Ticket,
} from "lucide-react";

interface BadgeProps {
  type: "platform" | "price" | "status";
  value: string | boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, className = "" }) => {
  if (type === "platform") {
    const isOnline = value === "online";
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md ${
          isOnline
            ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
        } ${className}`}
      >
        {isOnline ? (
          <Globe className="w-3.5 h-3.5" />
        ) : (
          <MapPin className="w-3.5 h-3.5" />
        )}
        <span className="capitalize">{String(value)}</span>
      </span>
    );
  }

  if (type === "price") {
    const isPaid = Boolean(value);
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
          isPaid
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
        } ${className}`}
      >
        {isPaid ? (
          <CreditCard className="w-3.5 h-3.5" />
        ) : (
          <Ticket className="w-3.5 h-3.5" />
        )}
        <span>{isPaid ? "Paid Event" : "Free"}</span>
      </span>
    );
  }

  // Registration Status
  const statusConfig: Record<
    string,
    { label: string; icon: React.ComponentType<{ className?: string }>; style: string }
  > = {
    completed: {
      label: "Confirmed",
      icon: CheckCircle2,
      style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    pending_approval: {
      label: "Pending Approval",
      icon: Clock,
      style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    pending_payment: {
      label: "Pending Payment",
      icon: AlertCircle,
      style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      style: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    },
    rejected: {
      label: "Rejected",
      icon: XCircle,
      style: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
  };

  const current = statusConfig[String(value)] || {
    label: String(value),
    icon: Clock,
    style: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  };
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-md ${current.style} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{current.label}</span>
    </span>
  );
};

export default Badge;
