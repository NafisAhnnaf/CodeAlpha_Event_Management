import {
  pgTable,
  pgEnum,
  text,
  boolean,
  uuid,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roles = pgEnum("roles", ["user", "admin", "organizer"]);

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  dob: timestamp().notNull(),
  email: text().notNull().unique(),
  password: text().notNull(),
  role: roles().notNull().default("user"),
  created_at: timestamp().notNull().defaultNow(),
});

export const platforms = pgEnum("plaforms", ["online", "onsite"]);

export const events = pgTable("events", {
  id: uuid().primaryKey().defaultRandom(),
  organizer_id: uuid().references(() => users.id, { onDelete: "cascade" }),
  name: text().notNull(),
  summary: text(),
  description: text(), // Markdown or rich text
  platform: platforms().notNull(),
  venue: text().notNull(),
  banner_url: text(),
  isPaid: boolean().default(false),
  start_date: timestamp().notNull(),
  end_date: timestamp().notNull(),
  created_at: timestamp().notNull().defaultNow(),
});

export const regStatus = pgEnum("regStatus", [
  "pending_approval",
  "cancelled",
  "rejected",
  "completed",
  "pending_payment",
]);

export const registrations = pgTable(
  "registrations",
  {
    id: uuid().primaryKey().defaultRandom(),
    user_id: uuid()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    event_id: uuid()
      .references(() => events.id, { onDelete: "cascade" })
      .notNull(),
    status: regStatus().default("pending_approval"),
    created_at: timestamp().notNull().defaultNow(),
  },
  (table) => [
    unique("user_event_unique").on(table.user_id, table.event_id),
  ]
);

export const paymentMethods = pgEnum("payment_methods", [
  "card",
  "mobile_banking",
]);

export const payments = pgTable("payments", {
  id: uuid().primaryKey().defaultRandom(),
  reg_id: uuid().references(() => registrations.id, { onDelete: "cascade" }),
  method: paymentMethods().notNull(),
  trx_id: text().notNull(),
  created_at: timestamp().notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
  registrations: many(registrations),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizer_id],
    references: [users.id],
  }),
  registrations: many(registrations),
}));

export const registrationsRelations = relations(
  registrations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [registrations.user_id],
      references: [users.id],
    }),
    event: one(events, {
      fields: [registrations.event_id],
      references: [events.id],
    }),
    payments: many(payments),
  })
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  registration: one(registrations, {
    fields: [payments.reg_id],
    references: [registrations.id],
  }),
}));
