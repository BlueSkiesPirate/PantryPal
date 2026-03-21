import { Image } from "expo-image";
import { Text, View, StyleSheet, Button, Platform, TouchableOpacity } from "react-native";
import React, { ReactNode, useRef } from "react";


//camera functionality
import { CameraView, Camera} from 'expo-camera';

//useState allows storing vars inside componenets
//useEffect performs some action through useState
//Most tutorials use this to store the data
import {useState, useEffect} from "react";





const Scanner = () => {
  
const [hasPermission, setHasPermission] = useState<boolean | null>(null);
const [scanData, setScanData] = useState(false);

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

    const barcodeNumber = data;
    //logic here to process the barcode number into the ai api
    
  };

  //Buttons for ending and starting camera again


  


  return (
    <View style = {styles.container}>
      <CameraView
        style = {StyleSheet.absoluteFillObject}
        onBarcodeScanned= {scanData? undefined:handleBarCodeScanned}
        />
        {scanData && <Button 
          title="Press To Open Camera to Scan"
          onPress={()=>setScanData(false)}
        /> }
                
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
    fontSize: 20,
  },
})

export default Scanner;
