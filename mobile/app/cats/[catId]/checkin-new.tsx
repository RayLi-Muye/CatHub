import {
  bowelStatusValues,
  dailyCheckinMoodMax,
  dailyCheckinNotesMax,
  dailyCheckinScoreMax,
  dailyCheckinScoreMin,
  type BowelStatus,
} from "@cathub/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createDailyCheckin } from "../../../src/lib/api";

const MOOD_PRESETS = ["😺", "😻", "😾", "🙀", "😴", "🤒", "🥺"] as const;

const BOWEL_LABELS: Record<BowelStatus, string> = {
  normal: "Normal",
  soft: "Soft",
  hard: "Hard",
  diarrhea: "Diarrhea",
  constipation: "Constipation",
  none: "None",
};

function todayIsoDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function CheckinNewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ catId?: string }>();
  const catId = params.catId ? String(params.catId) : "";

  const [date, setDate] = useState(todayIsoDate());
  const [appetiteScore, setAppetiteScore] = useState(3);
  const [energyScore, setEnergyScore] = useState(3);
  const [bowelStatus, setBowelStatus] = useState<BowelStatus>("normal");
  const [moodEmoji, setMoodEmoji] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!catId) {
      setError("Missing cat id");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createDailyCheckin(catId, {
      date,
      appetiteScore,
      energyScore,
      bowelStatus,
      moodEmoji: moodEmoji.trim() || null,
      notes: notes.trim() || null,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.replace(`/cats/${catId}`);
  }

  if (!catId) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>Missing cat id.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>Daily check-in</Text>
          <Text style={styles.title}>How was today?</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Date</Text>
      <TextInput
        editable={!isSubmitting}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={date}
      />

      <Text style={styles.label}>
        Appetite — {appetiteScore} / {dailyCheckinScoreMax}
      </Text>
      <ScoreSelector
        disabled={isSubmitting}
        onChange={setAppetiteScore}
        value={appetiteScore}
      />

      <Text style={styles.label}>
        Energy — {energyScore} / {dailyCheckinScoreMax}
      </Text>
      <ScoreSelector
        disabled={isSubmitting}
        onChange={setEnergyScore}
        value={energyScore}
      />

      <Text style={styles.label}>Bowel</Text>
      <View style={styles.optionGrid}>
        {bowelStatusValues.map((status) => (
          <Pressable
            disabled={isSubmitting}
            key={status}
            onPress={() => setBowelStatus(status)}
            style={[
              styles.option,
              bowelStatus === status && styles.optionActive,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                bowelStatus === status && styles.optionTextActive,
              ]}
            >
              {BOWEL_LABELS[status]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Mood</Text>
      <View style={styles.optionGrid}>
        {MOOD_PRESETS.map((emoji) => (
          <Pressable
            disabled={isSubmitting}
            key={emoji}
            onPress={() =>
              setMoodEmoji((current) => (current === emoji ? "" : emoji))
            }
            style={[
              styles.optionEmoji,
              moodEmoji === emoji && styles.optionActive,
            ]}
          >
            <Text style={styles.optionEmojiText}>{emoji}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        editable={!isSubmitting}
        maxLength={dailyCheckinMoodMax}
        onChangeText={setMoodEmoji}
        placeholder="Or enter a custom emoji"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={moodEmoji}
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        editable={!isSubmitting}
        maxLength={dailyCheckinNotesMax}
        multiline
        onChangeText={setNotes}
        placeholder="Optional details for today"
        placeholderTextColor="#9ca3af"
        style={[styles.input, styles.textArea]}
        value={notes}
      />
      <Text style={styles.counter}>
        {dailyCheckinNotesMax - notes.length} chars left
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        disabled={isSubmitting}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.primaryButton,
          (pressed || isSubmitting) && styles.buttonPressed,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Save check-in</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function ScoreSelector({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  const ticks: number[] = [];
  for (let i = dailyCheckinScoreMin; i <= dailyCheckinScoreMax; i += 1) {
    ticks.push(i);
  }
  return (
    <View style={styles.scoreRow}>
      {ticks.map((tick) => (
        <Pressable
          disabled={disabled}
          key={tick}
          onPress={() => onChange(tick)}
          style={[styles.scoreTick, value >= tick && styles.scoreTickActive]}
        >
          <Text
            style={[
              styles.scoreTickText,
              value >= tick && styles.scoreTickTextActive,
            ]}
          >
            {tick}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#fffaf3",
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 64,
  },
  topBar: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  eyebrow: {
    color: "#b45309",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#1f2937",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 4,
  },
  label: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f2937",
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  counter: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 6,
    textAlign: "right",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#b45309",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 24,
    minHeight: 50,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#b45309",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.76,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionActive: {
    backgroundColor: "#b45309",
    borderColor: "#b45309",
  },
  optionText: {
    color: "#b45309",
    fontWeight: "700",
  },
  optionTextActive: {
    color: "#ffffff",
  },
  optionEmoji: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  optionEmojiText: {
    fontSize: 22,
  },
  scoreRow: {
    flexDirection: "row",
    gap: 8,
  },
  scoreTick: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  scoreTickActive: {
    backgroundColor: "#b45309",
    borderColor: "#b45309",
  },
  scoreTickText: {
    color: "#b45309",
    fontSize: 16,
    fontWeight: "700",
  },
  scoreTickTextActive: {
    color: "#ffffff",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
  },
});
