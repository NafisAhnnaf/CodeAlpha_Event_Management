import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  PlusCircle,
  MapPin,
  Globe,
  CreditCard,
  Ticket,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ImageIcon,
} from "lucide-react";
import { api } from "../services/api.ts";
import { RichTextEditor } from "../components/common/RichTextEditor.tsx";

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    summary: "",
    description: "",
    platform: "online" as "online" | "onsite",
    venue: "",
    banner_url: "",
    isPaid: false,
    start_date: "",
    end_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      setError("Event end date and time must be after the start date.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/events", {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      });

      const newEventId = response.data.event?.id;
      if (newEventId) {
        navigate(`/events/${newEventId}`);
      } else {
        navigate("/events");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to create event. Please verify all fields."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events</span>
        </Link>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-zinc-200/80 dark:border-zinc-800 shadow-xl space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">Organizer Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Create New Event
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Fill in the details below to publish your event.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. NextGen Web Summit 2026"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Short Summary */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Short Summary
            </label>
            <textarea
              rows={2}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="A brief 1-2 sentence hook displayed on event cards..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Platform and Pricing Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Platform Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, platform: "online" })}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    formData.platform === "online"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "glass text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Online / Virtual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, platform: "onsite" })}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    formData.platform === "onsite"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "glass text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Onsite / Physical</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Admission Fee
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPaid: false })}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    !formData.isPaid
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "glass text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>Free Entry</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPaid: true })}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    formData.isPaid
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "glass text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Paid Ticket</span>
                </button>
              </div>
            </div>
          </div>

          {/* Venue / Meeting Link */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {formData.platform === "online" ? "Meeting URL / Platform Link *" : "Physical Venue Address *"}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                {formData.platform === "online" ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
              </div>
              <input
                type="text"
                required
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder={
                  formData.platform === "online"
                    ? "https://zoom.us/j/123456789 or Google Meet URL"
                    : "e.g. Grand Convention Center, Hall B, New Delhi / Dhaka"
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Banner Image URL (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Event Banner / Thumbnail Image URL (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <ImageIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={formData.banner_url}
                onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                placeholder="e.g. /banners/hackathon_2026_horiz.png or https://images.unsplash.com/..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            {formData.banner_url && (
              <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <img
                  src={formData.banner_url}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Start Date & Time *
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                End Date & Time *
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>
          </div>

          {/* Rich Text Editor for Detailed Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Event Description & Agenda (Rich Text Editor)
            </label>
            <RichTextEditor
              content={formData.description}
              onChange={(html) => setFormData({ ...formData, description: html })}
              placeholder="Detail your event agenda, guest speakers, prerequisites, and instructions..."
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-200/60 dark:border-zinc-800">
            <Link
              to="/events"
              className="px-5 py-2.5 rounded-xl glass text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Publishing Event...</span>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish Event</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;
