import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type MissingExpirationItem = {
  id: string;
  name: string;
  note: string;
};

const missingExpirationItems: MissingExpirationItem[] = [
  {
    id: "m1",
    name: "tuna",
    note: "blah blah blah",
  },
  {
    id: "m2",
    name: "peanut butter",
    note: "needs review",
  },
  {
    id: "m3",
    name: "rice",
    note: "bulk pantry item",
  },
  {
    id: "m4",
    name: "protein bar",
    note: "family pack",
  },
  {
    id: "m5",
    name: "pasta sauce",
    note: "glass jar",
  },
  {
    id: "m6",
    name: "cereal",
    note: "open box",
  },
];

type MissingExpirationCardProps = {
  item: MissingExpirationItem;
};

function MissingExpirationCard({ item }: MissingExpirationCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder} />

      <View style={styles.cardTextSection}>
        <Text numberOfLines={1} style={styles.itemName}>
          {item.name}
        </Text>
        <Text numberOfLines={2} style={styles.itemNote}>
          {item.note}
        </Text>
      </View>

      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="calendar-outline" size={20} color="#222" />
        <Text style={styles.actionText}>add date</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="arrow-forward-circle-outline" size={20} color="#222" />
        <Text style={styles.actionText}>keep without</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ItemsWithoutExpirationScreen() {
  const router = useRouter();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.topRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.push("/(tabs)/pantry")}
              >
                <Ionicons name="chevron-back" size={20} color="#222" />
              </TouchableOpacity>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  (6) Items without expiration date
                </Text>
              </View>
            </View>

            <Text style={styles.description}>
              Pantry Pal will automatically send updates for items that are
              close to their expiration date.
            </Text>

            <View style={styles.divider} />

            <View style={styles.listSection}>
              {missingExpirationItems.map((item) => (
                <View key={item.id} style={styles.cardSpacing}>
                  <MissingExpirationCard item={item} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ececec",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#ececec",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  container: {
    flex: 1,
    backgroundColor: "#ececec",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#d8d8d8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  badge: {
    backgroundColor: "#f5a4a4",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },
  description: {
    fontSize: 12,
    color: "#444",
    lineHeight: 16,
    marginBottom: 10,
    maxWidth: "92%",
  },
  divider: {
    height: 1,
    backgroundColor: "#707070",
    width: "86%",
    alignSelf: "center",
    marginBottom: 14,
  },
  listSection: {
    width: "100%",
  },
  cardSpacing: {
    marginBottom: 10,
  },
  card: {
    minHeight: 52,
    backgroundColor: "#d1d1d1",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  imagePlaceholder: {
    width: 42,
    height: 42,
    backgroundColor: "#ececec",
    marginRight: 6,
  },
  cardTextSection: {
    flex: 1,
    paddingRight: 6,
  },
  itemName: {
    fontSize: 10,
    color: "#f3f3f3",
    textTransform: "lowercase",
    marginBottom: 2,
  },
  itemNote: {
    fontSize: 10,
    color: "#f3f3f3",
    lineHeight: 11,
    textTransform: "lowercase",
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    width: 42,
  },
  actionText: {
    fontSize: 8,
    color: "#111",
    textAlign: "center",
    marginTop: 2,
    lineHeight: 9,
    textTransform: "lowercase",
  },
});
