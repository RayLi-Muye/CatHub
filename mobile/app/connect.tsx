import type {
  MobileCat,
  MobileIdentityCodeLookupPayload,
} from "@cathub/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createLineageConnectionRequest,
  getDashboard,
  lookupIdentityCode,
} from "../src/lib/api";

type ParentRole = "sire" | "dam";

export default function ConnectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const [identityCode, setIdentityCode] = useState(
    params.code ? String(params.code).toUpperCase() : ""
  );
  const [lookup, setLookup] = useState<MobileIdentityCodeLookupPayload | null>(
    null
  );
  const [cats, setCats] = useState<MobileCat[]>([]);
  const [childCatId, setChildCatId] = useState("");
  const [parentRole, setParentRole] = useState<ParentRole>("sire");
  const [requestNote, setRequestNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getDashboard().then((result) => {
      if (!isMounted || !result.ok) return;
      setCats(result.data.cats);
      setChildCatId(result.data.cats[0]?.id ?? "");
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLookup() {
    setIsLookingUp(true);
    setError(null);
    setSuccess(null);
    setLookup(null);

    const result = await lookupIdentityCode(identityCode);
    setIsLookingUp(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setLookup(result.data);
  }

  async function handleSubmit() {
    if (!childCatId) {
      setError("Choose one of your cats first.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await createLineageConnectionRequest({
      childCatId,
      identityCode,
      parentRole,
      requestNote: requestNote.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(result.data.message);
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>Connect</Text>
          <Text style={styles.title}>Identity code</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Shared code</Text>
      <TextInput
        autoCapitalize="characters"
        onChangeText={(value) => setIdentityCode(value.toUpperCase())}
        placeholder="CAT-XXXX-XXXX-XXXX"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={identityCode}
      />

      <Pressable
        disabled={isLookingUp}
        onPress={handleLookup}
        style={({ pressed }) => [
          styles.primaryButton,
          (pressed || isLookingUp) && styles.buttonPressed,
        ]}
      >
        {isLookingUp ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Find cat</Text>
        )}
      </Pressable>

      {lookup ? <LookupCard lookup={lookup} /> : null}

      {lookup ? (
        <View style={styles.formSection}>
          <Text style={styles.label}>Your cat</Text>
          <View style={styles.optionGrid}>
            {cats.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setChildCatId(cat.id)}
                style={[
                  styles.option,
                  childCatId === cat.id && styles.optionActive,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    childCatId === cat.id && styles.optionTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Parent role</Text>
          <View style={styles.segmented}>
            {(["sire", "dam"] as const).map((role) => (
              <Pressable
                key={role}
                onPress={() => setParentRole(role)}
                style={[
                  styles.segment,
                  parentRole === role && styles.segmentActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    parentRole === role && styles.segmentTextActive,
                  ]}
                >
                  {role === "sire" ? "Sire" : "Dam"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Note</Text>
          <TextInput
            multiline
            onChangeText={setRequestNote}
            placeholder="Optional context for the other owner"
            placeholderTextColor="#9ca3af"
            style={[styles.input, styles.textArea]}
            value={requestNote}
          />

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
              <Text style={styles.primaryButtonText}>Send request</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
    </ScrollView>
  );
}

function LookupCard({ lookup }: { lookup: MobileIdentityCodeLookupPayload }) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        {lookup.cat.avatarUrl ? (
          <Image
            alt={lookup.cat.name}
            source={{ uri: lookup.cat.avatarUrl }}
            style={styles.avatarImage}
          />
        ) : (
          <Text style={styles.avatarPlaceholder}>Cat</Text>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{lookup.cat.name}</Text>
        <Text style={styles.cardMeta}>
          {[lookup.cat.breed, lookup.cat.sex].filter(Boolean).join(" · ") ||
            "Profile"}
        </Text>
        <Text style={styles.cardOwner}>
          Owner: {lookup.cat.owner.displayName ?? lookup.cat.owner.username}
        </Text>
      </View>
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
    marginBottom: 26,
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
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0,
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
  },
  textArea: {
    minHeight: 92,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#b45309",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 50,
  },
  buttonPressed: {
    opacity: 0.76,
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
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginTop: 18,
    padding: 14,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#ffedd5",
    borderRadius: 8,
    height: 76,
    justifyContent: "center",
    overflow: "hidden",
    width: 76,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  avatarPlaceholder: {
    color: "#b45309",
    fontSize: 13,
    fontWeight: "700",
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "700",
  },
  cardMeta: {
    color: "#6b7280",
    fontSize: 14,
  },
  cardOwner: {
    color: "#4b5563",
    fontSize: 14,
  },
  formSection: {
    marginTop: 4,
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
  segmented: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  segment: {
    alignItems: "center",
    flex: 1,
    minHeight: 46,
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: "#b45309",
  },
  segmentText: {
    color: "#b45309",
    fontWeight: "700",
  },
  segmentTextActive: {
    color: "#ffffff",
  },
  error: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
  },
  success: {
    color: "#047857",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
  },
});
