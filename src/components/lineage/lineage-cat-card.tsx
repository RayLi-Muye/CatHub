import Image from "next/image";
import Link from "next/link";
import type { LineageEntry } from "@/lib/lineage/queries";

const sexLabels: Record<string, string> = {
  male: "Male",
  female: "Female",
  unknown: "Unknown",
};

const roleLabels: Record<string, string> = {
  sire: "Sire",
  dam: "Dam",
  unknown: "Parent",
};

export function LineageCatCard({
  entry,
  context = "ancestor",
}: {
  entry: LineageEntry;
  context?: "ancestor" | "descendant";
}) {
  const { cat } = entry;

  return (
    <Link
      href={`/${cat.username}/${cat.slug}/lineage`}
      className="group block bg-card p-4 shadow-golden transition-transform hover:-translate-y-0.5"
    >
      <div className="flex gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-sunshine-300/30 text-2xl flex items-center justify-center">
          {cat.avatarUrl ? (
            <Image
              src={cat.avatarUrl}
              alt={cat.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            "🐱"
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[1.8px] text-brand-orange">
            {context === "ancestor" ? roleLabels[entry.parentRole] : "Child"}
          </p>
          <h3 className="truncate text-lg group-hover:text-brand-orange">
            {cat.name}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            @{cat.username}/{cat.slug}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
            {cat.breed && <span className="bg-background px-2 py-1">{cat.breed}</span>}
            {cat.sex && (
              <span className="bg-background px-2 py-1">
                {sexLabels[cat.sex] ?? cat.sex}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
