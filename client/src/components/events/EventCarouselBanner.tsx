import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Badge } from "../common/Badge.tsx";
import { formatDate } from "../../lib/utils.ts";

export interface CarouselEvent {
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
  };
}

interface EventCarouselBannerProps {
  events: CarouselEvent[];
}

// Preset visual themes for events without a custom uploaded banner image
const bannerThemes = [
  "from-indigo-900 via-purple-900 to-zinc-950",
  "from-violet-900 via-fuchsia-900 to-zinc-950",
  "from-cyan-900 via-blue-900 to-zinc-950",
  "from-emerald-900 via-teal-900 to-zinc-950",
  "from-rose-900 via-purple-900 to-zinc-950",
];

export const EventCarouselBanner: React.FC<EventCarouselBannerProps> = ({ events }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Highlight events that have banner assets first, up to 6 slides
  const bannerEvents = events.filter((e) => Boolean(e.banner_url));
  const carouselItems = (bannerEvents.length > 0 ? bannerEvents : events).slice(0, 6);
  const total = carouselItems.length;

  // Auto-play slideshow every 5 seconds (paused on hover)
  useEffect(() => {
    if (total <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5000);

    return () => clearInterval(timer);
  }, [total, isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  if (total === 0) {
    return (
      <div className="relative w-full h-[260px] rounded-3xl overflow-hidden glass-card p-8 flex flex-col justify-center items-center text-center shadow-xl border border-zinc-200/80 dark:border-zinc-800">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-3 flex items-center justify-center">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Discover Upcoming Gatherings
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md">
          Join community meetups, technical conferences, and workshops hosted by top organizers worldwide.
        </p>
      </div>
    );
  }

  const currentEvent = carouselItems[currentIndex];
  if (!currentEvent) return null;

  const themeGradient = bannerThemes[currentIndex % bannerThemes.length];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-[360px] sm:h-[420px] rounded-3xl overflow-hidden shadow-2xl border border-zinc-200/80 dark:border-zinc-800 group"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentEvent.id}
          initial={{ opacity: 0, scale: 1.01 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Main Event Banner Image (or Dynamic Atmospheric Gradient) */}
          {currentEvent.banner_url ? (
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
              style={{ backgroundImage: `url(${currentEvent.banner_url})` }}
            />
          ) : (
            <div className={`absolute inset-0 w-full h-full bg-gradient-to-br ${themeGradient}`}>
              <div className="absolute top-10 right-20 w-80 h-80 rounded-full bg-white/10 blur-[80px] pointer-events-none" />
              <div className="absolute bottom-10 left-20 w-72 h-72 rounded-full bg-indigo-500/20 blur-[70px] pointer-events-none" />
            </div>
          )}

          {/* Transparent Backdrop: Darker Gradient Strictly Along the Bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none" />

          {/* Transparent Floating Information (Anchored at the Bottom) */}
          <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end">
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              className="space-y-2.5 max-w-3xl"
            >
              {/* Badges Floating Directly Over Image */}
              <div className="flex flex-wrap items-center gap-2 drop-shadow-md">
                <Badge type="platform" value={currentEvent.platform} />
                <Badge type="price" value={currentEvent.isPaid} />
                {currentEvent.organizer && (
                  <span className="text-[11px] font-semibold text-white/90 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                    By {currentEvent.organizer.name}
                  </span>
                )}
              </div>

              {/* Event Name */}
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight line-clamp-2 drop-shadow-lg">
                {currentEvent.name}
              </h2>

              {/* Summary */}
              {currentEvent.summary && (
                <p className="text-xs sm:text-sm text-zinc-200 line-clamp-1 drop-shadow-md font-medium max-w-2xl">
                  {currentEvent.summary}
                </p>
              )}

              {/* Date, Venue and Action Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs text-zinc-200">
                <div className="flex flex-wrap items-center gap-4 drop-shadow">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{formatDate(currentEvent.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate max-w-xs font-medium">
                    <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="truncate">{currentEvent.venue}</span>
                  </div>
                </div>

                <Link
                  to={`/events/${currentEvent.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-xs shadow-xl transition-all hover:scale-105"
                >
                  <span>Explore Event</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 hover:scale-105 z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 hover:scale-105 z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicator Dots */}
          <div className="absolute top-6 right-6 flex items-center gap-1.5 z-10">
            {carouselItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === idx
                    ? "w-7 bg-white shadow-md"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default EventCarouselBanner;
