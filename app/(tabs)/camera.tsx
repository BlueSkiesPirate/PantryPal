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

//pasing it into the ai
let barcodeNumber = "brochacho";

const Scanner = () => {
  //router for links
  const router = useRouter();
  //permisions and the scan data
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanData, setScanData] = useState(false);
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
    // main();
  }; 

  // const api_key = "<INSERT API KEY HERE FOR AI POOKIE>"

  //used to initialize the google ai sdk
//   const ai = new GoogleGenAI({apiKey: api_key});
  
//   async function main() {
//   const response = await ai.models.generateContent({
//     model: "gemini-3-flash-preview",
//     contents: "Explain how AI works in a few words",
//   });
//   console.log(response.text);
// }

  //pass it to ai, since it'll now have the barcode var saved
  const ai = () => {
    alert("Accessed barcode data: " + barcodeNumber);
    //functionality of the ai
  };



  return (
    <View style = {styles.container}>
    <View style = {styles.cameraContainer}>
      <CameraView
        style = {StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "qr", "ean8", "aztec", "upc_a", "upc_e", "codabar", "code39", "datamatrix", "itf14", "pdf417"],}} 
        onBarcodeScanned= {scanData? undefined:handleBarCodeScanned}
        />
        {scanData && <Button 
          title="Clck To Scan Again"
          onPress={()=>setScanData(false)}
          color="#241584"
        /> }
        <Button 
        title="Click to go Ai page"
        onPress={() => router.push("/ai")}>
        </Button>        
        <Button title="ai" onPress={ai} />
                
      </View>

    </View>
  );
}

const styles = StyleSheet.create ({
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
