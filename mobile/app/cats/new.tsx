import {
  catBreedMax,
  catColorMarkingsMax,
  catDescriptionMax,
  catMicrochipMax,
  catNameMax,
  catSexValues,
  type CatSex,
} from "@cathub/shared";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { createCat } from "../../src/lib/api";

const SEX_LABELS: Record<CatSex, string> = {
  male: "Male",
  female: "Female",
  unknown: "Unknown",
};

export default function CatNewScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState<CatSex>("unknown");
  const [birthdate, setBirthdate] = useState("");
  const [description, setDescription] = useState("");
  const [colorMarkings, setColorMarkings] = useState("");
  const [microchipId, setMicrochipId] = useState("");
  const [isNeutered, setIsNeutered] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createCat({
      name: trimmedName,
      breed: breed.trim() || null,
      sex,
      birthdate: birthdate.trim() || null,
      description: description.trim() || null,
      colorMarkings: colorMarkings.trim() || null,
      microchipId: microchipId.trim() || null,
      isNeutered,
      isPublic,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.replace(`/cats/${result.data.cat.id}`);
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>New cat</Text>
          <Text style={styles.title}>Create profile</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Name</Text>
      <TextInput
        editable={!isSubmitting}
        maxLength={catNameMax}
        onChangeText={setName}
        placeholder="Cat name"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={name}
      />

      <Text style={styles.label}>Breed</Text>
      <TextInput
        editable={!isSubmitting}
        maxLength={catBreedMax}
        onChangeText={setBreed}
        placeholder="Optional"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={breed}
      />

      <Text style={styles.label}>Sex</Text>
      <View style={styles.optionGrid}>
        {catSexValues.map((value) => (
          <Pressable
            disabled={isSubmitting}
            key={value}
            onPress={() => setSex(value)}
            style={[styles.option, sex === value && styles.optionActive]}
          >
            <Text
              style={[
                styles.optionText,
                sex === value && styles.optionTextActive,
              ]}
            >
              {SEX_LABELS[value]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Birthdate</Text>
      <TextInput
        editable={!isSubmitting}
        onChangeText={setBirthdate}
        placeholder="YYYY-MM-DD (optional)"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={birthdate}
      />

      <Text style={styles.label}>Color / markings</Text>
      <TextInput
        editable={!isSubmitting}
        maxLength={catColorMarkingsMax}
        onChangeText={setColorMarkings}
        placeholder="Optional"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={colorMarkings}
      />

      <Text style={styles.label}>Microchip ID</Text>
      <TextInput
        editable={!isSubmitting}
        maxLength={catMicrochipMax}
        onChangeText={setMicrochipId}
        placeholder="Optional"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={microchipId}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        editable={!isSubmitting}
        maxLength={catDescriptionMax}
        multiline
        onChangeText={setDescription}
        placeholder="Optional"
        placeholderTextColor="#9ca3af"
        style={[styles.input, styles.textArea]}
        value={description}
      />

      <View style={styles.toggleRow}>
        <View style={styles.toggleLabelGroup}>
          <Text style={styles.toggleLabel}>Neutered</Text>
        </View>
        <Switch
          disabled={isSubmitting}
          onValueChange={setIsNeutered}
          trackColor={{ true: "#fdba74", false: "#e5e7eb" }}
          value={isNeutered}
        />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleLabelGroup}>
          <Text style={styles.toggleLabel}>Public profile</Text>
          <Text style={styles.toggleHelp}>
            Visible to anyone with the URL when on.
          </Text>
        </View>
        <Switch
          disabled={isSubmitting}
          onValueChange={setIsPublic}
          trackColor={{ true: "#fdba74", false: "#e5e7eb" }}
          value={isPublic}
        />
      </View>

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
          <Text style={styles.primaryButtonText}>Create cat</Text>
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
  toggleRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    padding: 14,
  },
  toggleLabelGroup: {
    flex: 1,
    paddingRight: 12,
  },
  toggleLabel: {
    color: "#1f2937",
    fontSize: 15,
    fontWeight: "700",
  },
  toggleHelp: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 2,
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
