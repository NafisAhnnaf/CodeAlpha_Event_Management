import { Worker } from "node:worker_threads";
import path from "node:path";
import crypto from "node:crypto";
import argon2 from "argon2";

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timeout: ReturnType<typeof setTimeout>;
}

const pendingRequests = new Map<string, PendingRequest>();
let workerInstance: Worker | null = null;

const getWorkerPath = () => {
  return path.resolve(import.meta.dirname, "../workers/hashWorker.ts");
};

const createWorker = (): Worker => {
  const isNode = typeof process !== "undefined" && process.execPath && process.execPath.includes("node");
  const worker = new Worker(getWorkerPath(), {
    execArgv: isNode ? ["--import", "tsx"] : [],
  });

  worker.on("message", (message: {
    id: string;
    success: boolean;
    result?: string | boolean;
    error?: string;
  }) => {
    const { id, success, result, error } = message;
    const pending = pendingRequests.get(id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    pendingRequests.delete(id);

    if (success) {
      pending.resolve(result);
    } else {
      pending.reject(new Error(error || "Worker operation failed"));
    }
  });

  worker.on("error", (err) => {
    console.error("[HashWorker Error]:", err);
    // Reject all pending requests and respawn
    for (const [id, req] of pendingRequests.entries()) {
      clearTimeout(req.timeout);
      req.reject(err);
      pendingRequests.delete(id);
    }
    workerInstance = null;
  });

  worker.on("exit", (code) => {
    if (code !== 0) {
      console.warn(`[HashWorker Exit]: Worker stopped with exit code ${code}`);
    }
    workerInstance = null;
  });

  return worker;
};

const getWorker = (): Worker => {
  if (!workerInstance) {
    workerInstance = createWorker();
  }
  return workerInstance;
};

const dispatchToWorker = <T>(type: "hash" | "verify", payload: { password?: string; hashed?: string }): Promise<T> => {
  return new Promise((resolve, reject) => {
    try {
      const worker = getWorker();
      const id = crypto.randomUUID();

      const timeout = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error("Argon2 worker request timed out"));
      }, 15000);

      pendingRequests.set(id, { resolve, reject, timeout });
      worker.postMessage({ id, type, ...payload });
    } catch (error) {
      // Graceful fallback to direct execution if worker fails to initialize
      console.warn("[HashWorker] Fallback to direct thread execution:", error);
      if (type === "hash" && payload.password) {
        argon2.hash(payload.password, { type: argon2.argon2id }).then(resolve as any, reject);
      } else if (type === "verify" && payload.password && payload.hashed) {
        argon2.verify(payload.hashed, payload.password).then(resolve as any, reject);
      } else {
        reject(error);
      }
    }
  });
};

/**
 * Offload Argon2 password hashing to a persistent background worker thread.
 */
export const hash = async (password: string): Promise<string> => {
  return dispatchToWorker<string>("hash", { password });
};

/**
 * Offload Argon2 password verification to a persistent background worker thread.
 */
export const verify = async (password: string, hashed: string): Promise<boolean> => {
  return dispatchToWorker<boolean>("verify", { password, hashed });
};
