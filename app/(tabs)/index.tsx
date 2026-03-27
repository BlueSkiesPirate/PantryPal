import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import handleScraping from "./../../response";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { Feather } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const MENU_WIDTH = width / 3;

type ItemType = {
  id: number;
  name: string;
  image: string;
};

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);

  // const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [text, setText] = useState("Not Yet scanned");
  let [info, setInfo] = useState("");

  const [permission, requestPermission] = useCameraPermissions();

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);
    setText(data);
    console.log("Type: " + type + "\nData: " + data);
    // Don't call setInfo here anymore
  };

  // Add this effect to handle the async scraping
  useEffect(() => {
    if (scanned && text !== "Not Yet scanned") {
      const scrapeData = async () => {
        const result = await handleScraping(text);
        setInfo(result || ""); // Provide a default empty string if undefined
      };
      scrapeData();
    }
  }, [scanned, text]);

  const items: ItemType[] = useMemo(
    () => [
      {
        id: 1,
        name: info,
        image: "https://via.placeholder.com/70",
      },
    ],
    [info], // Add 'info' to dependency array so it updates when info changes
  );

  // Check permissions AFTER all hooks are called
  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View>
        <Text>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Overlay */}
          {menuOpen && (
            <Pressable
              style={styles.overlay}
              onPress={() => setMenuOpen(false)}
            />
          )}

          {/* Side Menu */}
          <View
            style={[
              styles.sideMenu,
              {
                width: MENU_WIDTH,
                left: menuOpen ? 0 : -MENU_WIDTH,
              },
            ]}
          >
            <Text style={styles.menuTitle}>Menu</Text>
            <Pressable style={styles.menuItem}>
              <Text style={styles.menuItemText}>Profile</Text>
            </Pressable>
            <Pressable style={styles.menuItem}>
              <Text style={styles.menuItemText}>Settings</Text>
            </Pressable>
            <Pressable style={styles.menuItem}>
              <Text style={styles.menuItemText}>Saved Items</Text>
            </Pressable>
          </View>

          {/* Top Navbar */}
          <View style={styles.topNavbar}>
            <Pressable
              onPress={() => setMenuOpen(!menuOpen)}
              style={styles.iconBtn}
            >
              <Feather name="user" size={24} color="black" />
            </Pressable>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
            />
            <View style={styles.rightSpacer} />
          </View>

          {/* Main Section */}
          <View style={styles.mainSection}>
            {/* Top Portion */}
            <View style={styles.topSection}>
              <View style={styles.card}>
                <CameraView
                  style={styles.camera}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />
                {scanned && (
                  <Button
                    title={"Scan Again"}
                    onPress={() => setScanned(false)}
                    color="blue"
                  />
                )}
              </View>
              <View style={styles.buttonRow}>
                <Pressable style={styles.primaryButton}>
                  <Text style={styles.buttonText}>Camera</Text>
                </Pressable>

                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.buttonText}>Try Again</Text>
                </Pressable>
              </View>
            </View>

            {/* Bottom Portion */}
            <View style={styles.bottomSection}>
              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {items.map((item) => (
                  <View key={item.id} style={styles.listRow}>
                    <View style={styles.leftRowContent}>
                      <Image
                        source={{ uri: item.image }}
                        style={styles.itemImage}
                      />
                      <Text style={styles.itemName}>{item.name}</Text>
                    </View>

                    <View style={styles.rowIcons}>
                      <Pressable style={styles.rowIconBtn}>
                        <Feather name="trash-2" size={20} color="black" />
                      </Pressable>

                      <Pressable style={styles.rowIconBtn}>
                        <Feather name="zap" size={20} color="black" />
                      </Pressable>

                      <Pressable style={styles.rowIconBtn}>
                        <Feather name="arrow-right" size={20} color="black" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
    position: "relative",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
    zIndex: 5,
  },

  sideMenu: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "#f7f7f7",
    zIndex: 10,
    paddingTop: 30,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  menuTitle: {
    // fontSize: 22,
    // fontWeight: "700",
    marginBottom: 20,
  },
  menuItem: {
    paddingVertical: 14,
  },
  menuItemText: {
    fontSize: 16,
    color: "#222",
  },

  topNavbar: {
    height: 60,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
    backgroundColor: "white",
  },

  camera: {
    flex: 1,
  },
  iconBtn: {
    width: 40,
    alignItems: "flex-start",
  },
  logo: {
    height: 40,
    width: 120,
  },
  rightSpacer: {
    width: 40,
  },

  mainSection: {
    flex: 1,
  },

  topSection: {
    flex: 4,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
    marginBottom: 20,
  },
  card: {
    width: 225,
    height: 250,
    borderRadius: 22,
    backgroundColor: "#b9ffcb",
    borderWidth: 2,
    borderColor: "#45ff54",
    marginBottom: 18,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 14,
  },
  primaryButton: {
    backgroundColor: "#111",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: "#444",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },

  bottomSection: {
    flex: 5,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 10,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 18,
    gap: 12,
  },

  listRow: {
    height: 100,
    width: "100%",
    backgroundColor: "#fafafa",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftRowContent: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  itemImage: {
    width: 62,
    height: 62,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#ddd",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    flexShrink: 1,
  },
  rowIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowIconBtn: {
    padding: 6,
  },

  bottomNavbar: {
    height: 70,
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "white",
  },
  bottomNavItem: {
    padding: 8,
  },
});
