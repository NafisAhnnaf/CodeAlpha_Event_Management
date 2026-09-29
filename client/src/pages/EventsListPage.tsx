import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { api } from "../services/api.ts";
import { EventCarouselBanner, type CarouselEvent } from "../components/events/EventCarouselBanner.tsx";
import { EventCard } from "../components/events/EventCard.tsx";

export const EventsListPage: React.FC = () => {
  const [events, setEvents] = useState<CarouselEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | "online" | "onsite">("all");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        setEvents(res.data.events || []);
      } catch (err) {
        console.error("Failed to load events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.summary?.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q)
      );
    }

    if (platformFilter !== "all") {
      result = result.filter((e) => e.platform === platformFilter);
    }

    if (priceFilter !== "all") {
      result = result.filter((e) => (priceFilter === "paid" ? e.isPaid : !e.isPaid));
    }

    return result;
  }, [searchTerm, platformFilter, priceFilter, events]);

  return (
    <div className="space-y-8 py-4">
      {/* Top Banner: Auto-Playing Event Carousel */}
      <EventCarouselBanner events={events} />

      {/* Filter and Search Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>All Gatherings & Conferences ({filteredEvents.length})</span>
          </div>

          <Link
            to="/events/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/25 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Event</span>
          </Link>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-card rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by event title, summary, or venue..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Filter Dropdowns / Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 glass p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
              {(["all", "online", "onsite"] as const).map((plat) => (
                <button
                  key={plat}
                  type="button"
                  onClick={() => setPlatformFilter(plat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                    platformFilter === plat
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {plat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 glass p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
              {(["all", "free", "paid"] as const).map((pr) => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setPriceFilter(pr)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                    priceFilter === pr
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {pr}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="glass-card rounded-3xl p-6 h-72 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5" />
              </div>
              <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto mb-4 flex items-center justify-center">
            <Filter className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            No Events Match Your Filters
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
            Try adjusting your search keyword or clearing the platform/price filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setPlatformFilter("all");
              setPriceFilter("all");
            }}
            className="px-4 py-2 rounded-xl glass text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsListPage;
