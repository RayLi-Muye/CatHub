"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register, type AuthState } from "@/actions/auth";

const initialState: AuthState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(register, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-12">
          <div className="flex gap-0.5">
            <span className="w-1.5 h-[18px] bg-bright-yellow" />
            <span className="w-1.5 h-[18px] bg-sunshine-700" />
            <span className="w-1.5 h-[18px] bg-brand-block-orange" />
            <span className="w-1.5 h-[18px] bg-brand-orange" />
          </div>
          <Link href="/" className="text-lg tracking-tight">
            CatHub
          </Link>
        </div>

        <h1 className="text-4xl mb-2">Create your account</h1>
        <p className="text-muted-foreground mb-8">
          Start building your cat&apos;s digital identity
        </p>

        {state.error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-sm uppercase tracking-wider mb-2"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full px-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {state.fieldErrors?.username && (
              <p className="mt-1 text-sm text-destructive">
                {state.fieldErrors.username[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm uppercase tracking-wider mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {state.fieldErrors?.email && (
              <p className="mt-1 text-sm text-destructive">
                {state.fieldErrors.email[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm uppercase tracking-wider mb-2"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {state.fieldErrors?.password && (
              <p className="mt-1 text-sm text-destructive">
                {state.fieldErrors.password[0]}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 bg-primary text-primary-foreground text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {pending ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
