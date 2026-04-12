import { and, eq, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { cats, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import {
  getAncestorEntries,
  getDescendantEntries,
  groupLineageByDepth,
  type LineageEntry,
} from "@/lib/lineage/queries";
import { setInternalParent, removeLineageEdge } from "@/actions/lineage";
import { ProfileTabs } from "@/components/cat/profile-tabs";
import { LineageCatCard } from "@/components/lineage/lineage-cat-card";
import { LineageParentForm } from "@/components/lineage/lineage-parent-form";
import { LineageGenerationSelector } from "@/components/lineage/lineage-generation-selector";

const MAX_ALL_GENERATIONS = 25;

function parseGenerationSelection(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (rawValue === "all") {
    return {
      depth: MAX_ALL_GENERATIONS,
      selectedValue: "all",
      label: "all linked generations",
    };
  }

  const numericValue = Number(rawValue ?? 3);
  const depth = [3, 4, 5, 6].includes(numericValue) ? numericValue : 3;

  return {
    depth,
    selectedValue: String(depth),
    label: `${depth} generation${depth > 1 ? "s" : ""}`,
  };
}

function getAncestorTitle(depth: number) {
  if (depth === 1) return "G1 · Parents";
  if (depth === 2) return "G2 · Grandparents";
  if (depth === 3) return "G3 · Great-grandparents";
  return `G${depth} · Ancestors`;
}

function getDescendantTitle(depth: number) {
  if (depth === 1) return "G1 · Children";
  if (depth === 2) return "G2 · Grandchildren";
  if (depth === 3) return "G3 · Great-grandchildren";
  return `G${depth} · Descendants`;
}

function filterVisible(entries: LineageEntry[], isOwner: boolean) {
  if (isOwner) return entries;
  return entries.filter((entry) => entry.cat.isPublic);
}

function LineageDepthSection({
  title,
  entries,
  context,
}: {
  title: string;
  entries: LineageEntry[];
  context: "ancestor" | "descendant";
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm uppercase tracking-[2px] text-muted-foreground">
        {title}
      </h2>
      {entries.length === 0 ? (
        <div className="bg-card p-5 text-sm text-muted-foreground">
          No confirmed cats in this generation.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {entries.map((entry) => (
            <LineageCatCard
              key={entry.edgeId}
              entry={entry}
              context={context}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function LineagePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; catname: string }>;
  searchParams: Promise<{ generations?: string | string[] }>;
}) {
  const { username, catname } = await params;
  const { generations } = await searchParams;
  const generationSelection = parseGenerationSelection(generations);

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

  const [ancestorEntries, descendantEntries, candidateCats] = await Promise.all([
    getAncestorEntries(cat.id, generationSelection.depth),
    getDescendantEntries(cat.id, generationSelection.depth),
    isOwner
      ? db
          .select({
            id: cats.id,
            name: cats.name,
            breed: cats.breed,
            sex: cats.sex,
          })
          .from(cats)
          .where(and(eq(cats.ownerId, user.id), ne(cats.id, cat.id)))
          .orderBy(cats.name)
      : Promise.resolve([]),
  ]);

  const visibleAncestors = filterVisible(ancestorEntries, isOwner);
  const visibleDescendants = filterVisible(descendantEntries, isOwner);
  const ancestorsByDepth = groupLineageByDepth(visibleAncestors);
  const descendantsByDepth = groupLineageByDepth(visibleDescendants);

  const currentSire = ancestorEntries.find(
    (entry) => entry.depth === 1 && entry.parentRole === "sire"
  );
  const currentDam = ancestorEntries.find(
    (entry) => entry.depth === 1 && entry.parentRole === "dam"
  );

  const setSireAction = setInternalParent.bind(null, cat.id, "sire");
  const setDamAction = setInternalParent.bind(null, cat.id, "dam");
  const removeSireAction = currentSire
    ? removeLineageEdge.bind(null, currentSire.edgeId)
    : undefined;
  const removeDamAction = currentDam
    ? removeLineageEdge.bind(null, currentDam.edgeId)
    : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16 md:px-8">
      <div className="mb-8">
        <p className="mb-2 text-sm uppercase tracking-[2.52px] text-brand-orange">
          Lineage Graph
        </p>
        <h1 className="text-4xl mb-1">{cat.name}</h1>
        <p className="text-muted-foreground">
          @{username}/{cat.slug} · Showing {generationSelection.label}
        </p>
      </div>

      <ProfileTabs username={username} catname={catname} />

      <section className="mb-8 flex flex-col gap-3 border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm uppercase tracking-[2px] text-muted-foreground">
            Display depth
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose how many generations to render for ancestors and descendants.
          </p>
        </div>
        <LineageGenerationSelector
          baseHref={`/${username}/${catname}/lineage`}
          selectedValue={generationSelection.selectedValue}
        />
      </section>

      {isOwner && (
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-2xl">Internal parent links</h2>
            <p className="text-sm text-muted-foreground">
              Link this cat to parents already in your CatHub records. CatHub
              checks for self-links and ancestor cycles before saving.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <LineageParentForm
              role="sire"
              candidates={candidateCats}
              currentParent={
                currentSire
                  ? {
                      edgeId: currentSire.edgeId,
                      id: currentSire.cat.id,
                      name: currentSire.cat.name,
                      breed: currentSire.cat.breed,
                      sex: currentSire.cat.sex,
                    }
                  : undefined
              }
              setAction={setSireAction}
              removeAction={removeSireAction}
            />
            <LineageParentForm
              role="dam"
              candidates={candidateCats}
              currentParent={
                currentDam
                  ? {
                      edgeId: currentDam.edgeId,
                      id: currentDam.cat.id,
                      name: currentDam.cat.name,
                      breed: currentDam.cat.breed,
                      sex: currentDam.cat.sex,
                    }
                  : undefined
              }
              setAction={setDamAction}
              removeAction={removeDamAction}
            />
          </div>
        </section>
      )}

      <div className="grid gap-10">
        {Array.from(
          { length: generationSelection.depth },
          (_, index) => index + 1
        ).map((depth) => (
          <LineageDepthSection
            key={depth}
            title={getAncestorTitle(depth)}
            entries={ancestorsByDepth[depth] ?? []}
            context="ancestor"
          />
        ))}

        <section className="border-t border-border pt-10">
          <h2 className="mb-2 text-2xl">Descendant paths</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Follow this cat forward through confirmed children and later
            generations.
          </p>
          <div className="grid gap-8">
            {Array.from(
              { length: generationSelection.depth },
              (_, index) => index + 1
            ).map((depth) => (
              <LineageDepthSection
                key={depth}
                title={getDescendantTitle(depth)}
                entries={descendantsByDepth[depth] ?? []}
                context="descendant"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
