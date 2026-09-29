import type { users } from "../db/schema.ts";

export type UserRecord = typeof users.$inferSelect;

declare global {
  namespace Express {
    interface Request {
      user?: UserRecord;
    }
  }
}
