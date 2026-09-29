import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight, Sparkles, ImageOff } from "lucide-react";
import { Badge } from "../common/Badge.tsx";
import { formatDate } from "../../lib/utils.ts";

export interface EventItem {
  id: string;
  name: string;
  summary: string | null;
  platform: "online" | "onsite";
  venue: string;
  isPaid: boolean;
  start_date: string;
  end_date: string;
  banner_url?: string | null;
  organizer?: {
    id: string;
    name: string;
    email?: string;
  };
}

interface EventCardProps {
  event: EventItem;
}

const fallbackGradients = [
  "from-indigo-600/80 via-purple-600/80 to-pink-600/80",
  "from-blue-600/80 via-cyan-600/80 to-teal-600/80",
  "from-violet-600/80 via-fuchsia-600/80 to-rose-600/80",
  "from-amber-600/80 via-orange-600/80 to-red-600/80",
  "from-emerald-600/80 via-teal-600/80 to-cyan-600/80",
];

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const [imageError, setImageError] = useState(false);

  // Deterministic gradient selection based on event name length
  const gradientIndex = (event.name.length + event.venue.length) % fallbackGradients.length;
  const gradientClass = fallbackGradients[gradientIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      <Link
        to={`/events/${event.id}`}
        className="group h-full glass-card rounded-3xl p-4 sm:p-5 border border-zinc-200/70 dark:border-zinc-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 block"
      >
        <div>
          {/* Banner Thumbnail Image Container */}
          <div className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800/80 mb-4 border border-zinc-200/40 dark:border-zinc-800/50">
            {event.banner_url && !imageError ? (
              <img
                src={event.banner_url}
                alt={event.name}
                loading="lazy"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center p-6 text-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 flex flex-col items-center gap-2 text-white">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                    {imageError ? <ImageOff className="w-5 h-5 text-white/90" /> : <Sparkles className="w-5 h-5 text-white/90" />}
                  </div>
                  <span className="text-xs font-semibold tracking-wide drop-shadow uppercase opacity-90">
                    {event.platform} Gathering
                  </span>
                </div>
              </div>
            )}

            {/* Gradient Shadow Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* Floating Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
              <Badge type="platform" value={event.platform} />
              <Badge type="price" value={event.isPaid} />
            </div>
          </div>

          {/* Title & Summary */}
          <div className="space-y-1.5 px-1">
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
              {event.name}
            </h3>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {event.summary || "Click to see complete schedule, speaker lineup, and registration details."}
            </p>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="pt-4 border-t border-zinc-200/50 dark:border-zinc-800/60 mt-4 space-y-2 text-xs text-zinc-500 dark:text-zinc-400 px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="font-medium">{formatDate(event.start_date)}</span>
          </div>

          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>

          {event.organizer && (
            <div className="flex items-center gap-2 truncate text-[11px] text-zinc-400">
              <span>Hosted by {event.organizer.name}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between font-semibold text-indigo-600 dark:text-indigo-400">
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
export default EventCard;
