import type { MobileCat, MobileUser } from "@cathub/shared";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getDashboard } from "../src/lib/api";
import { clearAccessToken } from "../src/lib/token-store";

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<MobileUser | null>(null);
  const [cats, setCats] = useState<MobileCat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getDashboard().then((result) => {
      if (!isMounted) return;
      if (!result.ok) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      setUser(result.data.user);
      setCats(result.data.cats);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSignOut() {
    await clearAccessToken();
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color="#b45309" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={handleSignOut} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back to sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>Dashboard</Text>
          <Text style={styles.title}>My Cats</Text>
          <Text style={styles.subtitle}>
            {user?.displayName ?? user?.username}
          </Text>
        </View>
        <Pressable onPress={handleSignOut} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Sign out</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push("/connect")}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>Connect identity code</Text>
      </Pressable>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={cats}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>No cats yet</Text>
            <Text style={styles.emptyText}>
              Create cat profiles on the web app while mobile editing is built.
            </Text>
          </View>
        }
        renderItem={({ item }) => <CatRow cat={item} />}
      />
    </View>
  );
}

function CatRow({ cat }: { cat: MobileCat }) {
  return (
    <View style={styles.catRow}>
      <View style={styles.avatar}>
        {cat.avatarUrl ? (
          <Image
            alt={cat.name}
            source={{ uri: cat.avatarUrl }}
            style={styles.avatarImage}
          />
        ) : (
          <Text style={styles.avatarPlaceholder}>Cat</Text>
        )}
      </View>
      <View style={styles.catBody}>
        <Text style={styles.catName}>{cat.name}</Text>
        <Text style={styles.catMeta}>
          {[cat.breed, cat.sex].filter(Boolean).join(" · ") || "Profile"}
        </Text>
        {cat.description ? (
          <Text numberOfLines={2} style={styles.catDescription}>
            {cat.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerScreen: {
    alignItems: "center",
    backgroundColor: "#fffaf3",
    flex: 1,
    justifyContent: "center",
  },
  screen: {
    backgroundColor: "#fffaf3",
    flex: 1,
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
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0,
    marginTop: 4,
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 15,
    marginTop: 4,
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
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#b45309",
    borderRadius: 8,
    justifyContent: "center",
    marginBottom: 18,
    minHeight: 48,
  },
  buttonPressed: {
    opacity: 0.76,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  listContent: {
    gap: 12,
    paddingBottom: 32,
  },
  catRow: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
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
  catBody: {
    flex: 1,
    gap: 4,
  },
  catName: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "700",
  },
  catMeta: {
    color: "#6b7280",
    fontSize: 14,
  },
  catDescription: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 20,
  },
  emptyPanel: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  emptyTitle: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  error: {
    color: "#b91c1c",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
});
