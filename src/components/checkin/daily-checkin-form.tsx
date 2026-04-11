"use client";

import { useActionState, useState } from "react";
import { createDailyCheckin, type CheckinActionState } from "@/actions/checkin";

const APPETITE_LABELS = ["😫", "😟", "😐", "😊", "😋"];
const ENERGY_LABELS = ["😴", "🥱", "😺", "😸", "⚡"];
const MOOD_OPTIONS = ["😊", "😴", "😼", "😿", "🤒", "😾"];
const BOWEL_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "soft", label: "Soft" },
  { value: "hard", label: "Hard" },
  { value: "diarrhea", label: "Diarrhea" },
  { value: "constipation", label: "Constipation" },
  { value: "none", label: "None" },
] as const;

export function DailyCheckinForm({ catId }: { catId: string }) {
  const boundAction = createDailyCheckin.bind(null, catId);
  const [state, formAction, isPending] = useActionState<
    CheckinActionState,
    FormData
  >(boundAction, {});

  const [appetite, setAppetite] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [bowel, setBowel] = useState("normal");
  const [mood, setMood] = useState("");

  const today = new Date().toISOString().split("T")[0];

  if (state.success) {
    return (
      <div className="bg-card p-4 text-center">
        <p className="text-sm text-green-600">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="bg-card p-5 shadow-golden">
      <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
        Daily Check-in
      </h3>

      <input type="hidden" name="date" value={today} />
      <input type="hidden" name="appetiteScore" value={appetite} />
      <input type="hidden" name="energyScore" value={energy} />
      <input type="hidden" name="bowelStatus" value={bowel} />
      <input type="hidden" name="moodEmoji" value={mood} />

      {state.error && (
        <p className="text-sm text-destructive mb-3">{state.error}</p>
      )}

      {/* Appetite */}
      <div className="mb-4">
        <label className="text-xs text-muted-foreground block mb-2">
          Appetite
        </label>
        <div className="flex gap-1">
          {APPETITE_LABELS.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAppetite(i + 1)}
              className={`w-10 h-10 text-lg flex items-center justify-center transition-all ${
                appetite === i + 1
                  ? "bg-brand-orange/20 ring-1 ring-brand-orange scale-110"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Energy */}
      <div className="mb-4">
        <label className="text-xs text-muted-foreground block mb-2">
          Energy
        </label>
        <div className="flex gap-1">
          {ENERGY_LABELS.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setEnergy(i + 1)}
              className={`w-10 h-10 text-lg flex items-center justify-center transition-all ${
                energy === i + 1
                  ? "bg-brand-orange/20 ring-1 ring-brand-orange scale-110"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Bowel Status */}
      <div className="mb-4">
        <label className="text-xs text-muted-foreground block mb-2">
          Bowel
        </label>
        <div className="flex flex-wrap gap-1">
          {BOWEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setBowel(opt.value)}
              className={`px-3 py-1.5 text-xs transition-all ${
                bowel === opt.value
                  ? "bg-brand-orange/20 ring-1 ring-brand-orange text-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div className="mb-4">
        <label className="text-xs text-muted-foreground block mb-2">
          Mood
        </label>
        <div className="flex gap-1">
          {MOOD_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setMood(mood === emoji ? "" : emoji)}
              className={`w-10 h-10 text-lg flex items-center justify-center transition-all ${
                mood === emoji
                  ? "bg-brand-orange/20 ring-1 ring-brand-orange scale-110"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <textarea
          name="notes"
          placeholder="Optional notes..."
          rows={2}
          maxLength={500}
          className="w-full px-3 py-2 bg-background border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand-orange"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-primary text-primary-foreground text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Check In"}
      </button>
    </form>
  );
}
