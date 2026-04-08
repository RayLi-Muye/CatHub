import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CatForm } from "@/components/cat/cat-form";
import { createCat } from "@/actions/cat";

export default async function NewCatPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-8 py-16">
      <p className="text-sm uppercase tracking-[2.52px] text-brand-orange mb-2">
        NEW CAT
      </p>
      <h1 className="text-4xl mb-8">Create a cat profile</h1>
      <CatForm action={createCat} submitLabel="Create Cat" />
    </div>
  );
}
