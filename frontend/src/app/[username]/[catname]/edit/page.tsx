import { notFound, redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, cats } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { CatForm } from "@/components/cat/cat-form";
import { updateCat, deleteCat } from "@/actions/cat";
import { DeleteCatButton } from "@/components/cat/delete-cat-button";

export default async function EditCatPage({
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

  const boundUpdate = updateCat.bind(null, cat.id);

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-8 py-16">
      <p className="text-sm uppercase tracking-[2.52px] text-brand-orange mb-2">
        EDIT CAT
      </p>
      <h1 className="text-4xl mb-8">{cat.name}</h1>

      <CatForm
        action={boundUpdate}
        initialData={cat}
        submitLabel="Save Changes"
      />

      <div className="mt-16 pt-8 border-t border-border">
        <h2 className="text-lg text-destructive mb-4">Danger Zone</h2>
        <DeleteCatButton catId={cat.id} catName={cat.name} deleteCat={deleteCat} />
      </div>
    </div>
  );
}
