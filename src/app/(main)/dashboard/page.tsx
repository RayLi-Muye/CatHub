import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cats, users } from "@/lib/db/schema";
import { getLineageConnectionInbox } from "@/lib/lineage/connection-queries";
import {
  acceptLineageConnectionRequest,
  cancelLineageConnectionRequest,
  declineLineageConnectionRequest,
} from "@/actions/lineage-connections";
import { CatCard } from "@/components/cat/cat-card";
import {
  IncomingLineageConnectionRequestCard,
  OutgoingLineageConnectionRequestCard,
} from "@/components/lineage/lineage-connection-request-card";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) redirect("/login");

  const [myCats, lineageInbox] = await Promise.all([
    db
      .select()
      .from(cats)
      .where(eq(cats.ownerId, session.user.id))
      .orderBy(cats.createdAt),
    getLineageConnectionInbox(session.user.id),
  ]);

  const hasLineageRequests =
    lineageInbox.incoming.length > 0 || lineageInbox.outgoing.length > 0;

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

      {hasLineageRequests && (
        <section className="mb-12">
          <div className="mb-4">
            <p className="text-sm uppercase tracking-[2.52px] text-brand-orange mb-2">
              LINEAGE REQUESTS
            </p>
            <h2 className="text-2xl">External connection review</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              External identity code links only become confirmed lineage edges
              after the shared cat owner accepts the request.
            </p>
          </div>

          <div className="grid gap-4">
            {lineageInbox.incoming.map((request) => (
              <IncomingLineageConnectionRequestCard
                key={request.id}
                request={request}
                acceptAction={acceptLineageConnectionRequest.bind(
                  null,
                  request.id
                )}
                declineAction={declineLineageConnectionRequest.bind(
                  null,
                  request.id
                )}
              />
            ))}
            {lineageInbox.outgoing.map((request) => (
              <OutgoingLineageConnectionRequestCard
                key={request.id}
                request={request}
                cancelAction={cancelLineageConnectionRequest.bind(
                  null,
                  request.id
                )}
              />
            ))}
          </div>
        </section>
      )}

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
