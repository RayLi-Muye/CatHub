import type { MobileCatWeightLog } from "@cathub/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getCatWeights } from "../../../src/lib/api";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function WeightsListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ catId?: string }>();
  const catId = params.catId ? String(params.catId) : "";

  const [weights, setWeights] = useState<MobileCatWeightLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const result = await getCatWeights(catId);
    if (!result.ok) {
      setError(result.error);
    } else {
      setError(null);
      setWeights(result.data.weights);
    }
    setIsLoading(false);
  }, [catId]);

  useEffect(() => {
    if (!catId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [catId, load]);

  const stats = useMemo(() => {
    if (weights.length === 0) return null;
    const numeric = weights
      .map((row) => Number.parseFloat(row.weightKg))
      .filter((value) => !Number.isNaN(value));
    if (numeric.length === 0) return null;
    const min = Math.min(...numeric);
    const max = Math.max(...numeric);
    const latest = numeric[0];
    const oldest = numeric[numeric.length - 1];
    return { min, max, latest, oldest, range: max - min || 1 };
  }, [weights]);

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
          <Text style={styles.eyebrow}>Weight</Text>
          <Text style={styles.title}>History</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {stats ? (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Latest</Text>
            <Text style={styles.summaryValue}>{stats.latest.toFixed(2)} kg</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Min</Text>
            <Text style={styles.summaryValue}>{stats.min.toFixed(2)} kg</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Max</Text>
            <Text style={styles.summaryValue}>{stats.max.toFixed(2)} kg</Text>
          </View>
        </View>
      ) : null}

      {weights.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No weight logs yet</Text>
        </View>
      ) : (
        weights.map((row) => {
          const value = Number.parseFloat(row.weightKg);
          const ratio =
            stats && !Number.isNaN(value)
              ? Math.max(0.1, (value - stats.min + 0.5) / (stats.range + 0.5))
              : 0.5;
          return (
            <View key={row.id} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowTitle}>{row.weightKg} kg</Text>
                <Text style={styles.rowMeta}>{formatDate(row.recordedAt)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.round(ratio * 100)}%` },
                  ]}
                />
              </View>
              {row.notes ? (
                <Text style={styles.rowBody}>{row.notes}</Text>
              ) : null}
            </View>
          );
        })
      )}
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
  summaryCard: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    padding: 14,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
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
    gap: 6,
    marginBottom: 10,
    padding: 14,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowTitle: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "700",
  },
  rowMeta: {
    color: "#6b7280",
    fontSize: 13,
  },
  rowBody: {
    color: "#374151",
    fontSize: 13,
    lineHeight: 18,
  },
  barTrack: {
    backgroundColor: "#ffedd5",
    borderRadius: 6,
    height: 8,
    overflow: "hidden",
    width: "100%",
  },
  barFill: {
    backgroundColor: "#b45309",
    height: "100%",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    marginBottom: 12,
  },
});
