import express from "express";
import {
  listUsersController,
  updateUserRoleController,
} from "../controllers/user.controller.ts";
import { adminAuth } from "../middlewares/auth.middleware.ts";

const userRouter = express.Router();

// Admin-only: list all registered users
userRouter.get("/", adminAuth, listUsersController);

// Admin-only: approve or update user roles (e.g. promote user to organizer or admin)
userRouter.patch("/:id/role", adminAuth, updateUserRoleController);

export default userRouter;
