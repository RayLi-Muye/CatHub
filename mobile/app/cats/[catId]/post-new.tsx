import {
  MOBILE_TIMELINE_CONTENT_MAX,
  MOBILE_TIMELINE_IMAGE_MAX_BYTES,
  MOBILE_TIMELINE_IMAGE_MIME_TYPES,
} from "@cathub/shared";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createTimelinePost,
  type MobileTimelineImageInput,
} from "../../../src/lib/api";

const ALLOWED_MIME = new Set<string>(MOBILE_TIMELINE_IMAGE_MIME_TYPES);

function inferMimeType(asset: ImagePicker.ImagePickerAsset): string {
  if (asset.mimeType) return asset.mimeType;
  const lowered = asset.uri.toLowerCase();
  if (lowered.endsWith(".png")) return "image/png";
  if (lowered.endsWith(".webp")) return "image/webp";
  if (lowered.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

function inferFileName(asset: ImagePicker.ImagePickerAsset, mimeType: string) {
  if (asset.fileName) return asset.fileName;
  const ext = mimeType.split("/")[1] === "jpeg" ? "jpg" : mimeType.split("/")[1];
  return `timeline-${Date.now()}.${ext ?? "jpg"}`;
}

export default function PostNewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ catId?: string }>();
  const catId = params.catId ? String(params.catId) : "";

  const [content, setContent] = useState("");
  const [isHealthAlert, setIsHealthAlert] = useState(false);
  const [image, setImage] = useState<MobileTimelineImageInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePickImage() {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
      exif: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mimeType = inferMimeType(asset);

    if (!ALLOWED_MIME.has(mimeType)) {
      setError("Image must be JPEG, PNG, WEBP, or GIF.");
      return;
    }
    if (asset.fileSize && asset.fileSize > MOBILE_TIMELINE_IMAGE_MAX_BYTES) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setImage({
      uri: asset.uri,
      mimeType,
      fileName: inferFileName(asset, mimeType),
    });
  }

  async function handleSubmit() {
    if (!catId) {
      setError("Missing cat id");
      return;
    }
    const trimmed = content.trim();
    if (!trimmed) {
      setError("Write something before posting.");
      return;
    }
    if (trimmed.length > MOBILE_TIMELINE_CONTENT_MAX) {
      setError(`Post must be ${MOBILE_TIMELINE_CONTENT_MAX} characters or fewer.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createTimelinePost(catId, {
      content: trimmed,
      image,
      isHealthAlert,
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

  const remaining = MOBILE_TIMELINE_CONTENT_MAX - content.length;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>Timeline</Text>
          <Text style={styles.title}>New post</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>What is happening?</Text>
      <TextInput
        editable={!isSubmitting}
        maxLength={MOBILE_TIMELINE_CONTENT_MAX}
        multiline
        onChangeText={setContent}
        placeholder="Share an update about this cat"
        placeholderTextColor="#9ca3af"
        style={[styles.input, styles.textArea]}
        value={content}
      />
      <Text style={styles.counter}>{remaining} chars left</Text>

      <Text style={styles.label}>Image</Text>
      {image ? (
        <View style={styles.imagePreview}>
          <Image
            alt="Selected image"
            resizeMode="cover"
            source={{ uri: image.uri }}
            style={styles.imagePreviewImage}
          />
          <Pressable
            disabled={isSubmitting}
            onPress={() => setImage(null)}
            style={({ pressed }) => [
              styles.tertiaryButton,
              styles.imagePreviewRemove,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.tertiaryButtonText}>Remove image</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          disabled={isSubmitting}
          onPress={handlePickImage}
          style={({ pressed }) => [
            styles.tertiaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.tertiaryButtonText}>Pick from library</Text>
        </Pressable>
      )}

      <View style={styles.toggleRow}>
        <View style={styles.toggleLabelGroup}>
          <Text style={styles.toggleLabel}>Health alert</Text>
          <Text style={styles.toggleHelp}>
            Flag this post as a health concern.
          </Text>
        </View>
        <Switch
          disabled={isSubmitting}
          onValueChange={setIsHealthAlert}
          trackColor={{ true: "#fdba74", false: "#e5e7eb" }}
          value={isHealthAlert}
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
          <Text style={styles.primaryButtonText}>Post</Text>
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
    fontSize: 34,
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
    minHeight: 140,
    textAlignVertical: "top",
  },
  counter: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 6,
    textAlign: "right",
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
  tertiaryButton: {
    alignItems: "center",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
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
  imagePreview: {
    gap: 10,
  },
  imagePreviewImage: {
    backgroundColor: "#ffedd5",
    borderRadius: 8,
    height: 220,
    width: "100%",
  },
  imagePreviewRemove: {
    marginTop: 0,
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
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
  },
});
