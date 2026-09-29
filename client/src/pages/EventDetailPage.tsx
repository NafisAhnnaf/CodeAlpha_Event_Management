import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Lock,
  ExternalLink,
} from "lucide-react";
import { api } from "../services/api.ts";
import { useAuthStore } from "../store/useAuthStore.ts";
import { Badge } from "../components/common/Badge.tsx";
import { formatDate } from "../lib/utils.ts";

interface EventDetail {
  id: string;
  name: string;
  summary: string | null;
  description: string | null;
  platform: "online" | "onsite";
  venue: string;
  banner_url?: string | null;
  isPaid: boolean;
  start_date: string;
  end_date: string;
  created_at: string;
  organizer_id: string;
  organizer?: {
    id: string;
    name: string;
    email: string;
  };
}

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(isAuthenticated);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchEventDetail = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data.event);
        setIsRegistered(res.data.isRegistered);
      } catch (err: any) {
        console.error("Failed to load event details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetail();
  }, [id, isAuthenticated]);

  const handleRegister = async () => {
    if (!id) return;
    setRegistering(true);
    setMessage(null);

    try {
      const res = await api.post(`/events/${id}/register`);
      setIsRegistered(true);
      setMessage({ type: "success", text: res.data.message });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to register for event.",
      });
    } finally {
      setRegistering(false);
    }
  };

  // If user is not logged in: display the login requirement guard
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 sm:p-12 glass-card rounded-3xl text-center border border-zinc-200/80 dark:border-zinc-800 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto mb-6 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          Sign In to View Event Details
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8 max-w-md mx-auto">
          Full agenda descriptions, venue addresses, and registration actions are reserved for registered attendees.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/auth"
            state={{ from: { pathname: `/events/${id}` } }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all"
          >
            Sign In / Sign Up
          </Link>
          <Link
            to="/events"
            className="w-full sm:w-auto px-6 py-3 rounded-xl glass text-zinc-700 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Back to Events List
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
        <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-card rounded-3xl text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Event Not Found
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
          The event you are looking for does not exist or may have been deleted.
        </p>
        <Link
          to="/events"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All Events</span>
        </Link>
      </div>
    );
  }

  const isOwnerOrAdmin = user?.id === event.organizer_id || user?.role === "admin";

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events</span>
        </Link>
      </div>

      {/* Optional Event Banner Hero Image */}
      {event.banner_url && (
        <div className="relative w-full h-56 sm:h-80 md:h-96 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-900">
          <img
            src={event.banner_url}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
        </div>
      )}

      {/* Main Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-zinc-200/80 dark:border-zinc-800 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge type="platform" value={event.platform} />
            <Badge type="price" value={event.isPaid} />
          </div>

          {/* Organizer / Admin Actions */}
          {isOwnerOrAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                You are managing this event
              </span>
            </div>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">
          {event.name}
        </h1>

        {event.summary && (
          <p className="text-base text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
            {event.summary}
          </p>
        )}

        {/* Date, Time, and Venue Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/80">
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl glass border border-zinc-200/60 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
                Date & Time
              </span>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {formatDate(event.start_date)}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                To {formatDate(event.end_date)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl glass border border-zinc-200/60 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
                Location & Venue
              </span>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">
                {event.venue}
              </p>
              {event.platform === "online" && (
                <span className="text-[11px] text-indigo-500 font-medium flex items-center gap-1 mt-0.5">
                  <ExternalLink className="w-3 h-3" />
                  <span>Access link provided upon registration</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Registration CTA Banner */}
        <div className="pt-2">
          {message && (
            <div
              className={`mb-4 p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {isRegistered ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    You Are Registered!
                  </h4>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                    Your spot is secured. Check your registered events anytime under "My Tickets".
                  </p>
                </div>
              </div>

              <Link
                to="/my-registrations"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/25 transition-all text-center"
              >
                View My Ticket
              </Link>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Reserve Your Spot Today</span>
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {event.isPaid
                    ? "Paid registration required. Reserve now and complete checkout."
                    : "Free entry. Instant registration confirmation."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRegister}
                disabled={registering}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 disabled:opacity-50 shrink-0"
              >
                {registering ? "Registering..." : "Register Now"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description Section with TipTap Prose */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-zinc-200/80 dark:border-zinc-800 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span>About This Event</span>
        </h2>

        {event.description ? (
          <div
            className="tiptap prose dark:prose-invert max-w-none text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
        ) : (
          <p className="text-xs text-zinc-500 italic">
            No detailed description was provided by the organizer.
          </p>
        )}
      </div>

      {/* Organizer Info Card */}
      {event.organizer && (
        <div className="glass-card rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Event Organizer
              </span>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {event.organizer.name}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {event.organizer.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
