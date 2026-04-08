"use client";

type WeightPoint = {
  date: string;
  weight: number;
};

export function WeightChart({ data }: { data: WeightPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No weight data yet.
      </p>
    );
  }

  const weights = data.map((d) => d.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const chartHeight = 120;
  const chartWidth = 100; // percentage

  const points = data.map((d, i) => {
    const x = data.length === 1 ? 50 : (i / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((d.weight - min) / range) * (chartHeight - 20) - 10;
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-32"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chartHeight - ratio * (chartHeight - 20) - 10;
          return (
            <line
              key={ratio}
              x1="0"
              y1={y}
              x2={chartWidth}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeWidth="0.3"
            />
          );
        })}

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#fa520f"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2"
            fill="#fa520f"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{data[0].date}</span>
        <span>
          {min.toFixed(1)} – {max.toFixed(1)} kg
        </span>
        <span>{data[data.length - 1].date}</span>
      </div>
    </div>
  );
}
