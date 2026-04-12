import Link from "next/link";

const generationOptions = [
  { label: "3 generations", value: "3" },
  { label: "4 generations", value: "4" },
  { label: "5 generations", value: "5" },
  { label: "6 generations", value: "6" },
  { label: "All linked", value: "all" },
];

export function LineageGenerationSelector({
  baseHref,
  selectedValue,
}: {
  baseHref: string;
  selectedValue: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {generationOptions.map((option) => {
        const isSelected = option.value === selectedValue;

        return (
          <Link
            key={option.value}
            href={`${baseHref}?generations=${option.value}`}
            className={`px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
