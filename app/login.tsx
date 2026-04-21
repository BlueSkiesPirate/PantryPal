import { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { router } from "expo-router";
import {getUserProfile} from "../scripts/firebaseHelpers";
 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.log("Login error:", err.message);
    }
    const profile = await getUserProfile();
  console.log("User profile:", profile);
    router.replace("/(tabs)");
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