import type { MobileCatTimelinePost } from "@cathub/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getCatTimeline } from "../../../src/lib/api";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TimelineListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ catId?: string }>();
  const catId = params.catId ? String(params.catId) : "";

  const [posts, setPosts] = useState<MobileCatTimelinePost[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const load = useCallback(async (offset: number, initial = false) => {
    const result = await getCatTimeline(catId, offset);
    if (!result.ok) {
      setError(result.error);
      if (initial) setIsLoading(false);
      return;
    }
    setError(null);
    setPosts((current) =>
      offset === 0 ? result.data.posts : [...current, ...result.data.posts]
    );
    setNextOffset(result.data.nextOffset);
    if (initial) setIsLoading(false);
  }, [catId]);

  useEffect(() => {
    if (!catId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(0, true);
  }, [catId, load]);

  async function handleLoadMore() {
    if (nextOffset === null || isLoadingMore) return;
    setIsLoadingMore(true);
    await load(nextOffset);
    setIsLoadingMore(false);
  }

  if (!catId) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>Missing cat id.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color="#b45309" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>Timeline</Text>
          <Text style={styles.title}>All posts</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {posts.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No posts yet</Text>
        </View>
      ) : (
        posts.map((post) => (
          <View key={post.id} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>
                {post.isHealthAlert ? "⚠️ Health alert" : "Update"}
              </Text>
              <Text style={styles.rowMeta}>{formatDate(post.createdAt)}</Text>
            </View>
            {post.imageUrl ? (
              <Image
                alt="post image"
                resizeMode="cover"
                source={{ uri: post.imageUrl }}
                style={styles.rowImage}
              />
            ) : null}
            {post.content ? (
              <Text style={styles.rowBody}>{post.content}</Text>
            ) : null}
          </View>
        ))
      )}

      {nextOffset !== null ? (
        <Pressable
          disabled={isLoadingMore}
          onPress={handleLoadMore}
          style={({ pressed }) => [
            styles.tertiaryButton,
            (pressed || isLoadingMore) && styles.buttonPressed,
          ]}
        >
          {isLoadingMore ? (
            <ActivityIndicator color="#b45309" />
          ) : (
            <Text style={styles.tertiaryButtonText}>Load more</Text>
          )}
        </Pressable>
      ) : null}
    </ScrollView>
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
  row: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginBottom: 10,
    padding: 14,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowTitle: {
    color: "#1f2937",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    paddingRight: 8,
  },
  rowMeta: {
    color: "#6b7280",
    fontSize: 13,
  },
  rowBody: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  rowImage: {
    backgroundColor: "#ffedd5",
    borderRadius: 8,
    height: 200,
    marginTop: 8,
    width: "100%",
  },
  tertiaryButton: {
    alignItems: "center",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 14,
    minHeight: 48,
  },
  tertiaryButtonText: {
    color: "#b45309",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.76,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    marginBottom: 12,
  },
});
