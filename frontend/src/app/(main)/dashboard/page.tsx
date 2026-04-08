import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cats, users } from "@/lib/db/schema";
import { CatCard } from "@/components/cat/cat-card";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const myCats = await db
    .select()
    .from(cats)
    .where(eq(cats.ownerId, session.user.id))
    .orderBy(cats.createdAt);

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-8 py-16">
      <div className="flex items-center justify-between mb-12">
        <div>
          <p className="text-sm uppercase tracking-[2.52px] text-brand-orange mb-2">
            DASHBOARD
          </p>
          <h1 className="text-4xl">My Cats</h1>
        </div>
        <Link
          href="/cats/new"
          className="px-5 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          Add Cat
        </Link>
      </div>

      {myCats.length === 0 ? (
        <div className="p-12 bg-card text-center">
          <p className="text-muted-foreground text-lg mb-4">
            You haven&apos;t added any cats yet.
          </p>
          <Link
            href="/cats/new"
            className="inline-block px-5 py-3 bg-secondary text-secondary-foreground text-sm uppercase tracking-wider hover:opacity-80 transition-opacity"
          >
            Create your first cat profile
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {myCats.map((cat) => (
            <CatCard
              key={cat.id}
              username={user.username}
              slug={cat.slug}
              name={cat.name}
              breed={cat.breed}
              sex={cat.sex}
              birthdate={cat.birthdate}
              avatarUrl={cat.avatarUrl}
              description={cat.description}
            />
          ))}
        </div>
      )}
    </div>
  );
}
