import { Camera, CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dimensions,
  Image,
  Platform,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import handleScraping from "./../../response";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { Feather } from "@expo/vector-icons";

import { GoogleGenerativeAI } from "@google/generative-ai";


const { width, height } = Dimensions.get("window");
const MENU_WIDTH = width / 3;

type ItemType = {
  id: number;
  name: string;
  image: string;
};

let barcodeNumber = "brochacho";

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);

  // const [hasPermission, setHasPermission] = useState(null);
  // const [scanned, setScanned] = useState(false);
  // const [text, setText] = useState("Not Yet scanned");
  let [info, setInfo] = useState("");

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanData, setScanData] = useState(false);
  const [aiData, setAIResponse] = useState(String);

  // const [permission, requestPermission] = useCameraPermissions();

  const handleBarCodeScanned = ({ type, data }: { type: any; data: any }) => {
    setScanData(true);

    console.log("Type: " + type);
    console.log("Data: " + data);

    //logic here to process the barcode number into the ai api
    barcodeNumber = data;
  };

  //pass it to ai, since it'll now have the barcode var saved
  const barcodeAlert = () => {
    alert("Accessed barcode data: " + barcodeNumber);
    //functionality of the ai
  };

  useEffect(() =>{
    //Request perms for the camera
    (async() => {
      if (Platform.OS ==="web") {
        setHasPermission(true);
      } else {
        const {status} = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      }
    })();
  }, [] );

  
  if (!hasPermission) {
    return (
      <View style = {styles.container}>
        <Text> Grant permisision to the app</Text>
      </View>
    )
  }

  //Setup some stuff if you want to pull into the item/call it
  interface GoUpcAPIResponse {
    product: {
      name: string;
      description: string;
      imageUrl: string;
      brand?: string;
      category?: string;
    };
    barcodeUrl: string;
  }

  //Barcode number
  const product_code: string = barcodeNumber;
  const go_upc_api_key: string = process.env.EXPO_PUBLIC_GO_UPC_KEY!;
  const api_base_url = "https://go-upc.com/api/v1/code/";

  const url: string = api_base_url + product_code + "?key=" + go_upc_api_key;

  //Returns the entire interface. e.g. use .name to retrieve it.
  //If it doesnt exist, it needs to be able to say that it doesnt exist in the database
  //Will require multiple ai calls then
  async function getProductData(): Promise<GoUpcAPIResponse> {
    const response = await fetch(url);

    //checking if information is retrieved, if not error.
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const go_upc_data: GoUpcAPIResponse = await response.json();
    return go_upc_data;
  }

  //Google section/gemini ai api section
  const google_api_key = process.env.EXPO_PUBLIC_GEMINI_KEY!;

  //used to initialize the google ai sdk
  const ai = new GoogleGenerativeAI(google_api_key);


  // const [loading, setLoading] = useState(true);
  let responseStorage = "testinging";

  async function AiResponse() {
    try {
      const productData = await getProductData();

      //Variables to store into the prompt for later usage
      const productName = productData.product.name;
      const productBrand = productData.product.brand;
      const productCategory = productData.product.category;

      const prompt = `Based off of ${productName}, ${productBrand}, ${productCategory} and barcode of ${barcodeNumber}, 
      list the in the following categories line on a single line and create a new line for each category for: product name, nutrient label information, ingredients, allergies, and recyclability steps. 
      Be simple, do not include any unnecessary details.
      `;

      //Will need a way to go through the response to format the text accordingly.
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      //Must store this now instead of console.log
      let responseStorage: string = result.response.text();
      setAIResponse(responseStorage);
     
    } catch (error) {
      console.error(error);
    }
  }

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
                          style={StyleSheet.absoluteFillObject}
                          barcodeScannerSettings={{
                            barcodeTypes: [
                              "ean13",
                              "qr",
                              "ean8",
                              "aztec",
                              "upc_a",
                              "upc_e",
                              "codabar",
                              "code39",
                              "datamatrix",
                              "itf14",
                              "pdf417",
                            ],
                          }}
                          onBarcodeScanned={scanData ? undefined : handleBarCodeScanned}
                        />
                        {scanData && (
                          <Button
                            title="Clck To Scan Again"
                            onPress={() => setScanData(false)}
                            color="#241584"
                          />
                        )}
                        <Button title="ai summary" onPress={AiResponse} />
                        <Button title="barcode test" onPress={barcodeAlert} />
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
