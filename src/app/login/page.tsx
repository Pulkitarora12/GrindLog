"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await login(password);
        if (result.success) {
          router.push("/");
          router.refresh();
        } else {
          setError(result.error || "Login failed");
        }
      } catch (err) {
        console.error("Login page error:", err);
        setError("An unexpected error occurred");
      }
    });
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 border border-gray-200 bg-white p-8 rounded-sm">
        {/* Title */}
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900">
            GrindLog Admin
          </h1>
          <p className="mt-2 text-xs text-gray-500 font-serif italic">
            Enter password to authenticate admin sessions.
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="border border-red-200 bg-red-50 text-red-800 p-3 rounded-sm text-xs text-center">
              {error}
            </div>
          )}

          <div className="rounded-md">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                placeholder="Password"
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm bg-white focus:border-gray-900 focus:outline-none text-center"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative flex w-full justify-center rounded-sm border border-gray-900 bg-gray-900 py-2 px-4 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isPending ? "Validating..." : "Authenticate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
