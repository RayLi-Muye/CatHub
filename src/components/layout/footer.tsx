import Link from "next/link";

export function Footer() {
  return (
    <footer className="px-6 md:px-10 py-12 border-t border-border">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex gap-0.5">
            <span className="w-1 h-3 bg-bright-yellow" />
            <span className="w-1 h-3 bg-sunshine-700" />
            <span className="w-1 h-3 bg-brand-block-orange" />
            <span className="w-1 h-3 bg-brand-orange" />
          </div>
          <span className="text-sm">CatHub</span>
        </Link>
        <p className="text-sm text-muted-foreground">
          Built for cats and their humans
        </p>
      </div>
    </footer>
  );
}
