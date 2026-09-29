import type { Request, Response } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import db from "../config/db.ts";
import { events, registrations, users } from "../db/schema.ts";

/**
 * Public: Browse events list
 * Anyone can browse events without logging in.
 */
export const listEventsController = async (req: Request, res: Response) => {
  try {
    const allEvents = await db.query.events.findMany({
      columns: {
        id: true,
        name: true,
        summary: true,
        platform: true,
        venue: true,
        banner_url: true,
        isPaid: true,
        start_date: true,
        end_date: true,
        created_at: true,
        organizer_id: true,
      },
      with: {
        organizer: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: (events, { desc }) => [desc(events.start_date)],
    });

    return res.status(200).json({ events: allEvents });
  } catch (error) {
    console.error("Error in listEventsController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Protected (userAuth): View event details
 * Users MUST be logged in to view detailed event description and registration options.
 */
export const getEventByIdController = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Event ID is required" });
    }
    const eventId = id as string;

    const event = await db.query.events.findFirst({
      where: (events, { eq }) => eq(events.id, eventId),
      with: {
        organizer: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if the authenticated user has already registered for this event
    let userRegistration = null;
    if (req.user?.id) {
      const currentUserId = req.user.id;
      userRegistration = await db.query.registrations.findFirst({
        where: (reg, { and, eq }) =>
          and(eq(reg.event_id, eventId), eq(reg.user_id, currentUserId)),
      });
    }

    return res.status(200).json({
      event,
      isRegistered:
        !!userRegistration && userRegistration.status !== "cancelled",
      registration: userRegistration || null,
    });
  } catch (error) {
    console.error("Error in getEventByIdController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Protected (organizerAuth / adminAuth): Create new event
 */
export const createEventController = async (req: Request, res: Response) => {
  const {
    name,
    summary,
    description,
    platform,
    venue,
    banner_url,
    isPaid = false,
    start_date,
    end_date,
  } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!name || !platform || !venue || !start_date || !end_date) {
      return res.status(400).json({
        message:
          "Missing required fields: name, platform, venue, start_date, and end_date",
      });
    }

    if (platform !== "online" && platform !== "onsite") {
      return res
        .status(400)
        .json({ message: "Platform must be either 'online' or 'onsite'" });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid start_date or end_date format" });
    }

    if (endDate <= startDate) {
      return res
        .status(400)
        .json({ message: "end_date must be after start_date" });
    }

    const [newEvent] = await db
      .insert(events)
      .values({
        organizer_id: req.user.id,
        name: String(name).trim(),
        summary: summary ? String(summary).trim() : null,
        description: description ? String(description).trim() : null,
        platform,
        venue: String(venue).trim(),
        banner_url: banner_url ? String(banner_url).trim() : null,
        isPaid: Boolean(isPaid),
        start_date: startDate,
        end_date: endDate,
      })
      .returning();

    return res.status(201).json({
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    console.error("Error in createEventController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Protected (organizerAuth / adminAuth): Update event
 * Organizers can only update their own events; Admins can update any event.
 */
export const updateEventController = async (req: Request, res: Response) => {
  const id = req.params.id;
  const {
    name,
    summary,
    description,
    platform,
    venue,
    banner_url,
    isPaid,
    start_date,
    end_date,
  } = req.body;

  try {
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Event ID is required" });
    }
    const eventId = id as string;

    const existingEvent = await db.query.events.findFirst({
      where: (events, { eq }) => eq(events.id, eventId),
    });

    if (!existingEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    const isOrganizer = existingEvent.organizer_id === req.user?.id;
    const isAdmin = req.user?.role === "admin";

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        message: "You do not have permission to modify this event",
      });
    }

    const updatePayload: Partial<typeof events.$inferInsert> = {};

    if (name !== undefined) updatePayload.name = String(name).trim();
    if (summary !== undefined)
      updatePayload.summary = summary ? String(summary).trim() : null;
    if (description !== undefined)
      updatePayload.description = description ? String(description).trim() : null;
    if (banner_url !== undefined)
      updatePayload.banner_url = banner_url ? String(banner_url).trim() : null;
    if (platform !== undefined) {
      if (platform !== "online" && platform !== "onsite") {
        return res
          .status(400)
          .json({ message: "Platform must be either 'online' or 'onsite'" });
      }
      updatePayload.platform = platform;
    }
    if (venue !== undefined) updatePayload.venue = String(venue).trim();
    if (isPaid !== undefined) updatePayload.isPaid = Boolean(isPaid);

    if (start_date !== undefined) {
      const parsedStart = new Date(start_date);
      if (isNaN(parsedStart.getTime())) {
        return res.status(400).json({ message: "Invalid start_date" });
      }
      updatePayload.start_date = parsedStart;
    }

    if (end_date !== undefined) {
      const parsedEnd = new Date(end_date);
      if (isNaN(parsedEnd.getTime())) {
        return res.status(400).json({ message: "Invalid end_date" });
      }
      updatePayload.end_date = parsedEnd;
    }

    const finalStart = updatePayload.start_date || existingEvent.start_date;
    const finalEnd = updatePayload.end_date || existingEvent.end_date;

    if (finalEnd <= finalStart) {
      return res
        .status(400)
        .json({ message: "end_date must be after start_date" });
    }

    const [updatedEvent] = await db
      .update(events)
      .set(updatePayload)
      .where(eq(events.id, eventId))
      .returning();

    return res.status(200).json({
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Error in updateEventController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Protected (organizerAuth / adminAuth): Delete event
 * Organizers can only delete their own events; Admins can delete any event.
 */
export const deleteEventController = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Event ID is required" });
    }
    const eventId = id as string;

    const existingEvent = await db.query.events.findFirst({
      where: (events, { eq }) => eq(events.id, eventId),
    });

    if (!existingEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    const isOrganizer = existingEvent.organizer_id === req.user?.id;
    const isAdmin = req.user?.role === "admin";

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        message: "You do not have permission to delete this event",
      });
    }

    await db.delete(events).where(eq(events.id, eventId));

    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error in deleteEventController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Protected (userAuth): Register for an event
 */
export const registerForEventController = async (
  req: Request,
  res: Response,
) => {
  const id = req.params.id;

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Please log in to register" });
    }

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Event ID is required" });
    }
    const eventId = id as string;

    const event = await db.query.events.findFirst({
      where: (events, { eq }) => eq(events.id, eventId),
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (new Date(event.end_date) < new Date()) {
      return res
        .status(400)
        .json({ message: "Cannot register for an event that has already ended" });
    }

    const currentUserId = req.user.id;
    const existingRegistration = await db.query.registrations.findFirst({
      where: (reg, { and, eq }) =>
        and(eq(reg.event_id, eventId), eq(reg.user_id, currentUserId)),
    });

    if (existingRegistration) {
      if (existingRegistration.status === "cancelled") {
        const initialStatus = event.isPaid ? "pending_payment" : "completed";
        const [reactivated] = await db
          .update(registrations)
          .set({ status: initialStatus, created_at: new Date() })
          .where(eq(registrations.id, existingRegistration.id))
          .returning();

        return res.status(200).json({
          message: event.isPaid
            ? "Registration re-opened. Please complete payment to confirm your spot."
            : "Registration confirmed!",
          registration: reactivated,
        });
      }

      return res.status(409).json({
        message: "You are already registered for this event",
        registration: existingRegistration,
      });
    }

    const initialStatus = event.isPaid ? "pending_payment" : "completed";

    const [newRegistration] = await db
      .insert(registrations)
      .values({
        user_id: req.user.id,
        event_id: event.id,
        status: initialStatus,
      })
      .returning();

    return res.status(201).json({
      message: event.isPaid
        ? "Registered successfully. Please complete payment to confirm your spot."
        : "Registration confirmed!",
      registration: newRegistration,
    });
  } catch (error) {
    console.error("Error in registerForEventController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Protected (userAuth): View the current user's registered events
 */
export const getMyRegistrationsController = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const currentUserId = req.user.id;
    const myRegistrations = await db.query.registrations.findMany({
      where: (reg, { eq }) => eq(reg.user_id, currentUserId),
      with: {
        event: {
          with: {
            organizer: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: (reg, { desc }) => [desc(reg.created_at)],
    });

    return res.status(200).json({ registrations: myRegistrations });
  } catch (error) {
    console.error("Error in getMyRegistrationsController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Protected (organizerAuth / adminAuth): View all registrations for an event
 */
export const getEventRegistrationsController = async (
  req: Request,
  res: Response,
) => {
  const id = req.params.id;

  try {
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Event ID is required" });
    }
    const eventId = id as string;

    const event = await db.query.events.findFirst({
      where: (events, { eq }) => eq(events.id, eventId),
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const isOrganizer = event.organizer_id === req.user?.id;
    const isAdmin = req.user?.role === "admin";

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        message: "You do not have permission to view registrations for this event",
      });
    }

    const eventRegistrations = await db.query.registrations.findMany({
      where: (reg, { eq }) => eq(reg.event_id, eventId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            dob: true,
          },
        },
      },
      orderBy: (reg, { desc }) => [desc(reg.created_at)],
    });

    return res.status(200).json({
      event: {
        id: event.id,
        name: event.name,
      },
      total: eventRegistrations.length,
      registrations: eventRegistrations,
    });
  } catch (error) {
    console.error("Error in getEventRegistrationsController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Protected (userAuth): Cancel user's own registration
 */
export const cancelMyRegistrationController = async (
  req: Request,
  res: Response,
) => {
  const id = req.params.id;

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Registration ID is required" });
    }

    const reg = await db.query.registrations.findFirst({
      where: (r, { eq }) => eq(r.id, id),
      with: {
        event: true,
      },
    });

    if (!reg) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Only owner of registration or admin can cancel
    if (reg.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        message: "You do not have permission to cancel this registration",
      });
    }

    if (reg.status === "cancelled") {
      return res.status(400).json({ message: "Registration is already cancelled" });
    }

    const [updated] = await db
      .update(registrations)
      .set({ status: "cancelled" })
      .where(eq(registrations.id, id))
      .returning();

    return res.status(200).json({
      message: "Registration cancelled successfully",
      registration: updated,
    });
  } catch (error) {
    console.error("Error in cancelMyRegistrationController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Protected (userAuth): Re-activate user's cancelled registration
 */
export const reactivateMyRegistrationController = async (
  req: Request,
  res: Response,
) => {
  const id = req.params.id;

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Registration ID is required" });
    }

    const reg = await db.query.registrations.findFirst({
      where: (r, { eq }) => eq(r.id, id),
      with: {
        event: true,
      },
    });

    if (!reg) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (reg.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        message: "You do not have permission to manage this registration",
      });
    }

    if (reg.event && new Date(reg.event.end_date) < new Date()) {
      return res.status(400).json({
        message: "Cannot reactivate registration for an event that has ended",
      });
    }

    const initialStatus = reg.event?.isPaid ? "pending_payment" : "completed";
    const [updated] = await db
      .update(registrations)
      .set({ status: initialStatus })
      .where(eq(registrations.id, id))
      .returning();

    return res.status(200).json({
      message: "Registration reactivated successfully",
      registration: updated,
    });
  } catch (error) {
    console.error("Error in reactivateMyRegistrationController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Protected (organizerAuth / adminAuth): List registrations for management dashboard
 * Organizers see registrations for their events; Admins see all registrations across the platform.
 */
export const getManageRegistrationsController = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isAdmin = req.user.role === "admin";
    const currentUserId = req.user.id;

    let allRegistrations;

    if (isAdmin) {
      allRegistrations = await db.query.registrations.findMany({
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              dob: true,
              role: true,
            },
          },
          event: {
            with: {
              organizer: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: (reg, { desc }) => [desc(reg.created_at)],
      });
    } else {
      // Find organizer's events
      const myEvents = await db.query.events.findMany({
        where: (e, { eq }) => eq(e.organizer_id, currentUserId),
        columns: { id: true },
      });

      const eventIds = myEvents.map((e) => e.id);

      if (eventIds.length === 0) {
        return res.status(200).json({ registrations: [] });
      }

      allRegistrations = await db.query.registrations.findMany({
        where: (reg, { inArray }) => inArray(reg.event_id, eventIds),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              dob: true,
              role: true,
            },
          },
          event: {
            with: {
              organizer: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: (reg, { desc }) => [desc(reg.created_at)],
      });
    }

    return res.status(200).json({ registrations: allRegistrations });
  } catch (error) {
    console.error("Error in getManageRegistrationsController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Protected (organizerAuth / adminAuth): Update attendee registration status
 */
export const updateRegistrationStatusController = async (
  req: Request,
  res: Response,
) => {
  const id = req.params.id;
  const { status } = req.body;

  const validStatuses = [
    "pending_approval",
    "cancelled",
    "rejected",
    "completed",
    "pending_payment",
  ];

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Registration ID is required" });
    }

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const reg = await db.query.registrations.findFirst({
      where: (r, { eq }) => eq(r.id, id),
      with: {
        event: true,
      },
    });

    if (!reg) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isOrganizer = reg.event?.organizer_id === req.user.id;

    if (!isAdmin && !isOrganizer) {
      return res.status(403).json({
        message: "You do not have permission to update this registration",
      });
    }

    const [updated] = await db
      .update(registrations)
      .set({ status })
      .where(eq(registrations.id, id))
      .returning();

    return res.status(200).json({
      message: "Registration status updated successfully",
      registration: updated,
    });
  } catch (error) {
    console.error("Error in updateRegistrationStatusController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Protected (organizerAuth / adminAuth): Delete attendee registration record
 */
export const deleteRegistrationController = async (
  req: Request,
  res: Response,
) => {
  const id = req.params.id;

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Registration ID is required" });
    }

    const reg = await db.query.registrations.findFirst({
      where: (r, { eq }) => eq(r.id, id),
      with: {
        event: true,
      },
    });

    if (!reg) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isOrganizer = reg.event?.organizer_id === req.user.id;

    if (!isAdmin && !isOrganizer) {
      return res.status(403).json({
        message: "You do not have permission to delete this registration",
      });
    }

    await db.delete(registrations).where(eq(registrations.id, id));

    return res.status(200).json({
      message: "Registration record deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteRegistrationController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

