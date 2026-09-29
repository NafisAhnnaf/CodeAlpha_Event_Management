import "dotenv/config";
import { SignJWT, jwtVerify } from "jose";

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key");

const generateToken = async (user_id: string, role: string) => {
  const token = await new SignJWT({
    user_id: user_id,
    role: role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setSubject(user_id.toString())
    .setExpirationTime("7d")
    .sign(getSecret());
  return token;
};

const verifyToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { user_id: string; role: string };
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

export { generateToken, verifyToken };
