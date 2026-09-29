import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  Calendar,
  MapPin,
  ArrowRight,
  Sparkles,
  XCircle,
  RotateCcw,
  Search,
  AlertTriangle,
} from "lucide-react";
import { api } from "../services/api.ts";
import { Badge } from "../components/common/Badge.tsx";
import { formatDate } from "../lib/utils.ts";

export interface RegistrationItem {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  created_at: string;
  event: {
    id: string;
    name: string;
    summary: string | null;
    platform: "online" | "onsite";
    venue: string;
    banner_url?: string | null;
    isPaid: boolean;
    start_date: string;
    end_date: string;
    organizer?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export const MyRegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "pending" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Cancel Modal State
  const [cancellingItem, setCancellingItem] = useState<RegistrationItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await api.get("/events/my-registrations");
      setRegistrations(res.data.registrations || []);
    } catch (err) {
      console.error("Failed to load registrations", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // Filtered registrations based on tabs & search
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((item) => {
      // Tab matching
      if (activeTab === "active" && item.status !== "completed") return false;
      if (
        activeTab === "pending" &&
        item.status !== "pending_approval" &&
        item.status !== "pending_payment"
      )
        return false;
      if (activeTab === "cancelled" && item.status !== "cancelled" && item.status !== "rejected")
        return false;

      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.event?.name?.toLowerCase().includes(q);
        const matchesVenue = item.event?.venue?.toLowerCase().includes(q);
        return matchesName || matchesVenue;
      }

      return true;
    });
  }, [registrations, activeTab, searchQuery]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: registrations.length,
      active: registrations.filter((r) => r.status === "completed").length,
      pending: registrations.filter(
        (r) => r.status === "pending_approval" || r.status === "pending_payment"
      ).length,
      cancelled: registrations.filter(
        (r) => r.status === "cancelled" || r.status === "rejected"
      ).length,
    };
  }, [registrations]);

  // Handle Cancel Registration
  const handleConfirmCancel = async () => {
    if (!cancellingItem) return;
    setActionLoading(true);
    setNotification(null);

    try {
      const res = await api.patch(`/events/my-registrations/${cancellingItem.id}/cancel`);
      setNotification({ type: "success", text: res.data.message || "Registration cancelled successfully." });
      setCancellingItem(null);
      await fetchRegistrations();
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.response?.data?.message || "Failed to cancel registration.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reactivate Registration
  const handleReactivate = async (item: RegistrationItem) => {
    setActionLoading(true);
    setNotification(null);

    try {
      const res = await api.patch(`/events/my-registrations/${item.id}/reactivate`);
      setNotification({ type: "success", text: res.data.message || "Registration reactivated!" });
      await fetchRegistrations();
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.response?.data?.message || "Failed to reactivate registration.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            My Event Passes
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track confirmed bookings, manage upcoming attendance, or cancel registrations.
          </p>
        </div>

        <Link
          to="/events"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Browse More Events</span>
        </Link>
      </div>

      {/* Notifications */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            notification.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
          }`}
        >
          <span>{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl glass border border-zinc-200/80 dark:border-zinc-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            All Passes ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "active"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Confirmed ({counts.active})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "pending"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Pending ({counts.pending})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cancelled")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "cancelled"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Cancelled ({counts.cancelled})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event or venue..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 glass text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {/* Registration List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="glass-card rounded-3xl p-6 h-36 animate-pulse"
            />
          ))}
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto mb-4 flex items-center justify-center">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            No Registrations Found
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
            {searchQuery
              ? "No events match your current search query."
              : activeTab === "all"
              ? "You haven't reserved tickets for any events yet."
              : `No registrations found under the "${activeTab}" status filter.`}
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Discover Events</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRegistrations.map((item) => {
            const isCancelled = item.status === "cancelled" || item.status === "rejected";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`glass-card rounded-3xl p-5 sm:p-6 border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-xl ${
                  isCancelled
                    ? "border-zinc-200/50 dark:border-zinc-800/50 opacity-75"
                    : "border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-500/40"
                }`}
              >
                {/* Event Thumbnail & Metadata */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full md:w-auto">
                  {/* Thumbnail */}
                  <div className="w-full sm:w-36 h-28 sm:h-24 rounded-2xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-200/50 dark:border-zinc-800 relative">
                    {item.event.banner_url ? (
                      <img
                        src={item.event.banner_url}
                        alt={item.event.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-600/30 to-purple-600/30 flex items-center justify-center">
                        <Ticket className="w-8 h-8 text-indigo-400" />
                      </div>
                    )}
                  </div>

                  {/* Title & Info */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge type="status" value={item.status} />
                      <Badge type="platform" value={item.event.platform} />
                      <Badge type="price" value={item.event.isPaid} />
                    </div>

                    <Link
                      to={`/events/${item.event.id}`}
                      className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1 block"
                    >
                      {item.event.name}
                    </Link>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{formatDate(item.event.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate max-w-xs">
                        <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="truncate">{item.event.venue}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions & Timestamp */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-[11px] text-zinc-400">
                    Booked {new Date(item.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* If Cancelled: Show Reactivate Pass Button */}
                    {isCancelled ? (
                      <button
                        type="button"
                        onClick={() => handleReactivate(item)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-zinc-300 dark:border-zinc-700 text-indigo-600 dark:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reactivate Pass</span>
                      </button>
                    ) : (
                      /* If Active: Show Cancel Registration Button */
                      <button
                        type="button"
                        onClick={() => setCancellingItem(item)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Pass</span>
                      </button>
                    )}

                    {/* View Details Link */}
                    <Link
                      to={`/events/${item.event.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-white transition-all shadow-sm"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancellingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCancellingItem(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 glass-card rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Cancel Registration?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Are you sure you want to cancel your pass for{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    "{cancellingItem.event.name}"
                  </strong>
                  ? You will relinquish your reserved ticket, but you can reactivate it anytime before the event starts.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingItem(null)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl glass text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Keep My Pass
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/25 transition-all disabled:opacity-50"
                >
                  {actionLoading ? "Cancelling..." : "Yes, Cancel Registration"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyRegistrationsPage;
