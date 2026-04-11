const APPETITE_LABELS = ["😫", "😟", "😐", "😊", "😋"];
const ENERGY_LABELS = ["😴", "🥱", "😺", "😸", "⚡"];

type CheckinData = {
  appetiteScore: number;
  energyScore: number;
  bowelStatus: string;
  moodEmoji: string | null;
  notes: string | null;
};

export function CheckinSummary({ checkin }: { checkin: CheckinData }) {
  return (
    <div className="bg-card p-4 shadow-golden">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Today&apos;s Check-in
      </h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <span className="text-lg">
            {APPETITE_LABELS[checkin.appetiteScore - 1]}
          </span>
          <p className="text-[10px] text-muted-foreground mt-0.5">Appetite</p>
        </div>
        <div>
          <span className="text-lg">
            {ENERGY_LABELS[checkin.energyScore - 1]}
          </span>
          <p className="text-[10px] text-muted-foreground mt-0.5">Energy</p>
        </div>
        <div>
          <span className="text-lg">{checkin.moodEmoji || "—"}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">Mood</p>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span className="text-xs px-2 py-0.5 bg-secondary capitalize">
          {checkin.bowelStatus}
        </span>
      </div>
      {checkin.notes && (
        <p className="text-xs text-muted-foreground mt-2 italic">
          {checkin.notes}
        </p>
      )}
    </div>
  );
}
