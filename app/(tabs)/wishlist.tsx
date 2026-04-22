import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type WishlistItem = {
  id: string;
  name: string;
};

const wishlistItems: WishlistItem[] = [
  { id: "w1", name: "tuna" },
  { id: "w2", name: "milk" },
  { id: "w3", name: "bananas" },
  { id: "w4", name: "bread" },
  { id: "w5", name: "eggs" },
  { id: "w6", name: "yogurt" },
  { id: "w7", name: "spinach" },
  { id: "w8", name: "rice" },
  { id: "w9", name: "cheese" },
  { id: "w10", name: "apples" },
];

const WishlistCard = ({ item }: { item: WishlistItem }) => {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemImagePlaceholder} />

      <Text numberOfLines={1} style={styles.itemName}>
        {item.name}
      </Text>

      <TouchableOpacity style={styles.trashButton}>
        <Ionicons name="trash-outline" size={22} color="#111" />
      </TouchableOpacity>
    </View>
  );
};

export default function WishlistScreen() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-outline" size={24} color="#111" />
          </TouchableOpacity>
          <View style={styles.container}>
            <View style={styles.headerRow}>
              <View style={styles.banner}>
                <Text style={styles.bannerTitle}>Wishlist</Text>
                <View style={styles.bannerImageCluster}>
                  <View style={styles.circleBack} />
                  <View style={styles.circleFront} />
                  <View style={styles.leafOne} />
                  <View style={styles.leafTwo} />
                  <View style={styles.fruitRed} />
                  <View style={styles.fruitOrange} />
                  <View style={styles.fruitYellow} />
                  <View style={styles.fruitGreen} />
                </View>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.itemCount}>10 items</Text>
              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add-circle-outline" size={18} color="#111" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.listSection}>
              {wishlistItems.map((item) => (
                <View key={item.id} style={styles.cardSpacing}>
                  <WishlistCard item={item} />
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
    backgroundColor: "#ebebeb",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#ebebeb",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  container: {
    flex: 1,
    backgroundColor: "#ebebeb",
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  banner: {
    flex: 1,
    height: 78,
    backgroundColor: "#10f440",
    borderRadius: 6,
    paddingLeft: 12,
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 8,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  bannerImageCluster: {
    position: "absolute",
    right: 6,
    top: 4,
    width: 84,
    height: 68,
  },
  circleBack: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f2c94c",
    top: 10,
    left: 10,
  },
  circleFront: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#6fbf4b",
    top: 2,
    left: 22,
  },
  leafOne: {
    position: "absolute",
    width: 24,
    height: 14,
    borderRadius: 14,
    backgroundColor: "#7cb342",
    top: 6,
    right: 18,
    transform: [{ rotate: "-25deg" }],
  },
  leafTwo: {
    position: "absolute",
    width: 22,
    height: 12,
    borderRadius: 12,
    backgroundColor: "#5f9f3a",
    top: 14,
    right: 2,
    transform: [{ rotate: "20deg" }],
  },
  fruitRed: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef5350",
    bottom: 10,
    right: 34,
  },
  fruitOrange: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fb8c00",
    bottom: 12,
    right: 18,
  },
  fruitYellow: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#ffd54f",
    bottom: 8,
    right: 4,
  },
  fruitGreen: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#8bc34a",
    bottom: 2,
    right: 24,
  },
  profileButton: {
    paddingTop: 2,
    paddingHorizontal: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  itemCount: {
    fontSize: 16,
    color: "#111",
    fontWeight: "400",
  },
  addButton: {
    padding: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#9b9b9b",
    marginBottom: 10,
  },
  listSection: {
    width: "100%",
  },
  cardSpacing: {
    marginBottom: 10,
  },
  itemCard: {
    height: 46,
    backgroundColor: "#d0d0d0",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  itemImagePlaceholder: {
    width: 36,
    height: 36,
    backgroundColor: "#ececec",
    marginRight: 10,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: "#f6f6f6",
    textTransform: "lowercase",
  },
  trashButton: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
});
