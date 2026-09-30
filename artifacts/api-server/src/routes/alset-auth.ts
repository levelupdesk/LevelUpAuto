import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { alsetUsersTable, alsetOrganizationsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { AlsetLoginBody } from "@workspace/api-zod";
import {
  getRequestUser,
  hashPassword,
  makeToken,
  passwordNeedsRehash,
  verifyPassword,
} from "../lib/alset-auth";

const router: IRouter = Router();
const LOGIN_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const MAX_LOGIN_TRACKED_KEYS = 10_000;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getLoginAttemptKey(ip: string | undefined, email: string): string {
  return `${ip ?? "unknown"}:${email.trim().toLowerCase()}`;
}

function isLoginRateLimited(key: string, now = Date.now()): boolean {
  pruneLoginAttempts(now);
  const entry = loginAttempts.get(key);

  if (!entry) {
    return false;
  }

  if (entry.resetAt <= now) {
    loginAttempts.delete(key);
    return false;
  }

  return entry.count >= MAX_LOGIN_ATTEMPTS;
}

function recordFailedLoginAttempt(key: string, now = Date.now()) {
  pruneLoginAttempts(now);
  const entry = loginAttempts.get(key);

  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(key, {
      count: 1,
      resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS,
    });
    return;
  }

  loginAttempts.set(key, {
    count: entry.count + 1,
    resetAt: entry.resetAt,
  });
}

function pruneLoginAttempts(now = Date.now()) {
  for (const [key, entry] of loginAttempts.entries()) {
    if (entry.resetAt <= now) {
      loginAttempts.delete(key);
    }
  }

  while (loginAttempts.size > MAX_LOGIN_TRACKED_KEYS) {
    const oldestKey = loginAttempts.keys().next().value;

    if (!oldestKey) {
      return;
    }

    loginAttempts.delete(oldestKey);
  }
}

function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}

router.post("/alset/auth/login", async (req, res) => {
  const parsed = AlsetLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const loginAttemptKey = getLoginAttemptKey(req.ip, email);

  if (isLoginRateLimited(loginAttemptKey)) {
    res.status(429).json({ error: "Too many login attempts. Try again later." });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(alsetUsersTable)
      .where(eq(alsetUsersTable.email, email))
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      recordFailedLoginAttempt(loginAttemptKey);
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    clearLoginAttempts(loginAttemptKey);

    if (passwordNeedsRehash(user.passwordHash)) {
      await db
        .update(alsetUsersTable)
        .set({ passwordHash: hashPassword(password) })
        .where(eq(alsetUsersTable.id, user.id));
    }

    let organizationName: string | null = null;
    if (user.organizationId) {
      const [org] = await db
        .select()
        .from(alsetOrganizationsTable)
        .where(eq(alsetOrganizationsTable.id, user.organizationId))
        .limit(1);
      organizationName = org?.name ?? null;
    }

    const token = makeToken(user.id, user.role);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId ?? null,
        organizationName,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/alset/auth/me", async (req, res) => {
  try {
    const decoded = await getRequestUser(req);

    if (!decoded) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [user] = await db
      .select()
      .from(alsetUsersTable)
      .where(eq(alsetUsersTable.id, decoded.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let organizationName: string | null = null;
    if (user.organizationId) {
      const [org] = await db
        .select()
        .from(alsetOrganizationsTable)
        .where(eq(alsetOrganizationsTable.id, user.organizationId))
        .limit(1);
      organizationName = org?.name ?? null;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId ?? null,
      organizationName,
    });
  } catch (err) {
    req.log.error({ err }, "Get me failed");
    res.status(500).json({ error: "Failed to get user" });
  }
});

export default router;
