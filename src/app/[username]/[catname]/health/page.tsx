import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, cats, healthRecords, weightLogs } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { ProfileTabs } from "@/components/cat/profile-tabs";
import { WeightChart } from "@/components/health/weight-chart";
import { WeightLogForm } from "@/components/health/weight-log-form";
import { logWeight } from "@/actions/health";

const typeIcons: Record<string, string> = {
  checkup: "🩺",
  vaccination: "💉",
  surgery: "🏥",
  illness: "🤒",
  medication: "💊",
  other: "📋",
};

export default async function HealthPage({
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

  const session = await auth();
  const isOwner = session?.user?.id === user.id;
  if (!cat.isPublic && !isOwner) notFound();

  const records = await db
    .select()
    .from(healthRecords)
    .where(eq(healthRecords.catId, cat.id))
    .orderBy(desc(healthRecords.date));

  const weights = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.catId, cat.id))
    .orderBy(asc(weightLogs.recordedAt));

  const weightData = weights.map((w) => ({
    date: w.recordedAt.toLocaleDateString(),
    weight: parseFloat(w.weightKg),
  }));

  const boundLogWeight = logWeight.bind(null, cat.id);

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-8 py-16">
      <h1 className="text-4xl mb-2">{cat.name}</h1>
      <p className="text-muted-foreground mb-8">
        @{username}/{cat.slug}
      </p>

      <ProfileTabs username={username} catname={catname} />

      <div className="grid md:grid-cols-3 gap-8">
        {/* Health Timeline */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground">
              Health Records
            </h2>
            {isOwner && (
              <Link
                href={`/${username}/${catname}/health/new`}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                Add Record
              </Link>
            )}
          </div>

          {records.length === 0 ? (
            <div className="bg-card p-8 text-center">
              <p className="text-muted-foreground">No health records yet.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex gap-4 py-4 border-b border-border"
                >
                  <div className="w-10 h-10 bg-card flex items-center justify-center text-lg shrink-0">
                    {typeIcons[record.type] ?? "📋"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{record.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {record.type}
                          {record.vetClinic && ` · ${record.vetClinic}`}
                          {record.vetName && ` · Dr. ${record.vetName}`}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {record.date.toLocaleDateString()}
                      </span>
                    </div>
                    {record.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {record.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weight Sidebar */}
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            Weight
          </h2>
          <div className="bg-card p-4 mb-4">
            <WeightChart data={weightData} />
          </div>

          {isOwner && (
            <div className="bg-card p-4">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Log Weight
              </h3>
              <WeightLogForm action={boundLogWeight} />
            </div>
          )}

          {weights.length > 0 && (
            <div className="mt-4 space-y-1">
              {weights
                .slice()
                .reverse()
                .slice(0, 5)
                .map((w) => (
                  <div
                    key={w.id}
                    className="flex justify-between text-sm py-1"
                  >
                    <span>{w.recordedAt.toLocaleDateString()}</span>
                    <span className="text-muted-foreground">
                      {parseFloat(w.weightKg).toFixed(2)} kg
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
