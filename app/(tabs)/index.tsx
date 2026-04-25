import { Camera, CameraView } from "expo-camera";
import React, { useState, useEffect, useRef } from "react";
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
  TouchableOpacity,
  FlatList,
} from "react-native";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { Feather } from "@expo/vector-icons";

import { GoogleGenerativeAI } from "@google/generative-ai";

import {getUserProfile, deleteStoredItem, addStoredItem, getUserStoredItems} from "../../scripts/firebaseHelpers";




import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";



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

  //00028400157483
  //5449000000996


  const [barcodeNumber, setBarcodeNumber] = useState("");
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


  const [storedItems, setStoredItems] = useState<any>([]);
  const user = auth.currentUser;
  const isProcessing = useRef(false);

 useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (!user) {
      setStoredItems([]);
      return;
    }

    const load = async () => {
      const items = await getUserStoredItems();
      setStoredItems(items);
    };

    load();
  });

  return unsubscribe;
}, []);

const delUpdate = async (barcode: number) => {
  
  setStoredItems(prev =>
    prev.filter(item => item.barcode !== barcode)
  );
  
  try{
  await deleteStoredItem(barcode);
  }catch (error) {
    console.error("Error deleting item:", error);
  }

}













  const handleBarCodeScanned = async ({ type, data }: { type: any; data: any }) => {
    if (isProcessing.current) return; // stops my quota from being maxxed out frm 1 call

    if (!auth.currentUser) {
      console.log("User not logged in, cannot scan.");
      return;
    }
    
    isProcessing.current = true;
    setScanData(true);
    console.log("Type: " + type);
    console.log("Data: " + data);
    setBarcodeNumber(data);
    await AiResponse();
  };

  //pass it to ai, since it'll now have the barcode var saved
  const barcodeAlert = () => {
   
      console.log(barcodeNumber);
      console.log(AiResponse );
      /*
      console.log("FB Raw" ,getUserProfile());
      console.log("FB->ARRAY" ,storedItems);
      storedItems.map((item: ItemType) => console.log("Stored item:", item));*/
  
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
      ingredients?: string[];
    };
    barcodeUrl: string;
  }




  //Returns the entire interface. e.g. use .name to retrieve it.
  //If it doesnt exist, it needs to be able to say that it doesnt exist in the database
  //Will require multiple ai calls then
  const getProductData = async () => {
    //Barcode number
    const product_code: string = barcodeNumber
    const go_upc_api_key: string = process.env.EXPO_PUBLIC_GO_UPC_KEY!
    const api_base_url = "https://go-upc.com/api/v1/code/"

    const url: string = api_base_url + product_code + "?key=" + go_upc_api_key
    
    console.log(url); 
    const response = await fetch(url);

    //checking if information is retrieved, if not error.
    if (!response.ok) {
      throw new Error(`HTTP error for go-upc! status: ${response.status}`);
    }

    //Might be able to cut out the middle man
    const go_upc_data: GoUpcAPIResponse = await response.json();
    return go_upc_data;
  }

  //Google section/gemini ai api section
  const google_api_key = process.env.EXPO_PUBLIC_GEMINI_KEY!;

  //used to initialize the google ai sdk
  const ai = new GoogleGenerativeAI(google_api_key);


  const AiResponse = async() =>{
    const user = auth.currentUser;
    if (!user){
      console.log("Not logged in, cant fetch profile.");
      return;
    }

    try {
      
    //---------------------No more api calls--------------------------------------  
      const productData = await getProductData();

      //Variables to store into the prompt for later usage
      const productName = productData.product.name;
      const productBrand = productData.product.brand;
      const productCategory = productData.product.category;
      const imageUrl = productData.product.imageUrl;
      const ingredients = productData.product.ingredients;

    
    //---------------I RANOUT API QUOTA+ also slow---------------------------------------------
/*
    const prompt = `Based off of ${productName}, ${productBrand}, ${productCategory}, ${imageUrl} and barcode of ${barcodeNumber}, convert it into a JSON object with the following structure. 
    You can elaborate on the recyability stpes if necessary but, be simple. 
    Don't respond with anything except the JSON object:
{
"productName": $productName,
"productBrand": $productBrand,
"image": $imageUrl, //
"ingredients": [],
"allergies": [],
"recylabilitySteps": []
}`
*/
const prompt = `Based off of ${productName}, ${productBrand}, ${productCategory}, ${imageUrl} and barcode of ${barcodeNumber}
, Give me the recyability steps, be simple. Don't respond execpt for the recyability steps in a list format sepreated by commas, i'll be putting it into an array. " "," ", ... " ".

`

      //Will need a way to go through the response to format the text accordingly.
      
      const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const result = await model.generateContent(prompt);
      //Must store this now instead of console.log
      const response: string = result.response.text();


      
     //----------------I RANOUT API QUOTA+ also slow---------------------------------------------
/*
      //Temp Info 
      const productName = "Watermelon";
    const productBrand = "Dole";
    const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Watermelon_cross_BNC.jpg/2560px-WatermelMMMon_cross_BNC.jpg"; 
    
      const response = `abd`;

      const response1 = `{
  "productName": "Peanuts",
  "productBrand": "Some brand",
  "image": "https://go-upc.s3.amazonaws.com/images/243416799.jpeg",
  "ingredients": [
    "Sea Salt",
    "Spices Including Paprika",
    "Sugar",
    "Onion",
    "Dehydrated Garlic",
    "Chartor Hickory (Torula Yeast, Smoke Flavor, Silicon Dioxide)",
    "Mustard",
    "Citric Acid",
    "Charoil Mesquite (Soybean Oil, Mesquite Smoke Flavor)",
    "Habanero Chiles"
  ],
  "allergies": [],
  "recylabilitySteps": []
}`;
      const response2 = `{
  "productName": "CocaCola",
  "productBrand": "Cocola Company",
  "image": "https://go-upc.s3.amazonaws.com/images/357597180.jpeg",
  "ingredients": [
    "Water",
    "Sugar",
    "Carbon Dioxide",
    "Colour E150d",
    "Acid: Phosphoric Acid",
    "Natural Flavourings",
    "Flavour Caffeine"
  ],
  "allergies": [],
  "recylabilitySteps": []
}`;
      const response3 = `{
  "productName": "Pringles",
  "productBrand": "Pringles",
  "image": "https://go-upc.s3.amazonaws.com/images/160913905.jpeg",
  "ingredients": [
    "Dried Potatoes",
    "Vegetable Oil (Corn, Cottonseed, High Oleic Soybean, And/or Sunflower Oil)",
    "Degerminated Yellow Corn Flour",
    "Cornstarch",
    "Rice Flour",
    "Maltodextrin",
    "Sugar",
    "Mono- And Diglycerides",
    "Contains 2% Or Less Of Salt",
    "Tomato Powder",
    "Monosodium Glutamate",
    "Citric Acid",
    "Onion Powder",
    "Spice",
    "Garlic Powder",
    "Yeast Extract",
    "Hydrolyzed Corn Protein",
    "Malted Barley Flour",
    "Malic Acid",
    "Disodium Inosinate",
    "Disodium Guanylate",
    "Paprika Extract Color",
    "Natural Flavors",
    "Whey",
    "Wheat Starch"
  ],
  "allergies": [],
  "recylabilitySteps": []
}`;
      const response4 = `{
  "productName": "Cheetos",
  "productBrand": "Lays",
  "image": "https://go-upc.s3.amazonaws.com/images/81629821.png",
  "ingredients": [
    "Enriched Corn Meal (Corn Meal, Ferrous Sulfate, Niacin, Thiamin Mononitrate, Riboflavin, And Folic Acid)",
    "Vegetable Oil (Corn, Canola And/or Sunflower Oil)",
    "Flamin' Hot Seasoning (Maltodextrin [made From Corn], Salt, Sugar, Artificial Color [red 40 Lake, Yellow 6 Lake, Yellow 6, Yellow 5], Monosodium Glutamate, Yeast Extract, Citric Acid, Sunflower Oil, Cheddar Cheese [milk, Cheese Cultures, Salt, Enzymes], Hydrolyzed Corn Protein, Onion Powder, Whey, Natural Flavor, Garlic Powder, Whey Protein Concentrate, Buttermilk, Corn Syrup Solids, Sodium Diacetate, Disodium Inosinate, Disodium Guanylate, Sodium Caseinate, Skim Milk)"
  ],
  "allergies": [],
  "recylabilitySteps": []
}`;
      
      setAIResponse(response);

      await addStoredItem("181174000390", JSON.parse(response1));
      await addStoredItem("5449000000996", JSON.parse(response2));
      await addStoredItem("00038000183690", JSON.parse(response3));
      await addStoredItem("00028400157483", JSON.parse(response4));
*/
   //   setAIResponse(response); // <- Is this used for anything?
   /*   
      const formattedResponse = `{
      "productName": "${productName}",
"productBrand": "${productBrand}",
"image": "${imageUrl}", 
"ingredients": ${ingredients},
"allergies": [],
"recylabilitySteps": [${(await model.generateContent(prompt)).response.text()} ]
      
      }`*/
      const formattedResponse = `{
      "productName": "${productName}",
"productBrand": "${productBrand}",
"image": "${imageUrl}", 
"ingredients": "[${ingredients?.text.split(',')}]",
"allergies": [],
"recylabilitySteps": [${(await model.generateContent(prompt)).response.text()} ]
      
      }`
      
console.log("FR", formattedResponse)


      await addStoredItem( barcodeNumber,JSON.parse(formattedResponse));
      setStoredItems(await getUserStoredItems())
      // Refresh the stored items list
     




    } catch (error) {
      console.error(error);
      
    } 
  }
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
                    onBarcodeScanned={scanData ? undefined : handleBarCodeScanned}
                        />
                        {scanData && (
                          <Button
                            title="Clck To Scan Again"
                            onPress={() => {setScanData(false); isProcessing.current = false;}
                              
                            }
                            color="#241584"
                          />
                        )}
         
                       <Button title="barcode test" onPress={barcodeAlert} />
                      <Button title={message ? "Loading..." : "Gett Data"} disabled={message} onPress={AiResponse} />

                      </View>
                  
                    </View>

            {/* Bottom Portion */}
{/*
                    <View style={styles.bottomSection}>
                      <Text>Items: </Text>

  {auth.currentUser &&
  storedItems.map((item) => (
    <View key={item.barcode} style={styles.mainTitle}>
      
      <Image
        source={{ uri: item.image }}
        style={{ width: 50, height: 50 }}
      />

      <Text style={styles.itemName}>{item.name}</Text>

      <Text>
        Ingredients: {(item.ingredients || []).slice(0, 3).join(", ")}
      </Text>
      
      <Button
  title="Delete"
  onPress={() => delUpdate(item.barcode)}
/>*/}





              <View style={styles.bottomSection}>
              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {
                auth.currentUser && storedItems?.map((item: ItemType & { barcode: string }) => (

              

                  <View key={item.barcode} style={styles.listRow}>
                    <View style={styles.leftRowContent}>
                      <Image source={{ uri: item.image }} style={styles.itemImage} />
                      <View>



                        <Text style={styles.itemName}>{item.productName}</Text>
                        <Text style={styles.itemBrand}>{item.productBrand}</Text>
                      </View>
                    </View>

                    <View style={styles.rowIcons}>
                      <Pressable 
                        style={styles.rowIconBtn}
                        onPress={() => delUpdate(item.barcode)}
                      >
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

    todoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10, // Adjust spacing as needed
    color: '#333', // Choose a color that fits your app theme
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
