export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <div className="flex gap-1">
        <span className="w-2 h-8 bg-bright-yellow animate-pulse" />
        <span className="w-2 h-8 bg-sunshine-700 animate-pulse [animation-delay:150ms]" />
        <span className="w-2 h-8 bg-brand-block-orange animate-pulse [animation-delay:300ms]" />
        <span className="w-2 h-8 bg-brand-orange animate-pulse [animation-delay:450ms]" />
      </div>
    </div>
  );
}
