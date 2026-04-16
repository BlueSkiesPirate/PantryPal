import React from "react";
import { Button, Platform, StyleSheet, Text, View } from "react-native";

//navigation from file
import { useRouter } from "expo-router";

//camera functionality
import { Camera, CameraView } from "expo-camera";

//useState allows storing vars inside componenets
//useEffect performs some action through useState
//Most tutorials use this to store the data
import { useEffect, useState } from "react";

//ai component
import { GoogleGenerativeAI } from "@google/generative-ai";

//pasing it into the ai
let barcodeNumber = "brochacho";

const Scanner = () => {
  //router for links
  const router = useRouter();
  //permisions and the scan data
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanData, setScanData] = useState(false);
  //sharing and using barcodenumber as a var in the text, since it'll change

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
        <Text style={styles.text}>Grant permission to the app</Text>
      </View>
    );
  }

  //Done like this because unsure why not implicitly done for any datatype
  //Could also make interface, and call it.

  //To stop it after getting the barcode, uses a useRef:
  //Off when ready, on to stop further scans through handleBarCodeScanned

  const handleBarCodeScanned = ({ type, data }: { type: any; data: any }) => {
    setScanData(true);

    console.log("Type: " + type);
    console.log("Data: " + data);

    //logic here to process the barcode number into the ai api
    barcodeNumber = data;
    // main();
  };

  //pass it to ai, since it'll now have the barcode var saved
  const barcodeAlert = () => {
    alert("Accessed barcode data: " + barcodeNumber);
    //functionality of the ai
  };

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

  //notes: not accurate. depending on how much info on product online
  async function main() {
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
      console.log(result.response.text());
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
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
        <Button title="barcode test" onPress={barcodeAlert} />
      </View>

      <Button title="ai summary" onPress={main} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 30,
  },
  cameraContainer: {
    width: 500,
    height: 500,
    overflow: "hidden",
  },
  images: {
    width: 100,
    height: 100,
    padding: 20,
  },
  title: {
    fontFamily: "Arial",
    fontWeight: "bold",
    fontSize: 30,
  },
  text: {
    fontFamily: "Arial",
    color: "#8000ff",
    fontSize: 40,
    //the camera background is naturally black, so cant do dark bg or that
    backgroundColor: "#95ff00",
    padding: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Scanner;
