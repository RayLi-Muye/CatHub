"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  label: string;
  href: string;
  disabled?: boolean;
};

export function ProfileTabs({
  username,
  catname,
}: {
  username: string;
  catname: string;
}) {
  const pathname = usePathname();
  const base = `/${username}/${catname}`;

  const tabs: Tab[] = [
    { label: "Overview", href: base },
    { label: "Health", href: `${base}/health` },
    { label: "Timeline", href: `${base}/timeline` },
  ];

  return (
    <div className="flex gap-0 border-b border-border mb-8">
      {tabs.map((tab) => {
        const isActive =
          tab.href === base
            ? pathname === base
            : pathname.startsWith(tab.href);

        if (tab.disabled) {
          return (
            <span
              key={tab.href}
              className="px-5 py-3 text-sm uppercase tracking-wider text-muted-foreground/40 cursor-not-allowed"
            >
              {tab.label}
            </span>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-5 py-3 text-sm uppercase tracking-wider transition-colors border-b-2 -mb-[1px] ${
              isActive
                ? "border-brand-orange text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
