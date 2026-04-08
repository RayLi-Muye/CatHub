import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, cats, healthRecords } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { ProfileTabs } from "@/components/cat/profile-tabs";

function getAge(birthdate: Date): string {
  const now = new Date();
  const years = now.getFullYear() - birthdate.getFullYear();
  const months = now.getMonth() - birthdate.getMonth();
  const totalMonths = years * 12 + months;

  if (totalMonths < 1) return "< 1 month old";
  if (totalMonths < 12)
    return `${totalMonths} month${totalMonths > 1 ? "s" : ""} old`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return m > 0
    ? `${y} year${y > 1 ? "s" : ""}, ${m} month${m > 1 ? "s" : ""} old`
    : `${y} year${y > 1 ? "s" : ""} old`;
}

const sexLabels: Record<string, string> = {
  male: "♂ Male",
  female: "♀ Female",
  unknown: "Unknown",
};

export default async function CatProfilePage({
  params,
}: {
  params: Promise<{ username: string; catname: string }>;
}) {
  const { username, catname } = await params;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) notFound();

  const [cat] = await db
    .select()
    .from(cats)
    .where(and(eq(cats.ownerId, user.id), eq(cats.slug, catname)))
    .limit(1);

  if (!cat) notFound();

  // Check access
  const session = await auth();
  const isOwner = session?.user?.id === user.id;
  if (!cat.isPublic && !isOwner) notFound();

  // Get recent health records for overview
  const recentHealth = await db
    .select()
    .from(healthRecords)
    .where(eq(healthRecords.catId, cat.id))
    .orderBy(desc(healthRecords.date))
    .limit(3);

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-8 py-16">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex gap-6">
          <div className="w-24 h-24 bg-sunshine-300/30 flex items-center justify-center text-5xl shrink-0">
            {cat.avatarUrl ? (
              <img
                src={cat.avatarUrl}
                alt={cat.name}
                className="w-full h-full object-cover"
              />
            ) : (
              "🐱"
            )}
          </div>
          <div>
            <h1 className="text-4xl mb-1">{cat.name}</h1>
            <p className="text-muted-foreground mb-2">
              @{username}/{cat.slug}
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              {cat.breed && (
                <span className="px-2 py-1 bg-card">{cat.breed}</span>
              )}
              {cat.sex && (
                <span className="px-2 py-1 bg-card">
                  {sexLabels[cat.sex] ?? cat.sex}
                </span>
              )}
              {cat.birthdate && (
                <span className="px-2 py-1 bg-card">
                  {getAge(cat.birthdate)}
                </span>
              )}
              {cat.isNeutered && (
                <span className="px-2 py-1 bg-card">Neutered</span>
              )}
            </div>
          </div>
        </div>
        {isOwner && (
          <Link
            href={`/${username}/${catname}/edit`}
            className="px-4 py-2 bg-secondary text-secondary-foreground text-sm uppercase tracking-wider hover:opacity-80 transition-opacity"
          >
            Edit
          </Link>
        )}
      </div>

      <ProfileTabs username={username} catname={catname} />

      {/* Overview content */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Details */}
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            About
          </h2>
          <div className="bg-card p-6 space-y-3">
            {cat.description ? (
              <p>{cat.description}</p>
            ) : (
              <p className="text-muted-foreground italic">No description yet.</p>
            )}
            {cat.colorMarkings && (
              <div className="pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  Color/Markings:
                </span>{" "}
                {cat.colorMarkings}
              </div>
            )}
            {cat.microchipId && (
              <div className="pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  Microchip:
                </span>{" "}
                {cat.microchipId}
              </div>
            )}
          </div>
        </div>

        {/* Recent Health */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground">
              Recent Health
            </h2>
            <Link
              href={`/${username}/${catname}/health`}
              className="text-sm text-brand-orange hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="bg-card p-6">
            {recentHealth.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No health records yet.
                {isOwner && (
                  <>
                    {" "}
                    <Link
                      href={`/${username}/${catname}/health/new`}
                      className="text-brand-orange hover:underline"
                    >
                      Add one
                    </Link>
                  </>
                )}
              </p>
            ) : (
              <div className="space-y-3">
                {recentHealth.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-start justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm">{record.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {record.type}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {record.date.toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
