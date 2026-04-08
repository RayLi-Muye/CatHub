import Image from "next/image";
import Link from "next/link";

type CatCardProps = {
  username: string;
  slug: string;
  name: string;
  breed?: string | null;
  sex?: string | null;
  birthdate?: Date | null;
  avatarUrl?: string | null;
  description?: string | null;
};

function getAge(birthdate: Date): string {
  const now = new Date();
  const years = now.getFullYear() - birthdate.getFullYear();
  const months = now.getMonth() - birthdate.getMonth();
  const totalMonths = years * 12 + months;

  if (totalMonths < 1) return "< 1 month";
  if (totalMonths < 12) return `${totalMonths} month${totalMonths > 1 ? "s" : ""}`;
  const y = Math.floor(totalMonths / 12);
  return `${y} year${y > 1 ? "s" : ""}`;
}

const sexLabels: Record<string, string> = {
  male: "♂ Male",
  female: "♀ Female",
  unknown: "Unknown",
};

export function CatCard({
  username,
  slug,
  name,
  breed,
  sex,
  birthdate,
  avatarUrl,
  description,
}: CatCardProps) {
  return (
    <Link
      href={`/${username}/${slug}`}
      className="block bg-card p-6 shadow-golden hover:translate-y-[-2px] transition-transform"
    >
      {/* Avatar placeholder */}
      <div className="relative w-full aspect-square bg-sunshine-300/30 mb-4 flex items-center justify-center text-5xl overflow-hidden">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          "🐱"
        )}
      </div>

      <h3 className="text-xl mb-1">{name}</h3>

      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-2">
        {breed && <span>{breed}</span>}
        {breed && sex && <span>·</span>}
        {sex && <span>{sexLabels[sex] ?? sex}</span>}
        {birthdate && (
          <>
            <span>·</span>
            <span>{getAge(birthdate)}</span>
          </>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      )}
    </Link>
  );
}
