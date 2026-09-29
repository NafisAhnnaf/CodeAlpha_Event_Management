import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import db from "../config/db.ts";
import { users } from "../db/schema.ts";
import { hash, verify } from "../utils/hashingUtil.ts";
import { generateToken } from "../utils/jwt.ts";

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, normalizedEmail),
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const hasMatched = await verify(password, user.password);
    if (!hasMatched) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = await generateToken(user.id, user.role);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        dob: user.dob,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Error in loginController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const signupController = async (req: Request, res: Response) => {
  const { name, email, password, dob } = req.body;
  try {
    if (!name || !email || !password || !dob) {
      return res.status(400).json({
        message: "All fields are required: name, email, password, and dob",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const parsedDob = new Date(dob);

    if (isNaN(parsedDob.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid date of birth format" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const existingUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, normalizedEmail),
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await hash(password);

    const [newUser] = await db
      .insert(users)
      .values({
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        dob: parsedDob,
        role: "user", // Default role is strictly user; admin can promote later
      })
      .returning();

    if (!newUser) {
      return res.status(500).json({ message: "Failed to create user account" });
    }

    const token = await generateToken(newUser.id, newUser.role);

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        dob: newUser.dob,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    console.error("Error in signupController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getProfileController = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { password, ...userWithoutPassword } = req.user;
    return res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Error in getProfileController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateUserRoleController = async (req: Request, res: Response) => {
  const id = req.params.id;
  const { role } = req.body;

  try {
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "User ID is required" });
    }

    const userId = id as string;
    const validRoles = ["user", "organizer", "admin"] as const;
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Role must be 'user', 'organizer', or 'admin'",
      });
    }

    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateUserRoleController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const listUsersController = async (req: Request, res: Response) => {
  try {
    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        dob: true,
        created_at: true,
      },
      orderBy: (users, { desc }) => [desc(users.created_at)],
    });

    return res.status(200).json({ users: allUsers });
  } catch (error) {
    console.error("Error in listUsersController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
