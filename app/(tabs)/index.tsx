import { Camera, CameraView } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { Feather } from "@expo/vector-icons";

import { GoogleGenerativeAI } from "@google/generative-ai";

import {
  addItem,
  deleteItem,
  getUserItems,
} from "../../scripts/firebaseHelpers";

import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

import getTestData from "../testData";

import DateTimePicker from "@react-native-community/datetimepicker";

const { width, height } = Dimensions.get("window");
const MENU_WIDTH = width / 3;

type ItemType = {
  barcode: number;
  productName: string;
  productBrand: string;
  image: string;
  ingredients: string[];
  allergies: string[];
  recyabilitySteps: string[];
};

export default function HomeScreen() {
  const [date, setDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<"date" | "time" | "datetime">("date");
  const [selectedItem, setSelectedItem] = useState<
    (ItemType & { barcode: string }) | null
  >(null);

  const showMode = (modeToShow) => {
    console.log("Pressed");
    setShow(true);
    setMode(modeToShow);
  };

  const moveToInventory = async (
    item: ItemType & { barcode: string },
    expDate: Date,
  ) => {
    setDate(new Date());
    setSelectedItem(null);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid); // adjust path to match your Firestore structure
      console.log(item);

      await updateDoc(userDocRef, {
        [`inventory.${item.barcode}`]: {
          productName: item.productName,
          productBrand: item.productBrand,
          image: item.image,
          ingredients: item.ingredients,
          allergies: item.allergies,
          recyabilitySteps: item.recyabilitySteps || [],
          expDate: expDate,
          dateMoved: new Date(),
        },
      });

      console.log("Moved to inventory:", item.barcode);
    } catch (error) {
      console.error("Error moving to inventory:", error);
    }

    delUpdate(item.barcode);
  };

  const [barcodeNumber, setBarcodeNumber] = useState(""); // should be safe to del, i'll look it over again ltr maybe
  const [menuOpen, setMenuOpen] = useState(false);

  // const [hasPermission, setHasPermission] = useState(null);
  // const [scanned, setScanned] = useState(false);
  // const [text, setText] = useState("Not Yet scanned");
  let [info, setInfo] = useState("");

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanData, setScanData] = useState(false);

  //AI features
  const [aiData, setAIResponse] = useState("");
  const [message, setMessage] = useState(false);
  // const [permission, requestPermission] = useCameraPermissions();

  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");

  const [storedItems, setStoredItems] = useState<any>([]);
  const user = auth.currentUser;
  const isProcessing = useRef(false);

  const [lastApiCall, setLastApiCall] = useState<number>(0);
  const API_RATE_LIMIT_DELAY = 2000; // 2 seconds between API calls

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setStoredItems([]);
        return;
      }

      const load = async () => {
        const items = await getUserItems(`storedItems`);
        setStoredItems(items);
      };

      load();
    });

    return unsubscribe;
  }, []);

  const delUpdate = async (barcode: number) => {
    setStoredItems((prev) => prev.filter((item) => item.barcode !== barcode));

    try {
      await deleteItem(`storedItems`, barcode);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: any;
    data: any;
  }) => {
    console.log("IT RAN");
    if (isProcessing.current) return; // stops my quota from being maxxed out frm 1 call

    if (!auth.currentUser) {
      console.log("User not logged in, cannot scan.");
      return;
    }

    isProcessing.current = true;
    setScanData(true);
    console.log("Type: " + type);
    console.log("Data: " + data);
    console.log("Data type:", typeof data);
    console.log("Data as string:", String(data));
    setBarcodeNumber(data);
    //  console.log("BN:", barcodeNumber);

    await AiResponse(data);
  };

  //pass it to ai, since it'll now have the barcode var saved
  const barcodeAlert = () => {
    console.log(barcodeNumber); //
    console.log(AiResponse);
    getTestData();
    /*
      console.log("FB Raw" ,getUserProfile());
      console.log("FB->ARRAY" ,storedItems);
      storedItems.map((item: ItemType) => console.log("Stored item:", item));
      */

    //functionality of the ai
  };

  useEffect(() => {
    //Request perms for the camera
    (async () => {
      if (Platform.OS === "web") {
        setHasPermission(true);
      } else {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === "granted");
      }
    })();
  }, []);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text> Grant permisision to the app</Text>
      </View>
    );
  }

  //Setup some stuff if you want to pull into the item/call it
  interface GoUpcAPIResponse {
    product: {
      name: string;
      description: string;
      imageUrl: string;
      brand?: string;
      category?: string;
      ingredients?: string[];
    };
    barcodeUrl: string;
  }

  //Returns the entire interface. e.g. use .name to retrieve it.
  //If it doesnt exist, it needs to be able to say that it doesnt exist in the database
  //Will require multiple ai calls then
  const getProductData = async (barcode: string, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000; // 1 second

    // Rate limiting check
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < API_RATE_LIMIT_DELAY) {
      const waitTime = API_RATE_LIMIT_DELAY - timeSinceLastCall;
      console.log(`Rate limiting: waiting ${waitTime}ms before API call`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    setLastApiCall(Date.now());

    //Barcode number

    const go_upc_api_key: string = process.env.EXPO_PUBLIC_GO_UPC_KEY!;
    const api_base_url = "https://go-upc.com/api/v1/code/";

    console.log("Barcode input:", barcode);
    console.log("Barcode type:", typeof barcode);
    console.log("Barcode length:", barcode?.length);

    // Ensure barcode is a string
    const barcodeString = String(barcode).trim();

    const url: string = api_base_url + barcodeString + "?key=" + go_upc_api_key;

    console.log("GOUPC:", url);

    const response = await fetch(url);

    //checking if information is retrieved, if not error.
    if (!response.ok) {
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retryCount); // Exponential backoff
        console.log(
          `Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return getProductData(barcode, retryCount + 1);
      }
      if (response.status === 429) {
        throw new Error(
          `Rate limit exceeded! Too many requests to go-upc API. Please wait a few minutes before trying again.`,
        );
      }
      throw new Error(`HTTP error for go-upc! status: ${response.status}`);
    }

    //Might be able to cut out the middle man
    const go_upc_data: GoUpcAPIResponse = await response.json();
    return go_upc_data;
  };

  //Google section/gemini ai api section
  const google_api_key = process.env.EXPO_PUBLIC_GEMINI_KEY!;

  //used to initialize the google ai sdk
  const ai = new GoogleGenerativeAI(google_api_key);

  const AiResponse = async (barcode: string) => {
    console.log("AiResponse called with barcode:", barcode);
    console.log("Barcode type in AiResponse:", typeof barcode);

    const user = auth.currentUser;
    if (!user) {
      console.log("Not logged in, cant fetch profile.");
      return;
    }

    try {
      //---------------------No more api calls--------------------------------------
      const productData = await getProductData(barcode);

      //Variables to store into the prompt for later usage
      const productName = productData.product.name;
      const productBrand = productData.product.brand;
      const productCategory = productData.product.category;
      const imageUrl = productData.product.imageUrl;
      const ingredients = productData.product.ingredients;

      const prompt = `Based off of ${productName}, ${productBrand}, ${productCategory}, ${imageUrl} and barcode of ${barcodeNumber}
, Give me the recyability steps, be simple. Don't respond execpt for the recyability steps in a list format sepreated by commas, i'll be putting it into an array. " "," ", ... " ".

`;

      //Will need a way to go through the response to format the text accordingly.
      /*
      model cycle
      gemini-3.1-flash-lite-preview
      gemini-3-flash-preview
      */

      const model = ai.getGenerativeModel({
        model: "gemini-3.1-flash-lite-preview",
      });
      const result = await model.generateContent(prompt);
      //Must store this now instead of console.log
      const response: string = result.response.text();

      const formattedResponse = `{
      "productName": "${productName}",
      "productBrand": "${productBrand}",
      "image": "${imageUrl}", 
      "ingredients": ${JSON.stringify(ingredients)},
      "allergies": [],
      "recylabilitySteps": [${(await model.generateContent(prompt)).response.text()} ]
      
      }`;

      console.log("FR", formattedResponse);

      await addItem(
        `storedItems`,
        barcodeNumber,
        JSON.parse(formattedResponse),
      );
      setStoredItems(await getUserItems(`storedItems`));
      // Refresh the stored items list
    } catch (error) {
      console.error(error);
      if (
        error instanceof Error &&
        error.message.includes("Rate limit exceeded")
      ) {
        setRateLimited(true);
        setRateLimitMessage(
          "API rate limit reached. Please wait a few minutes before scanning again.",
        );
        setTimeout(() => {
          setRateLimited(false);
          setRateLimitMessage("");
        }, 60000); // Reset after 1 minute
      }
    }
  };
  /*
  const items: ItemType[] = useMemo(
    () => [
      {
        id: 1,
        name: info,
        image: "https://via.placeholder.com/70",
      },
    ],
    [info], // Add 'info' to dependency array so it updates when info changes
  );*/

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
                  onBarcodeScanned={
                    scanData || rateLimited ? undefined : handleBarCodeScanned
                  }
                />
                {rateLimited && (
                  <View style={styles.rateLimitOverlay}>
                    <Text style={styles.rateLimitText}>{rateLimitMessage}</Text>
                  </View>
                )}
                {scanData && (
                  <Button
                    title="Clck To Scan Again"
                    onPress={() => {
                      setScanData(false);
                      isProcessing.current = false;
                    }}
                    color="#241584"
                  />
                )}

                <Button title="barcode test" onPress={barcodeAlert} />
                <Button
                  title={message ? "Loading..." : "Get Data"}
                  disabled={message}
                  onPress={AiResponse}
                />
                <Button
                  title={message ? "Loading..." : "Get test data"}
                  disabled={message}
                  onPress={getTestData}
                />
              </View>
            </View>

            {/* Bottom Portion */}

            <View style={styles.bottomSection}>
              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {auth.currentUser &&
                  storedItems?.map((item: ItemType & { barcode: string }) => (
                    <View key={item.barcode} style={styles.listRow}>
                      <View style={styles.leftRowContent}>
                        <Image
                          source={{ uri: item.image }}
                          style={styles.itemImage}
                        />
                        <View>
                          <Text style={styles.itemName}>
                            {item.productName}
                          </Text>
                          <Text style={styles.itemBrand}>
                            {item.productBrand}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.rowIcons}>
                        <Pressable
                          style={styles.rowIconBtn}
                          onPress={() => delUpdate(item.barcode)}
                        >
                          <Feather name="trash-2" size={20} color="black" />
                        </Pressable>

                        <Pressable
                          style={styles.rowIconBtn}
                          onPress={() => {
                            showMode("date");
                            setSelectedItem(item);
                          }}
                        >
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

      {/** THIS BLOCK IS FOR THE DATE SELECTOR FOR EXPIRATION DATE + MOVES ITEM FROM STORED->INVENTORY */}
      {show && (
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
          <Text style={{ marginBottom: 10 }}>
            Please select the expiration date:
          </Text>

          <DateTimePicker
            value={date}
            mode={mode}
            is24Hour={true}
            onChange={(event, selectedDate) => {
              console.log("ran1", barcodeNumber);
              if (selectedDate) {
                setDate(selectedDate);
                console.log("ran2");
              }
            }}
          />

          {/* Buttons */}
          <View
            style={{
              marginTop: 20,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Button
              title="Confirm"
              onPress={() => {
                moveToInventory(selectedItem, date);
                setShow(false);
              }}
            />

            <Button
              title="Add later"
              onPress={() => {
                moveToInventory(selectedItem, null);
                setShow(false);
              }}
            />
          </View>
        </SafeAreaView>
      )}
      {/*BLOCK CLOSE */}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  todoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
    width: "100%",
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10, // Adjust spacing as needed
    color: "#333", // Choose a color that fits your app theme
  },

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
  itemBrand: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666",
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

  rateLimitOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
  },
  rateLimitText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    padding: 20,
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
