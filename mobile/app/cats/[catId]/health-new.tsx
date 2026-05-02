import {
  healthRecordDescriptionMax,
  healthRecordTitleMax,
  healthRecordTypeValues,
  healthRecordVetClinicMax,
  healthRecordVetNameMax,
  type HealthRecordType,
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
import { createHealthRecord } from "../../../src/lib/api";

const TYPE_LABELS: Record<HealthRecordType, string> = {
  checkup: "Checkup",
  vaccination: "Vaccination",
  surgery: "Surgery",
  illness: "Illness",
  medication: "Medication",
  other: "Other",
};

function todayIsoDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function HealthNewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ catId?: string }>();
  const catId = params.catId ? String(params.catId) : "";

  const [type, setType] = useState<HealthRecordType>("checkup");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayIsoDate());
  const [vetName, setVetName] = useState("");
  const [vetClinic, setVetClinic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!catId) {
      setError("Missing cat id");
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createHealthRecord(catId, {
      type,
      title: trimmedTitle,
      description: description.trim() || null,
      date,
      vetName: vetName.trim() || null,
      vetClinic: vetClinic.trim() || null,
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
          <Text style={styles.eyebrow}>Health</Text>
          <Text style={styles.title}>New record</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Type</Text>
      <View style={styles.optionGrid}>
        {healthRecordTypeValues.map((value) => (
          <Pressable
            disabled={isSubmitting}
            key={value}
            onPress={() => setType(value)}
            style={[styles.option, type === value && styles.optionActive]}
          >
            <Text
              style={[
                styles.optionText,
                type === value && styles.optionTextActive,
              ]}
            >
              {TYPE_LABELS[value]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Title</Text>
      <TextInput
        editable={!isSubmitting}
        maxLength={healthRecordTitleMax}
        onChangeText={setTitle}
        placeholder="e.g. Annual rabies booster"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={title}
      />

      <Text style={styles.label}>Date</Text>
      <TextInput
        editable={!isSubmitting}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={date}
      />

      <Text style={styles.label}>Vet name</Text>
      <TextInput
        editable={!isSubmitting}
        maxLength={healthRecordVetNameMax}
        onChangeText={setVetName}
        placeholder="Optional"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={vetName}
      />

      <Text style={styles.label}>Vet clinic</Text>
      <TextInput
        editable={!isSubmitting}
        maxLength={healthRecordVetClinicMax}
        onChangeText={setVetClinic}
        placeholder="Optional"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={vetClinic}
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        editable={!isSubmitting}
        maxLength={healthRecordDescriptionMax}
        multiline
        onChangeText={setDescription}
        placeholder="Optional details"
        placeholderTextColor="#9ca3af"
        style={[styles.input, styles.textArea]}
        value={description}
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
          <Text style={styles.primaryButtonText}>Save record</Text>
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
