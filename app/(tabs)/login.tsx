import { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { router } from "expo-router";
import {getUserProfile, deleteStoredItems, addStoredItem} from "../../scripts/firebaseHelpers";
import { serializableMappingCache } from "react-native-worklets";
 

export default function Login() {
  const [email, setEmail] = useState("abc@gmail.com");
  const [password, setPassword] = useState("123456");

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.log("Login error:", err.message);
    }
    const profile = await getUserProfile();
  console.log("User profile:", profile);
    router.replace("/(tabs)");


   //----Testing----
    const barcode = `12304567890`; 
    const itemData = {
      name: "Watermelon",
      quantity: 1,
      expirationDate: new Date("2024-12-31"),
    };

    var consoleOutput = await addStoredItem(barcode,itemData);
    console.log("Added item:", consoleOutput);  


        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, 1000));

    const aprofile =await deleteStoredItems(barcode);
    console.log("profile:", aprofile)


  };
    console.log("LOGIN SCREEN LOADED");
  

    

  return (
    <View style={{ flex: 1, backgroundColor: "white", padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Login</Text>

      <TextInput placeholder="Email" onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} />

      <Button title="Login" onPress={login} />
    </View>
  );
}