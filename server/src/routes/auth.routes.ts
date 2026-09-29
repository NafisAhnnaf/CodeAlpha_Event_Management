import express from "express";
import {
  loginController,
  signupController,
  getProfileController,
} from "../controllers/user.controller.ts";
import { userAuth } from "../middlewares/auth.middleware.ts";

const authRouter = express.Router();

authRouter.post("/login", loginController);
authRouter.post("/signup", signupController);
authRouter.get("/me", userAuth, getProfileController);

export default authRouter;
