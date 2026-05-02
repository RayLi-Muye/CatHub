import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { getMe } from "../src/lib/api";

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    getMe().then((result) => {
      if (!isMounted) return;
      router.replace(result.ok ? "/dashboard" : "/login");
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <View style={styles.screen}>
      <ActivityIndicator color="#b45309" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: "#fffaf3",
    flex: 1,
    justifyContent: "center",
  },
});
