import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, cats } from "@/lib/db/schema";
import { CatCard } from "@/components/cat/cat-card";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) notFound();

  const userCats = await db
    .select()
    .from(cats)
    .where(eq(cats.ownerId, user.id))
    .orderBy(cats.createdAt);

  const publicCats = userCats.filter((c) => c.isPublic);

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-8 py-16">
      <div className="mb-12">
        <div className="w-16 h-16 bg-sunshine-700 flex items-center justify-center text-white text-2xl mb-4">
          {(user.displayName ?? user.username)[0].toUpperCase()}
        </div>
        <h1 className="text-4xl mb-1">{user.displayName ?? user.username}</h1>
        <p className="text-muted-foreground">@{user.username}</p>
        {user.bio && <p className="mt-3 text-muted-foreground">{user.bio}</p>}
      </div>

      <p className="text-sm uppercase tracking-[2.52px] text-brand-orange mb-6">
        CATS ({publicCats.length})
      </p>

      {publicCats.length === 0 ? (
        <p className="text-muted-foreground">No public cats yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicCats.map((cat) => (
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
