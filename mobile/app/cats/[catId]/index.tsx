import type {
  MobileCatCheckin,
  MobileCatDetailPayload,
  MobileCatHealthRecord,
  MobileCatTimelinePost,
  MobileCatWeightLog,
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
  View,
} from "react-native";
import { getCatDetail } from "../../../src/lib/api";

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ageInYears(birthdate: string | null) {
  if (!birthdate) return null;
  const start = new Date(birthdate).getTime();
  if (Number.isNaN(start)) return null;
  const years = (Date.now() - start) / (365.25 * 24 * 60 * 60 * 1000);
  if (years < 1) {
    const months = Math.max(0, Math.round(years * 12));
    return `${months} mo`;
  }
  return `${years.toFixed(1)} yr`;
}

export default function CatDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ catId?: string }>();
  const catId = params.catId ? String(params.catId) : "";

  const [data, setData] = useState<MobileCatDetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(catId));

  useEffect(() => {
    if (!catId) return;

    let isMounted = true;

    getCatDetail(catId).then((result) => {
      if (!isMounted) return;
      if (!result.ok) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      setData(result.data);
      setError(null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [catId]);

  if (!catId) {
    return (
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>Cat</Text>
            <Text style={styles.title}>Missing cat id</Text>
          </View>
          <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        </View>
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

  if (error || !data) {
    return (
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>Cat</Text>
            <Text style={styles.title}>Not found</Text>
          </View>
          <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        </View>
        <Text style={styles.errorText}>{error ?? "No data"}</Text>
      </View>
    );
  }

  const { cat, recentTimeline, recentHealth, recentWeights, latestCheckin } =
    data;
  const age = ageInYears(cat.birthdate);
  const meta = [cat.breed, cat.sex, age].filter(Boolean).join(" · ");

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.topBarText}>
          <Text style={styles.eyebrow}>Cat</Text>
          <Text style={styles.title}>{cat.name}</Text>
          {meta ? <Text style={styles.subtitle}>{meta}</Text> : null}
        </View>
        <View style={styles.topBarActions}>
          {cat.isOwner ? (
            <Pressable
              onPress={() => router.push(`/cats/${cat.id}/edit`)}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Edit</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroAvatar}>
          {cat.avatarUrl ? (
            <Image
              alt={cat.name}
              source={{ uri: cat.avatarUrl }}
              style={styles.heroAvatarImage}
            />
          ) : (
            <Text style={styles.heroAvatarPlaceholder}>Cat</Text>
          )}
        </View>
        <View style={styles.heroBody}>
          <Text style={styles.heroOwner}>
            Owner: {cat.owner.displayName ?? cat.owner.username}
            {cat.isOwner ? " (you)" : ""}
          </Text>
          {cat.colorMarkings ? (
            <Text style={styles.heroFact}>{cat.colorMarkings}</Text>
          ) : null}
          <Text style={styles.heroFact}>
            {cat.isNeutered ? "Neutered" : "Not neutered"} ·{" "}
            {cat.isPublic ? "Public" : "Private"}
          </Text>
          {cat.description ? (
            <Text style={styles.heroDescription}>{cat.description}</Text>
          ) : null}
        </View>
      </View>

      {cat.isOwner ? (
        <Section
          title="Latest check-in"
          empty={latestCheckin ? null : "No check-in yet."}
          action={
            <Pressable
              onPress={() => router.push(`/cats/${cat.id}/checkin-new`)}
              style={({ pressed }) => [
                styles.sectionAction,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.sectionActionText}>New check-in</Text>
            </Pressable>
          }
        >
          {latestCheckin ? <CheckinRow checkin={latestCheckin} /> : null}
        </Section>
      ) : null}

      <Section
        title="Weight"
        empty={recentWeights.length === 0 ? "No weight logs yet." : null}
        action={
          cat.isOwner ? (
            <Pressable
              onPress={() => router.push(`/cats/${cat.id}/weight-new`)}
              style={({ pressed }) => [
                styles.sectionAction,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.sectionActionText}>Log weight</Text>
            </Pressable>
          ) : null
        }
      >
        {recentWeights.slice(0, 5).map((log) => (
          <WeightRow key={log.id} log={log} />
        ))}
      </Section>

      <Section
        title="Health"
        empty={recentHealth.length === 0 ? "No health records yet." : null}
        action={
          cat.isOwner ? (
            <Pressable
              onPress={() => router.push(`/cats/${cat.id}/health-new`)}
              style={({ pressed }) => [
                styles.sectionAction,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.sectionActionText}>New record</Text>
            </Pressable>
          ) : null
        }
      >
        {recentHealth.map((record) => (
          <HealthRow key={record.id} record={record} />
        ))}
      </Section>

      <Section
        title="Timeline"
        empty={recentTimeline.length === 0 ? "No posts yet." : null}
        action={
          cat.isOwner ? (
            <Pressable
              onPress={() => router.push(`/cats/${cat.id}/post-new`)}
              style={({ pressed }) => [
                styles.sectionAction,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.sectionActionText}>New post</Text>
            </Pressable>
          ) : null
        }
      >
        {recentTimeline.map((post) => (
          <TimelineRow key={post.id} post={post} />
        ))}
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  empty,
  action,
  children,
}: {
  title: string;
  empty?: string | null;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action ?? null}
      </View>
      {empty ? <Text style={styles.sectionEmpty}>{empty}</Text> : children}
    </View>
  );
}

function CheckinRow({ checkin }: { checkin: MobileCatCheckin }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowTitle}>
          {checkin.moodEmoji ?? "🐾"} Mood · Appetite {checkin.appetiteScore}/5
          · Energy {checkin.energyScore}/5
        </Text>
        <Text style={styles.rowMeta}>{formatDate(checkin.date)}</Text>
      </View>
      <Text style={styles.rowSub}>Bowel: {checkin.bowelStatus}</Text>
      {checkin.notes ? (
        <Text style={styles.rowBody}>{checkin.notes}</Text>
      ) : null}
    </View>
  );
}

function WeightRow({ log }: { log: MobileCatWeightLog }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowTitle}>{log.weightKg} kg</Text>
        <Text style={styles.rowMeta}>{formatDate(log.recordedAt)}</Text>
      </View>
      {log.notes ? <Text style={styles.rowBody}>{log.notes}</Text> : null}
    </View>
  );
}

function HealthRow({ record }: { record: MobileCatHealthRecord }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowTitle}>
          {record.title}
          <Text style={styles.rowTag}> · {record.type}</Text>
        </Text>
        <Text style={styles.rowMeta}>{formatDate(record.date)}</Text>
      </View>
      {record.vetName ? (
        <Text style={styles.rowSub}>Vet: {record.vetName}</Text>
      ) : null}
      {record.description ? (
        <Text style={styles.rowBody}>{record.description}</Text>
      ) : null}
    </View>
  );
}

function TimelineRow({ post }: { post: MobileCatTimelinePost }) {
  return (
    <View style={styles.row}>
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
      {post.content ? <Text style={styles.rowBody}>{post.content}</Text> : null}
      {post.videoUrl && !post.imageUrl ? (
        <Text style={styles.rowSub}>Video attached</Text>
      ) : null}
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
  topBarText: {
    flex: 1,
    paddingRight: 12,
  },
  topBarActions: {
    flexDirection: "row",
    gap: 8,
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
  heroCard: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 14,
  },
  heroAvatar: {
    alignItems: "center",
    backgroundColor: "#ffedd5",
    borderRadius: 12,
    height: 96,
    justifyContent: "center",
    overflow: "hidden",
    width: 96,
  },
  heroAvatarImage: {
    height: "100%",
    width: "100%",
  },
  heroAvatarPlaceholder: {
    color: "#b45309",
    fontSize: 14,
    fontWeight: "700",
  },
  heroBody: {
    flex: 1,
    gap: 4,
  },
  heroOwner: {
    color: "#1f2937",
    fontSize: 15,
    fontWeight: "700",
  },
  heroFact: {
    color: "#6b7280",
    fontSize: 14,
  },
  heroDescription: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  section: {
    marginTop: 22,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "800",
  },
  sectionAction: {
    backgroundColor: "#b45309",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sectionActionText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.76,
  },
  sectionEmpty: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    color: "#6b7280",
    fontSize: 14,
    padding: 14,
  },
  row: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginBottom: 8,
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
  rowTag: {
    color: "#b45309",
    fontSize: 13,
    fontWeight: "700",
  },
  rowMeta: {
    color: "#6b7280",
    fontSize: 13,
  },
  rowSub: {
    color: "#4b5563",
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
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    marginTop: 12,
  },
});
