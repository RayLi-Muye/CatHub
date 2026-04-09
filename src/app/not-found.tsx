import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
      <p className="text-sm uppercase tracking-[2.52px] text-brand-orange mb-4">
        404
      </p>
      <h1 className="text-5xl md:text-7xl leading-none tracking-tight mb-4">
        Page not found
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
      >
        Go Home
      </Link>
    </div>
  );
}
