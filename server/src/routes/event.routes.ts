import express from "express";
import {
  listEventsController,
  getEventByIdController,
  createEventController,
  updateEventController,
  deleteEventController,
  registerForEventController,
  getMyRegistrationsController,
  cancelMyRegistrationController,
  reactivateMyRegistrationController,
  getManageRegistrationsController,
  updateRegistrationStatusController,
  deleteRegistrationController,
  getEventRegistrationsController,
} from "../controllers/event.controller.ts";
import { userAuth, organizerAuth } from "../middlewares/auth.middleware.ts";

const eventRouter = express.Router();

// Public: Browse events list
eventRouter.get("/", listEventsController);

// User Registrations Management (must precede /:id)
eventRouter.get("/my-registrations", userAuth, getMyRegistrationsController);
eventRouter.patch("/my-registrations/:id/cancel", userAuth, cancelMyRegistrationController);
eventRouter.delete("/my-registrations/:id", userAuth, cancelMyRegistrationController);
eventRouter.patch("/my-registrations/:id/reactivate", userAuth, reactivateMyRegistrationController);

// Admin & Organizer Registrations Management (must precede /:id)
eventRouter.get("/manage/all-registrations", organizerAuth, getManageRegistrationsController);
eventRouter.patch("/manage/registrations/:id/status", organizerAuth, updateRegistrationStatusController);
eventRouter.delete("/manage/registrations/:id", organizerAuth, deleteRegistrationController);

// Protected (userAuth): View full event details (must be logged in)
eventRouter.get("/:id", userAuth, getEventByIdController);

// Protected (organizerAuth / adminAuth): Create new event
eventRouter.post("/", organizerAuth, createEventController);

// Protected (organizerAuth / adminAuth): Update existing event
eventRouter.put("/:id", organizerAuth, updateEventController);

// Protected (organizerAuth / adminAuth): Delete event
eventRouter.delete("/:id", organizerAuth, deleteEventController);

// Protected (userAuth): Register for an event
eventRouter.post("/:id/register", userAuth, registerForEventController);

// Protected (organizerAuth / adminAuth): View attendees for an event
eventRouter.get("/:id/registrations", organizerAuth, getEventRegistrationsController);

export default eventRouter;
