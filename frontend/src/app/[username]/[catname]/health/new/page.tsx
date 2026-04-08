import { notFound, redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, cats } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { HealthRecordForm } from "@/components/health/health-record-form";
import { createHealthRecord } from "@/actions/health";

export default async function NewHealthRecordPage({
  params,
}: {
  params: Promise<{ username: string; catname: string }>;
}) {
  const { username, catname } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user || user.id !== session.user.id) notFound();

  const [cat] = await db
    .select()
    .from(cats)
    .where(and(eq(cats.ownerId, user.id), eq(cats.slug, catname)))
    .limit(1);

  if (!cat) notFound();

  const boundAction = createHealthRecord.bind(null, cat.id);

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-8 py-16">
      <p className="text-sm uppercase tracking-[2.52px] text-brand-orange mb-2">
        NEW HEALTH RECORD
      </p>
      <h1 className="text-4xl mb-2">{cat.name}</h1>
      <p className="text-muted-foreground mb-8">
        Add a health record for {cat.name}
      </p>
      <HealthRecordForm action={boundAction} />
    </div>
  );
}
