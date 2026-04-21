import React from "react";
import { Button, Platform, StyleSheet, Text, View } from "react-native";

//navigation from file
import { useRouter } from 'expo-router';

//camera functionality
import { Camera, CameraView } from 'expo-camera';

//useState allows storing vars inside componenets
//useEffect performs some action through useState
//Most tutorials use this to store the data
import { useEffect, useState } from "react";

//ai component
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

import { addData } from "../Add2DB";  


//pasing it into the ai
let barcodeNumber = "075720000302";


const Scanner = () => {
  //router for links
  const router = useRouter();
  //permisions and the scan data
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanData, setScanData] = useState(false);
  
  const [productInfo, setProductInfo] = useState<GoUpcAPIResponse | null>(null);
  const [aiInfo, setAiInfo] = useState<String>("Nan");



  //sharing and using barcodenumber as a var in the text, since it'll change

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
        <Text style = {styles.text}>Grant permisision to the app</Text>
      </View>
    )
  }


  //Done like this because unsure why not implicitly done for any datatype
  //Could also make interface, and call it.

  //To stop it after getting the barcode, uses a useRef:
  //Off when ready, on to stop further scans through handleBarCodeScanned
  
  const handleBarCodeScanned = ({type, data}: { type: any, data: any }) => {
    setScanData(true);
    
    console.log("Type: " + type)
    console.log("Data: " + data)

    //logic here to process the barcode number into the ai api
    barcodeNumber = data
    getProductData();
    main();
  };

  //pass it to ai, since it'll now have the barcode var saved
  const barcodeAlert = () => {

    const placeholderData = `{
  "product": {
    "productName": "Poland Spring Sparkling Lime Flavor Water",
    "productBrand": "Poland Spring",
    "image": "https://go-upc.s3.amazonaws.com/images/72993418.jpeg",
    "ingredients": [
      "Carbonated Spring Water",
      "Natural Flavors"
    ],
    "allergies": [],
    "recylabilitySteps": [
      "Empty and rinse the bottle.",
      "Replace the cap on the bottle.",
      "Place the bottle in your local plastic recycling bin."
    ]
  }
}`

    addData('products',barcodeNumber, JSON.parse( placeholderData));


    //alert("Accessed barcode data: " + barcodeNumber);
    //functionality of the ai
  };

  //Generic intrerface. Getting the name, brand, and category most important. Description and image for later usage
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
const go_upc_api_key: string =process.env.EXPO_PUBLIC_GO_UPC_KEY;
const api_base_url = 'https://go-upc.com/api/v1/code/';

const url: string = api_base_url + product_code + '?key=' + go_upc_api_key;

//Returns the entire interface. e.g. use .name to retrieve it.
//If it doesnt exist, it needs to be able to say that it doesnt exist in the database
//Will require multiple ai calls then
async function getProductData(): Promise<GoUpcAPIResponse> {
    const response = await fetch(url);
    
    //chechking if information is retrieved, if not error.
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const go_upc_data: GoUpcAPIResponse = await response.json();
    setProductInfo(go_upc_data);
    return go_upc_data;

}

//Google section/gemini ai api section
const google_api_key = process.env.EXPO_PUBLIC_GEMINI_KEY;

//used to initialize the google ai sdk
const ai = new GoogleGenAI({apiKey: google_api_key});

//notes: not accurate. depending on how much info on product online
async function main() {    
  try { 
//-------FOR TESTING; REMOVE LATER-------
setScanData(true);
//----------


    const productData = await getProductData();
          

    //Variables to store into the prompt for later usage
    const productName = productData.product.name;
    const productBrand = productData.product.brand;
    const productCategory = productData.product.category;
    const imageUrl = productData.product.imageUrl;

    const prompt = `Based off of ${productName}, ${productBrand}, ${productCategory}, ${imageUrl} and barcode of ${barcodeNumber}, convert it into a JSON object with the following structure. 
    You can elaborate on the recyability stpes if necessary but, be simple. 
    Don't respond with anything except the JSON object:
{
"product": {
"productName": $productName,
"productBrand": $productBrand,
"image": $imageUrl, //
"ingredients": [],
"allergies": [],
"recylabilitySteps": [],
},
}`
    //Will need a way to go through the resposne to format the text accoridngly.
    const response = await ai.models.generateContent({
      //model: "gemini-3-flash-preview",
      model: "gemini-3.1-flash-lite-preview",
      //Will just pass the information on barcode into here. Specifically, name, manufactuter, and barcode.
      contents: prompt,
    });
    //Must store this now instead of console.log
    
      
      console.log(response.text);
      if (response.text){
        setAiInfo(response.text);

        addData('products',barcodeNumber,JSON.parse(response.text));

      }
    

    } catch (error) {
      console.error(error);
    }
}


  return (
    <View style = {styles.container}>
    
    <View style = {styles.cameraContainer}>
      <CameraView
        style = {StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "qr", "ean8", "aztec", "upc_a", "upc_e", "codabar", "code39", "datamatrix", "itf14", "pdf417"],}} 
        onBarcodeScanned= {scanData? undefined:handleBarCodeScanned}
        />
        
        {/*we can add image  here, with ai summary, with other stuff; Only problem is the sizing
        when there is too much text to show */ }
        
        {scanData &&  (
          <View style={styles.infoCard}>
          
          <View style={styles.closeButton}>
            <Button title="X" onPress={() => setScanData(false)} color="#d61010"/>
          </View>

          <Text style={styles.title}>Product Information {"\n"} {aiInfo}</Text>






          
          </View>
          )
        }

        <Button title="barcode test" onPress={barcodeAlert} />
        <Button title="ai summary" onPress= {main}/>
      </View>
      
      
    </View>

  );
}

const styles = StyleSheet.create ({
infoCard: {
    position: 'absolute',
    bottom: 20,       
  
    // Ideally make it responsive to screen size, but wtv for now
    width: '75%',         
    height: '80%',        
  
    alignSelf: 'center',  
    
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    
    //This makes it look better infront of camera (I dont see a diff)
    
    elevation: 10,        // Android
    shadowColor: '#000',  // iOS
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Ensures it stays on top of other content
  },

  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 30,
  },
  cameraContainer: {
    width: 500,  
    height: 500, 
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    width: '80%',
    height: '60%',
    backgroundColor: 'white',
    opacity: 0.7,
    top: '20%',
    left: '10%',
    borderWidth: 2,
    borderColor: '#241584',
  },
  images: {
    width: 100,
    height: 100,
    padding: 20,
  },
  title: {
    fontFamily: 'Arial',
    fontWeight: 'bold',
    fontSize: 30,
  },
  text: {
    fontFamily: 'Arial',
    color: '#8000ff',
    fontSize: 40,
    //the camera background is naturally black, so cant do dark bg or that
    backgroundColor: '#95ff00',
    padding: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})

export default Scanner;