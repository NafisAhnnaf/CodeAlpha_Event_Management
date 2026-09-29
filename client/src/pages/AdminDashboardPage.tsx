import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Users,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  PlusCircle,
  ExternalLink,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { api } from "../services/api.ts";
import { useAuthStore } from "../store/useAuthStore.ts";
import { Badge } from "../components/common/Badge.tsx";
import { formatDate } from "../lib/utils.ts";

export interface ManageRegistration {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    dob?: string;
    role?: string;
  };
  event: {
    id: string;
    name: string;
    venue: string;
    platform: "online" | "onsite";
    start_date: string;
    end_date: string;
    banner_url?: string | null;
    isPaid: boolean;
    organizer?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface DashboardEvent {
  id: string;
  name: string;
  summary: string | null;
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

const statusOptions = [
  { value: "completed", label: "Confirmed / Completed", color: "text-emerald-500" },
  { value: "pending_approval", label: "Pending Approval", color: "text-amber-500" },
  { value: "pending_payment", label: "Pending Payment", color: "text-purple-500" },
  { value: "cancelled", label: "Cancelled", color: "text-rose-500" },
  { value: "rejected", label: "Rejected", color: "text-red-500" },
];

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"registrations" | "events">("registrations");
  const [registrations, setRegistrations] = useState<ManageRegistration[]>([]);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters for registrations tab
  const [regSearch, setRegSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Filters for events tab
  const [eventSearch, setEventSearch] = useState("");

  // Modals state
  const [statusModalReg, setStatusModalReg] = useState<ManageRegistration | null>(null);
  const [deleteModalReg, setDeleteModalReg] = useState<ManageRegistration | null>(null);
  const [attendeesModalEvent, setAttendeesModalEvent] = useState<DashboardEvent | null>(null);
  const [deleteModalEvent, setDeleteModalEvent] = useState<DashboardEvent | null>(null);
  const [editModalEvent, setEditModalEvent] = useState<DashboardEvent | null>(null);

  // Notification state
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all registrations & events
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [regsRes, eventsRes] = await Promise.all([
        api.get("/events/manage/all-registrations"),
        api.get("/events"),
      ]);
      setRegistrations(regsRes.data.registrations || []);
      
      const allEvents: DashboardEvent[] = eventsRes.data.events || [];
      // If organizer, optionally filter to their own events, or show all if admin
      if (isAdmin) {
        setEvents(allEvents);
      } else {
        setEvents(allEvents.filter((e) => e.organizer_id === user?.id));
      }
    } catch (err: any) {
      console.error("Dashboard data load error:", err);
      setNotification({
        type: "error",
        text: err.response?.data?.message || "Failed to load dashboard records.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      // Event filter
      if (selectedEventId !== "all" && r.event_id !== selectedEventId) return false;

      // Status filter
      if (selectedStatus !== "all" && r.status !== selectedStatus) return false;

      // Search query (attendee name, attendee email, event name)
      if (regSearch.trim()) {
        const q = regSearch.toLowerCase();
        const matchUser =
          r.user?.name?.toLowerCase().includes(q) ||
          r.user?.email?.toLowerCase().includes(q);
        const matchEvent = r.event?.name?.toLowerCase().includes(q);
        return matchUser || matchEvent;
      }

      return true;
    });
  }, [registrations, selectedEventId, selectedStatus, regSearch]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (!eventSearch.trim()) return events;
    const q = eventSearch.toLowerCase();
    return events.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.summary?.toLowerCase().includes(q)
    );
  }, [events, eventSearch]);

  // Statistics
  const stats = useMemo(() => {
    const totalRegs = registrations.length;
    const confirmed = registrations.filter((r) => r.status === "completed").length;
    const pending = registrations.filter(
      (r) => r.status === "pending_approval" || r.status === "pending_payment"
    ).length;
    const cancelled = registrations.filter(
      (r) => r.status === "cancelled" || r.status === "rejected"
    ).length;

    return { totalRegs, confirmed, pending, cancelled, totalEvents: events.length };
  }, [registrations, events]);

  // Action: Change Status of an Attendee
  const handleUpdateStatus = async (newStatus: string) => {
    if (!statusModalReg) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/events/manage/registrations/${statusModalReg.id}/status`, {
        status: newStatus,
      });
      setNotification({ type: "success", text: res.data.message || "Status updated successfully." });
      setStatusModalReg(null);
      await loadDashboardData();
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.response?.data?.message || "Failed to update attendee status.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Delete Registration Record
  const handleDeleteRegistration = async () => {
    if (!deleteModalReg) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/events/manage/registrations/${deleteModalReg.id}`);
      setNotification({ type: "success", text: res.data.message || "Registration deleted." });
      setDeleteModalReg(null);
      await loadDashboardData();
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.response?.data?.message || "Failed to delete registration.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Delete Event
  const handleDeleteEvent = async () => {
    if (!deleteModalEvent) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/events/${deleteModalEvent.id}`);
      setNotification({ type: "success", text: res.data.message || "Event deleted successfully." });
      setDeleteModalEvent(null);
      await loadDashboardData();
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.response?.data?.message || "Failed to delete event.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Save Edited Event
  const handleSaveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalEvent) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/events/${editModalEvent.id}`, {
        name: editModalEvent.name,
        summary: editModalEvent.summary,
        platform: editModalEvent.platform,
        venue: editModalEvent.venue,
        banner_url: editModalEvent.banner_url,
        isPaid: editModalEvent.isPaid,
        start_date: new Date(editModalEvent.start_date).toISOString(),
        end_date: new Date(editModalEvent.end_date).toISOString(),
      });
      setNotification({ type: "success", text: res.data.message || "Event updated successfully." });
      setEditModalEvent(null);
      await loadDashboardData();
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.response?.data?.message || "Failed to save event updates.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAdmin ? "Administrator Command Center" : "Organizer Command Center"}</span>
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Control Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage registrations, attendee approvals, event statuses, and publishing controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl glass text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all border border-zinc-200/80 dark:border-zinc-800"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <Link
            to="/events/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Event</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
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

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-3xl p-5 border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Events</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-2">{stats.totalEvents}</p>
          <span className="text-[10px] text-zinc-400 mt-0.5 block">{isAdmin ? "All Platform Gatherings" : "Hosted by You"}</span>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Attendees</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-2">{stats.totalRegs}</p>
          <span className="text-[10px] text-zinc-400 mt-0.5 block">Total Registrations</span>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Confirmed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{stats.confirmed}</p>
          <span className="text-[10px] text-zinc-400 mt-0.5 block">Approved & Confirmed</span>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Pending Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">{stats.pending}</p>
          <span className="text-[10px] text-zinc-400 mt-0.5 block">Awaiting Approval/Pay</span>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl glass border border-zinc-200/80 dark:border-zinc-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("registrations")}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "registrations"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manage Registrations ({registrations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("events")}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "events"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Manage Events ({events.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: REGISTRATIONS MANAGEMENT ================= */}
      {activeTab === "registrations" && (
        <div className="space-y-4">
          {/* Controls Bar: Filters & Search */}
          <div className="glass-card rounded-3xl p-4 sm:p-5 border border-zinc-200/80 dark:border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                placeholder="Search attendee by name, email, or event title..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 glass text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Event selector */}
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                aria-label="Filter by Event"
                className="px-3 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 glass text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="all">All Events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name.length > 30 ? ev.name.slice(0, 30) + "..." : ev.name}
                  </option>
                ))}
              </select>

              {/* Status selector */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Filter by Status"
                className="px-3 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 glass text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Confirmed / Completed</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Registrations Table / Grid */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="glass-card rounded-2xl p-5 h-20 animate-pulse" />
              ))}
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="glass-card rounded-3xl p-14 text-center max-w-md mx-auto">
              <Users className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                No Matching Registrations
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Try modifying your search or clearing the status and event filters.
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-3xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Attendee</th>
                      <th className="px-5 py-3.5">Event</th>
                      <th className="px-5 py-3.5">Registered On</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/60">
                    {filteredRegistrations.map((reg) => (
                      <tr
                        key={reg.id}
                        className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        {/* Attendee Info */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            {reg.user?.name || "Unknown User"}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {reg.user?.email}
                          </div>
                          {reg.user?.role && (
                            <span className="inline-block text-[9px] uppercase font-bold text-indigo-500">
                              {reg.user.role}
                            </span>
                          )}
                        </td>

                        {/* Event Info */}
                        <td className="px-5 py-4 max-w-xs">
                          <Link
                            to={`/events/${reg.event?.id}`}
                            className="font-semibold text-zinc-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block"
                          >
                            {reg.event?.name}
                          </Link>
                          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                            <span className="capitalize">{reg.event?.platform}</span>
                            <span>•</span>
                            <span className="truncate">{reg.event?.venue}</span>
                          </div>
                        </td>

                        {/* Registered Date */}
                        <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {new Date(reg.created_at).toLocaleDateString()}
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Badge type="status" value={reg.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setStatusModalReg(reg)}
                              className="px-3 py-1.5 rounded-xl glass border border-zinc-200/80 dark:border-zinc-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                              Update Status
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteModalReg(reg)}
                              className="p-1.5 rounded-xl glass text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                              title="Delete registration record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: EVENTS MANAGEMENT ================= */}
      {activeTab === "events" && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="glass-card rounded-3xl p-4 sm:p-5 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Search events by name or venue..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 glass text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <span className="text-xs text-zinc-500 font-medium">
              Showing {filteredEvents.length} events
            </span>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="glass-card rounded-3xl p-6 h-48 animate-pulse" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-card rounded-3xl p-14 text-center max-w-md mx-auto">
              <Calendar className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                No Events Found
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                You can create a new event using the button in the top right.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.map((ev) => {
                const eventAttendeeCount = registrations.filter((r) => r.event_id === ev.id).length;

                return (
                  <div
                    key={ev.id}
                    className="glass-card rounded-3xl p-5 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      {/* Event Banner */}
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-200/50 dark:border-zinc-800 relative">
                        {ev.banner_url ? (
                          <img
                            src={ev.banner_url}
                            alt={ev.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-600/30 to-purple-600/30 flex items-center justify-center">
                            <Calendar className="w-7 h-7 text-indigo-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Badge type="platform" value={ev.platform} />
                          <Badge type="price" value={ev.isPaid} />
                        </div>

                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {ev.name}
                        </h3>

                        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>

                        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{formatDate(ev.start_date)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-200/60 dark:border-zinc-800/80 text-xs">
                      <span className="font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{eventAttendeeCount} Registered</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {/* View Attendees Modal */}
                        <button
                          type="button"
                          onClick={() => setAttendeesModalEvent(ev)}
                          className="px-3 py-1.5 rounded-xl glass border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          Attendees
                        </button>

                        {/* Edit Event Modal */}
                        <button
                          type="button"
                          onClick={() => setEditModalEvent(ev)}
                          className="p-1.5 rounded-xl glass text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 border border-zinc-200 dark:border-zinc-800 transition-colors"
                          title="Edit Event"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete Event Modal */}
                        <button
                          type="button"
                          onClick={() => setDeleteModalEvent(ev)}
                          className="p-1.5 rounded-xl glass text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Public Link */}
                        <Link
                          to={`/events/${ev.id}`}
                          className="p-1.5 rounded-xl glass text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 transition-colors"
                          title="View Public Event Page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL 1: UPDATE REGISTRATION STATUS ================= */}
      <AnimatePresence>
        {statusModalReg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStatusModalReg(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 glass-card rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 space-y-4"
            >
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Update Attendee Registration Status
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Attendee: <strong>{statusModalReg.user?.name}</strong> ({statusModalReg.user?.email})
                <br />
                Event: <strong>{statusModalReg.event?.name}</strong>
              </p>

              <div className="space-y-2 pt-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleUpdateStatus(opt.value)}
                    disabled={actionLoading}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl glass border transition-all text-xs font-semibold ${
                      statusModalReg.status === opt.value
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <Badge type="status" value={opt.value} />
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalReg(null)}
                  className="px-4 py-2 rounded-xl glass text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 2: DELETE REGISTRATION CONFIRMATION ================= */}
      <AnimatePresence>
        {deleteModalReg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModalReg(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 glass-card rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Delete Registration Record?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Are you sure you want to permanently delete the registration record for{" "}
                <strong>{deleteModalReg.user?.name}</strong> from{" "}
                <strong>{deleteModalReg.event?.name}</strong>? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalReg(null)}
                  className="px-4 py-2 rounded-xl glass text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Keep Record
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRegistration}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/25 transition-all disabled:opacity-50"
                >
                  {actionLoading ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 3: VIEW ATTENDEES FOR AN EVENT ================= */}
      <AnimatePresence>
        {attendeesModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAttendeesModalEvent(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl max-h-[80vh] flex flex-col p-6 glass-card rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Attendees: {attendeesModalEvent.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {registrations.filter((r) => r.event_id === attendeesModalEvent.id).length} registered participants
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAttendeesModalEvent(null)}
                  className="p-1.5 rounded-xl glass text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-zinc-200/50 dark:divide-zinc-800/60">
                {registrations.filter((r) => r.event_id === attendeesModalEvent.id).length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400">
                    No attendees registered for this event yet.
                  </div>
                ) : (
                  registrations
                    .filter((r) => r.event_id === attendeesModalEvent.id)
                    .map((r) => (
                      <div
                        key={r.id}
                        className="pt-2.5 pb-2 flex items-center justify-between gap-4 text-xs"
                      >
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            {r.user?.name}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {r.user?.email} • Registered {new Date(r.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge type="status" value={r.status} />
                          <button
                            type="button"
                            onClick={() => setStatusModalReg(r)}
                            className="px-2.5 py-1 rounded-lg glass text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAttendeesModalEvent(null)}
                  className="px-4 py-2 rounded-xl glass text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 4: EDIT EVENT ================= */}
      <AnimatePresence>
        {editModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditModalEvent(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 glass-card rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 space-y-4"
            >
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Edit Event: {editModalEvent.name}
              </h3>

              <form onSubmit={handleSaveEditEvent} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Event Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editModalEvent.name}
                    onChange={(e) => setEditModalEvent({ ...editModalEvent, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 glass text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Summary
                  </label>
                  <input
                    type="text"
                    value={editModalEvent.summary || ""}
                    onChange={(e) => setEditModalEvent({ ...editModalEvent, summary: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 glass text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Platform
                    </label>
                    <select
                      value={editModalEvent.platform}
                      onChange={(e) =>
                        setEditModalEvent({
                          ...editModalEvent,
                          platform: e.target.value as "online" | "onsite",
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 glass text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="online">Online</option>
                      <option value="onsite">Onsite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Admission Fee
                    </label>
                    <select
                      value={editModalEvent.isPaid ? "paid" : "free"}
                      onChange={(e) =>
                        setEditModalEvent({ ...editModalEvent, isPaid: e.target.value === "paid" })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 glass text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="free">Free Entry</option>
                      <option value="paid">Paid Ticket</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Venue / Meeting URL
                  </label>
                  <input
                    type="text"
                    required
                    value={editModalEvent.venue}
                    onChange={(e) => setEditModalEvent({ ...editModalEvent, venue: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 glass text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Banner Asset URL
                  </label>
                  <input
                    type="text"
                    value={editModalEvent.banner_url || ""}
                    onChange={(e) =>
                      setEditModalEvent({ ...editModalEvent, banner_url: e.target.value })
                    }
                    placeholder="/banners/hackathon_2026_horiz.png"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 glass text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditModalEvent(null)}
                    className="px-4 py-2 rounded-xl glass text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 5: DELETE EVENT CONFIRMATION ================= */}
      <AnimatePresence>
        {deleteModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModalEvent(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 glass-card rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Delete Event?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Are you sure you want to delete <strong>"{deleteModalEvent.name}"</strong>? All associated registrations and participant tickets will also be permanently cancelled and purged.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalEvent(null)}
                  className="px-4 py-2 rounded-xl glass text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Keep Event
                </button>
                <button
                  type="button"
                  onClick={handleDeleteEvent}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/25 transition-all disabled:opacity-50"
                >
                  {actionLoading ? "Deleting..." : "Permanently Delete Event"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboardPage;
