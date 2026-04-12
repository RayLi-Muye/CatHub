"use server";

import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { catIdentityCodes, cats, users } from "@/lib/db/schema";

export type IdentityCodeActionState = {
  error?: string;
  success?: string;
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCodeSegment(length: number) {
  const bytes = randomBytes(length);
  let segment = "";

  for (const byte of bytes) {
    segment += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }

  return segment;
}

function generateIdentityCode() {
  return `CAT-${randomCodeSegment(4)}-${randomCodeSegment(4)}-${randomCodeSegment(4)}`;
}

export async function generateCatIdentityCode(
  catId: string,
  _prevState: IdentityCodeActionState,
  _formData: FormData
): Promise<IdentityCodeActionState> {
  void _formData;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [cat] = await db
    .select({
      id: cats.id,
      ownerId: cats.ownerId,
      slug: cats.slug,
    })
    .from(cats)
    .where(eq(cats.id, catId))
    .limit(1);

  if (!cat || cat.ownerId !== session.user.id) {
    return { error: "Cat not found or access denied." };
  }

  const [existingCode] = await db
    .select({ code: catIdentityCodes.code })
    .from(catIdentityCodes)
    .where(
      and(
        eq(catIdentityCodes.catId, catId),
        eq(catIdentityCodes.isActive, true)
      )
    )
    .limit(1);

  if (existingCode) {
    return { success: "This cat already has an identity code." };
  }

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return { error: "User not found." };
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await db.insert(catIdentityCodes).values({
        catId,
        code: generateIdentityCode(),
        visibility: "private",
        createdByUserId: session.user.id,
      });

      revalidatePath(`/${user.username}/${cat.slug}/lineage`);
      return { success: "Identity code generated." };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("cat_identity_codes_cat_active_idx")) {
        const [activeCode] = await db
          .select({ code: catIdentityCodes.code })
          .from(catIdentityCodes)
          .where(
            and(
              eq(catIdentityCodes.catId, catId),
              eq(catIdentityCodes.isActive, true)
            )
          )
          .limit(1);

        if (activeCode) {
          revalidatePath(`/${user.username}/${cat.slug}/lineage`);
          return { success: "This cat already has an identity code." };
        }
      }

      if (!message.includes("cat_identity_codes_code_unique")) {
        return { error: "Failed to generate identity code." };
      }
    }
  }

  return { error: "Failed to generate a unique code. Please try again." };
}
