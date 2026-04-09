import Link from "next/link";
import { auth } from "@/lib/auth";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

function BrandBlock() {
  return (
    <div className="flex gap-0.5">
      <span className="w-1.5 h-[18px] bg-bright-yellow" />
      <span className="w-1.5 h-[18px] bg-sunshine-700" />
      <span className="w-1.5 h-[18px] bg-brand-block-orange" />
      <span className="w-1.5 h-[18px] bg-brand-orange" />
    </div>
  );
}

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-background/92 backdrop-blur-xl border-b border-border">
      <Link href="/" className="flex items-center gap-2.5">
        <BrandBlock />
        <span className="text-lg tracking-tight">CatHub</span>
      </Link>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        {session?.user ? (
          <UserMenu user={session.user} />
        ) : (
          <>
            <Link
              href="/login"
              className="px-3 py-2 text-sm text-foreground/60 hover:text-foreground transition-colors uppercase tracking-wider"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="px-3 py-2 text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity uppercase tracking-wider"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
