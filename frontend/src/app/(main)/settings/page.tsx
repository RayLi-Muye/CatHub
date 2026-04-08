import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { CredentialsSettingsForm } from "@/components/settings/credentials-settings-form";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user] = await db
    .select({
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      bio: users.bio,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) redirect("/login");

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-8 py-16">
      <div className="mb-10">
        <p className="text-sm uppercase tracking-[2.52px] text-brand-orange mb-2">
          SETTINGS
        </p>
        <h1 className="text-4xl mb-2">Account settings</h1>
        <p className="text-muted-foreground max-w-2xl">
          Manage the public identity behind your cats and the login credentials
          behind your account.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-8">
          <ProfileSettingsForm
            displayName={user.displayName}
            bio={user.bio}
          />
          <CredentialsSettingsForm username={user.username} email={user.email} />
        </div>

        <aside className="bg-background border border-border p-6 h-fit">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            Account
          </p>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Public profile</p>
              <Link
                href={`/${user.username}`}
                className="text-brand-orange hover:underline break-all"
              >
                /{user.username}
              </Link>
            </div>

            <div>
              <p className="text-muted-foreground mb-1">Member since</p>
              <p>{user.createdAt.toLocaleDateString()}</p>
            </div>

            <div>
              <p className="text-muted-foreground mb-1">Security note</p>
              <p>
                Sensitive account changes require your current password. If you
                change your username, your public cat URLs will move with it.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
