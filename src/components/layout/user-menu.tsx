"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import type { Session } from "next-auth";

export function UserMenu({ user }: { user: Session["user"] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = (user?.name ?? user?.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 flex items-center justify-center bg-sunshine-700 text-white text-sm font-medium overflow-hidden relative"
        aria-label="User menu"
      >
        {user?.image ? (
          <Image
            src={user.image}
            alt="Avatar"
            fill
            sizes="36px"
            className="object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border shadow-golden z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Settings
            </Link>
          </div>
          <div className="border-t border-border py-1">
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
