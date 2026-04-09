"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
      <p className="text-sm uppercase tracking-[2.52px] text-destructive mb-4">
        ERROR
      </p>
      <h1 className="text-4xl mb-4">Something went wrong</h1>
      <p className="text-lg text-muted-foreground mb-8">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
      >
        Try Again
      </button>
    </div>
  );
}
