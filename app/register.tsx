import { Link, router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebase";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [allergies, setAllergies] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const [credentialsError, setCredentialsError] = useState(false);
  const [credentailsErrorMessage, setCredentailsErrorMessage] = useState("");

  const register = async () => {
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCred.user.uid;

      await setDoc(doc(db, "users", uid), {
        email,
        allergies: allergies
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        restrictions: restrictions
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
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
      setCredentialsError(true);
      setCredentailsErrorMessage(err.message);
      console.log("Registration error:", err.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white", padding: 20 }}>
      {/* <Text style={{ fontSize: 24 }}>Register</Text> */}

      <TextInput
        placeholder="* Email"
        onChangeText={setEmail}
        style={styles.inputSection}
      />
      <TextInput
        placeholder="* Password"
        secureTextEntry
        onChangeText={setPassword}
        style={styles.inputSection}
      />
      <TextInput
        placeholder="Allergies (comma separated)"
        onChangeText={setAllergies}
        style={styles.inputSection}
      />

      <TextInput
        placeholder="Restrictions (comma separated)"
        onChangeText={setRestrictions}
        style={styles.inputSection}
      />

      <TextInput
        placeholder="Daily Calories Goal"
        keyboardType="numeric"
        onChangeText={setCalories}
        style={styles.inputSection}
      />

      <TextInput
        placeholder="Protein Goal (g)"
        keyboardType="numeric"
        onChangeText={setProtein}
        style={styles.inputSection}
      />

      <TextInput
        placeholder="Carbs Goal (g)"
        keyboardType="numeric"
        onChangeText={setCarbs}
        style={styles.inputSection}
      />

      <TextInput
        placeholder="Fat Goal (g)"
        keyboardType="numeric"
        onChangeText={setFat}
        style={styles.inputSection}
      />
      {credentialsError && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningMessage}>{credentailsErrorMessage}</Text>
        </View>
      )}

      <TouchableOpacity onPress={register} style={styles.register}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <Link href="/login" style={styles.dontHaveAnAccountButton}>
        <Text style={{ color: "blue" }}>
          Already have an account? Log In Here
        </Text>
      </Link>
    </View>
  );
}
const styles = StyleSheet.create({
  inputSection: {
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 20,
    paddingLeft: 20,
    marginTop: 15,
  },
  register: {
    borderRadius: 10,
    backgroundColor: "#45ff54",
    marginTop: 30,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    // color: "white",
    fontWeight: "black",
    fontSize: 20,
  },
  dontHaveAnAccountButton: {
    textAlign: "center",
    marginTop: 20,
    fontWeight: "black",
  },
  warningContainer: {
    // backgroundColor: "red",
    height: 40,
    marginTop: 10,
  },
  warningMessage: {
    color: "red",
    textAlign: "center",
  },
});
