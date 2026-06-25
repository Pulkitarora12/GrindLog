"use server";

import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "admin_session";

function getExpectedSessionHash(): string {
  const secret = process.env.SESSION_SECRET;
  const password = process.env.ADMIN_PASSWORD;
  
  if (!secret || !password) {
    // If not configured, fail safe (never let someone log in with empty variables)
    return "CONFIG_ERROR_MISSING_SECRET_OR_PASSWORD";
  }

  return crypto
    .createHmac("sha256", secret)
    .update(password)
    .digest("hex");
}

export async function isAuthorized(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
    if (!sessionCookie) return false;

    const expectedHash = getExpectedSessionHash();
    // Use timingSafeEqual to prevent timing attacks
    const sessionBuffer = Buffer.from(sessionCookie);
    const expectedBuffer = Buffer.from(expectedHash);

    if (sessionBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sessionBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export async function login(password: string): Promise<{ success: boolean; error?: string }> {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return { success: false, error: "Server is not configured for authentication" };
  }

  if (password !== expectedPassword) {
    return { success: false, error: "Incorrect password" };
  }

  try {
    const expectedHash = getExpectedSessionHash();
    const cookieStore = await cookies();

    cookieStore.set({
      name: COOKIE_NAME,
      value: expectedHash,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days session
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    console.error("Login session creation error:", error);
    return { success: false, error: "Failed to create session" };
  }
}

export async function logout(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false };
  }
}
