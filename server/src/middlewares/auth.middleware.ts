import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.ts";
import db from "../config/db.ts";

export const userAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid authorization header" });
    }

    const payload = await verifyToken(token);
    if (!payload?.user_id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, payload.user_id),
    });

    if (!user) {
      return res.status(401).json({ message: "User not found, please login again" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const adminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid authorization header" });
    }

    const payload = await verifyToken(token);
    if (!payload?.user_id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, payload.user_id),
    });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin authorization required" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(403).json({ message: "Unauthorized admin access" });
  }
};

export const organizerAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid authorization header" });
    }

    const payload = await verifyToken(token);
    if (!payload?.user_id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, payload.user_id),
    });

    if (!user || (user.role !== "organizer" && user.role !== "admin")) {
      return res.status(403).json({
        message: "Organizer or Admin authorization required",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(403).json({
      message: "Unauthorized organizer access",
    });
  }
};
