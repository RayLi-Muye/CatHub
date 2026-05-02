import type {
  MobileLineageInboxPayload,
  MobileLineageRequestSummary,
  MobileLineageRespondAction,
} from "@cathub/shared";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getLineageInbox, respondLineageRequest } from "../src/lib/api";

type Tab = "incoming" | "outgoing";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function InboxScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("incoming");
  const [data, setData] = useState<MobileLineageInboxPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const refresh = useCallback(async (initial = false) => {
    const result = await getLineageInbox();
    if (!result.ok) {
      setError(result.error);
    } else {
      setData(result.data);
      setError(null);
    }
    if (initial) setIsLoading(false);
  }, []);

  useEffect(() => {
    // One-shot mount fetch; setState inside refresh runs asynchronously after
    // the network call resolves, not during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh(true);
  }, [refresh]);

  async function handleRespond(
    requestId: string,
    action: MobileLineageRespondAction
  ) {
    setPendingId(requestId);
    setError(null);
    setActionMessage(null);

    const result = await respondLineageRequest(requestId, { action });

    setPendingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setActionMessage(result.data.message);
    await refresh();
  }

  if (isLoading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color="#b45309" />
      </View>
    );
  }

  const list: MobileLineageRequestSummary[] =
    tab === "incoming" ? data?.incoming ?? [] : data?.outgoing ?? [];

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>Lineage</Text>
          <Text style={styles.title}>Inbox</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <TabButton
          active={tab === "incoming"}
          count={data?.incoming.length ?? 0}
          label="Incoming"
          onPress={() => setTab("incoming")}
        />
        <TabButton
          active={tab === "outgoing"}
          count={data?.outgoing.length ?? 0}
          label="Outgoing"
          onPress={() => setTab("outgoing")}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {actionMessage ? (
        <Text style={styles.successText}>{actionMessage}</Text>
      ) : null}

      {list.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>
            No {tab} requests
          </Text>
          <Text style={styles.emptyText}>
            {tab === "incoming"
              ? "No one has asked to link a parent of your cats."
              : "You have not sent any pending lineage requests."}
          </Text>
        </View>
      ) : (
        list.map((item) => (
          <RequestCard
            disabled={pendingId !== null && pendingId !== item.id}
            isSubmitting={pendingId === item.id}
            item={item}
            key={item.id}
            onRespond={(action) => handleRespond(item.id, action)}
            tab={tab}
          />
        ))
      )}
    </ScrollView>
  );
}

function TabButton({
  active,
  count,
  label,
  onPress,
}: {
  active: boolean;
  count: number;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label} · {count}
      </Text>
    </Pressable>
  );
}

function RequestCard({
  item,
  tab,
  onRespond,
  isSubmitting,
  disabled,
}: {
  item: MobileLineageRequestSummary;
  tab: Tab;
  onRespond: (action: MobileLineageRespondAction) => void;
  isSubmitting: boolean;
  disabled: boolean;
}) {
  const counterparty =
    tab === "incoming"
      ? item.requester.displayName ?? item.requester.username
      : item.responder.displayName ?? item.responder.username;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.parent.name} → {item.child.name}
        </Text>
        <Text style={styles.cardMeta}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.cardSub}>
        Role: <Text style={styles.cardRole}>{item.parentRole}</Text>
      </Text>
      <Text style={styles.cardSub}>
        {tab === "incoming" ? "Requester" : "Recipient"}: {counterparty}
      </Text>
      {item.requestNote ? (
        <Text style={styles.cardBody}>“{item.requestNote}”</Text>
      ) : null}

      {tab === "incoming" ? (
        <View style={styles.cardActions}>
          <Pressable
            disabled={disabled || isSubmitting}
            onPress={() => onRespond("accept")}
            style={({ pressed }) => [
              styles.primaryButton,
              styles.actionFlex,
              (pressed || isSubmitting) && styles.buttonPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Accept</Text>
            )}
          </Pressable>
          <Pressable
            disabled={disabled || isSubmitting}
            onPress={() => onRespond("decline")}
            style={({ pressed }) => [
              styles.tertiaryButton,
              styles.actionFlex,
              (pressed || isSubmitting) && styles.buttonPressed,
            ]}
          >
            <Text style={styles.tertiaryButtonText}>Decline</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          disabled={disabled || isSubmitting}
          onPress={() => onRespond("cancel")}
          style={({ pressed }) => [
            styles.tertiaryButton,
            (pressed || isSubmitting) && styles.buttonPressed,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#b45309" />
          ) : (
            <Text style={styles.tertiaryButtonText}>Cancel request</Text>
          )}
        </Pressable>
      )}
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
  tabs: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 18,
    overflow: "hidden",
  },
  tab: {
    alignItems: "center",
    flex: 1,
    minHeight: 46,
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#b45309",
  },
  tabText: {
    color: "#b45309",
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#ffffff",
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
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginBottom: 12,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: "#1f2937",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    paddingRight: 8,
  },
  cardMeta: {
    color: "#6b7280",
    fontSize: 13,
  },
  cardSub: {
    color: "#4b5563",
    fontSize: 13,
  },
  cardRole: {
    color: "#b45309",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  cardBody: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionFlex: {
    flex: 1,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#b45309",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 46,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  tertiaryButton: {
    alignItems: "center",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 46,
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
  successText: {
    color: "#047857",
    fontSize: 14,
    marginBottom: 12,
  },
});
