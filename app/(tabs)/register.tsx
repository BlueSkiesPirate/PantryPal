import { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { Link, router } from "expo-router";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [allergies, setAllergies] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const register = async () => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

    await setDoc(doc(db, "users", uid), {
      email,
      allergies: allergies.split(",").map(a => a.trim()).filter(Boolean),
      restrictions: restrictions.split(",").map(r => r.trim()).filter(Boolean),
      nutritionGoals: {
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
      },
      healthConditions: [],


      storedItems: [],
      wishlistItems: [],
      
      createdAt: new Date(),
    });

    router.replace("/(tabs)");

    } catch (err: any) {
      console.log("Registration error:", err.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white", padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Register</Text>

      <TextInput placeholder="Email" onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} />
      <TextInput placeholder="Allergies (comma separated)" onChangeText={setAllergies}/>

      <TextInput
        placeholder="Restrictions (comma separated)"
        onChangeText={setRestrictions}
      />

      <TextInput
        placeholder="Daily Calories Goal"
        keyboardType="numeric"
        onChangeText={setCalories}
      />

      <TextInput
        placeholder="Protein Goal (g)"
        keyboardType="numeric"
        onChangeText={setProtein}
      />

      <TextInput
        placeholder="Carbs Goal (g)"
        keyboardType="numeric"
        onChangeText={setCarbs}
      />

      <TextInput
        placeholder="Fat Goal (g)"
        keyboardType="numeric"
        onChangeText={setFat}
      />

      <Button title="Register" onPress={register} />
            <Link href="/login">
              <Text style={{ color: "blue" }}>Already have an account? Log In Here</Text>
            </Link>
    </View>
  );
}