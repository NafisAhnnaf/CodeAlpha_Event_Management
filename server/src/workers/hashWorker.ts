import { parentPort } from "node:worker_threads";
import argon2 from "argon2";

if (parentPort) {
  parentPort.on("message", async (message: {
    id: string;
    type: "hash" | "verify";
    password?: string;
    hashed?: string;
  }) => {
    const { id, type, password, hashed } = message;

    try {
      if (type === "hash") {
        if (!password) {
          throw new Error("Password is required for hashing");
        }
        const result = await argon2.hash(password, {
          type: argon2.argon2id,
        });
        parentPort?.postMessage({ id, success: true, result });
      } else if (type === "verify") {
        if (!password || !hashed) {
          throw new Error("Password and hashed string are required for verification");
        }
        const result = await argon2.verify(hashed, password);
        parentPort?.postMessage({ id, success: true, result });
      } else {
        throw new Error(`Unknown worker operation: ${type}`);
      }
    } catch (err: any) {
      parentPort?.postMessage({
        id,
        success: false,
        error: err.message || "Worker error",
      });
    }
  });
}
