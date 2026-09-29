import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  PlusCircle,
  Calendar,
  Globe,
  Shield,
  Zap,
} from "lucide-react";
import { api } from "../services/api.ts";
import { EventCard, type EventItem } from "../components/events/EventCard.tsx";

export const HomePage: React.FC = () => {
  const [featuredEvents, setFeaturedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        setFeaturedEvents((res.data.events || []).slice(0, 3));
      } catch (err) {
        console.error("Failed to load featured events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-20 py-6">
      {/* ================= HERO SECTION ================= */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>Next Generation Event Management</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]"
        >
          Discover, Organize, & Attend{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            Unforgettable
          </span>{" "}
          Events.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed"
        >
          The all-in-one platform for technical conferences, hackathons, and community meetups.
          Browse curated gatherings worldwide or host your own.
        </motion.p>

        {/* Hero Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-4"
        >
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02]"
          >
            <span>Explore All Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/events/create"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl glass-card text-zinc-900 dark:text-zinc-100 font-semibold text-sm hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-all border border-zinc-200/80 dark:border-zinc-800"
          >
            <PlusCircle className="w-4 h-4 text-purple-500" />
            <span>Host an Event</span>
          </Link>
        </motion.div>
      </section>

      {/* ================= HIGHLIGHT FEATURES ================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div className="glass-card rounded-3xl p-6 border border-zinc-200/70 dark:border-zinc-800/80 hover:scale-[1.01] transition-transform">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
            Hybrid Formats
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Attend virtually via live links or join hands-on sessions at premier venues across the globe.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-zinc-200/70 dark:border-zinc-800/80 hover:scale-[1.01] transition-transform">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
            1-Click Registration
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Instant booking with duplicate prevention, real-time ticket statuses, and access credentials.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-zinc-200/70 dark:border-zinc-800/80 hover:scale-[1.01] transition-transform">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
            Verified Hosts
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Admin-vetted organizers and detailed rich text agendas ensuring professional experiences.
          </p>
        </div>
      </section>

      {/* ================= FEATURED UPCOMING EVENTS ================= */}
      <section className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Featured Events
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Top upcoming gatherings open for registration right now.
            </p>
          </div>
          <Link
            to="/events"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="glass-card rounded-3xl p-6 h-64 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                </div>
                <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : featuredEvents.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto mb-3 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              No Events Published Yet
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Be the first to publish an event on EventSphere!
            </p>
            <Link
              to="/events/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Event</span>
            </Link>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
