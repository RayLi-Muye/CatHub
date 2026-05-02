import { weightLogMaxKg, weightLogNotesMax } from "@cathub/shared";
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
import { createWeightLog } from "../../../src/lib/api";

function todayIsoDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function WeightNewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ catId?: string }>();
  const catId = params.catId ? String(params.catId) : "";

  const [weightKg, setWeightKg] = useState("");
  const [recordedAt, setRecordedAt] = useState(todayIsoDate());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!catId) {
      setError("Missing cat id");
      return;
    }

    const value = weightKg.trim();
    if (!value) {
      setError("Weight is required.");
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
      setError("Weight must be a number with up to 2 decimals.");
      return;
    }
    const weightNum = Number.parseFloat(value);
    if (
      Number.isNaN(weightNum) ||
      weightNum <= 0 ||
      weightNum > weightLogMaxKg
    ) {
      setError(`Weight must be between 0 and ${weightLogMaxKg} kg.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createWeightLog(catId, {
      weightKg: value,
      recordedAt,
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
          <Text style={styles.eyebrow}>Weight</Text>
          <Text style={styles.title}>Log weight</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Weight (kg)</Text>
      <TextInput
        editable={!isSubmitting}
        keyboardType="decimal-pad"
        onChangeText={setWeightKg}
        placeholder="e.g. 4.25"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={weightKg}
      />

      <Text style={styles.label}>Date</Text>
      <TextInput
        editable={!isSubmitting}
        onChangeText={setRecordedAt}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={recordedAt}
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        editable={!isSubmitting}
        maxLength={weightLogNotesMax}
        multiline
        onChangeText={setNotes}
        placeholder="Optional"
        placeholderTextColor="#9ca3af"
        style={[styles.input, styles.textArea]}
        value={notes}
      />

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
          <Text style={styles.primaryButtonText}>Save weight</Text>
        )}
      </Pressable>
    </ScrollView>
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
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
  },
});
