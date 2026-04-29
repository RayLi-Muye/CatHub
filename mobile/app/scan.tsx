import { identityCodeSchema } from "@cathub/shared";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const CATHUB_DEEP_LINK_PREFIX = "cathub://";

function extractIdentityCode(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.toLowerCase().startsWith(CATHUB_DEEP_LINK_PREFIX)) {
    const queryIndex = trimmed.indexOf("?");
    if (queryIndex === -1) return null;
    const params = new URLSearchParams(trimmed.slice(queryIndex + 1));
    const code = params.get("code");
    return code ? code.trim() : null;
  }

  return trimmed;
}

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const lockRef = useRef(false);

  function handleBarcode({ data }: { data: string }) {
    if (lockRef.current) return;
    const candidate = extractIdentityCode(data);
    if (!candidate) {
      setError("This QR code is not a CatHub identity code.");
      return;
    }

    const result = identityCodeSchema.safeParse(candidate);
    if (!result.success) {
      setError(
        result.error.issues[0]?.message ?? "Scanned code is not a valid identity code."
      );
      return;
    }

    lockRef.current = true;
    router.replace({
      pathname: "/connect",
      params: { code: result.data },
    });
  }

  if (!permission) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color="#b45309" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>Scan</Text>
            <Text style={styles.title}>Camera access</Text>
          </View>
          <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        </View>

        <Text style={styles.body}>
          CatHub needs camera access to scan an identity-code QR.
          {permission.canAskAgain
            ? " Tap below to grant permission."
            : " Enable camera access for CatHub in Settings."}
        </Text>

        {permission.canAskAgain ? (
          <Pressable
            onPress={requestPermission}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Grant camera access</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.replace("/connect")}
          style={({ pressed }) => [
            styles.tertiaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.tertiaryButtonText}>Enter code manually</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.cameraScreen}>
      <CameraView
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcode}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.frame} pointerEvents="none">
        <View style={styles.frameInner} />
      </View>

      <View style={styles.overlayTop}>
        <Text style={styles.overlayEyebrow}>Scan</Text>
        <Text style={styles.overlayTitle}>Identity code QR</Text>
        <Text style={styles.overlayHint}>
          Align the QR inside the frame.
        </Text>
      </View>

      <View style={styles.overlayBottom}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          onPress={() => router.replace("/connect")}
          style={({ pressed }) => [
            styles.overlayButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.overlayButtonText}>Enter code manually</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.overlayCancel,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.overlayCancelText}>Cancel</Text>
        </Pressable>
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
  body: {
    color: "#374151",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#b45309",
    borderRadius: 8,
    justifyContent: "center",
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
  tertiaryButton: {
    alignItems: "center",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 50,
  },
  tertiaryButtonText: {
    color: "#b45309",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.76,
  },
  cameraScreen: {
    backgroundColor: "#000000",
    flex: 1,
  },
  frame: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  frameInner: {
    borderColor: "#ffedd5",
    borderRadius: 16,
    borderWidth: 3,
    height: 260,
    width: 260,
  },
  overlayTop: {
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 64,
  },
  overlayEyebrow: {
    color: "#fed7aa",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  overlayTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },
  overlayHint: {
    color: "#f9fafb",
    fontSize: 14,
    marginTop: 6,
  },
  overlayBottom: {
    backgroundColor: "rgba(0,0,0,0.55)",
    bottom: 0,
    left: 0,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 18,
    position: "absolute",
    right: 0,
  },
  overlayButton: {
    alignItems: "center",
    backgroundColor: "#b45309",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
  },
  overlayButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  overlayCancel: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 44,
  },
  overlayCancelText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  errorText: {
    color: "#fecaca",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
});
