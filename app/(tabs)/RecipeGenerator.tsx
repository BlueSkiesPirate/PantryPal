import React, { useState, useMemo } from "react";
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator, Linking, Pressable } from "react-native";
import RecipeAIService from "@/app/recipeChatBot"; // Adjust path
import { getUserItems } from "@/scripts/firebaseHelpers";


export default function RecipeScreen() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const aiService = useMemo(() => new RecipeAIService(), []);

  


  const handleGenerateRecipes = async () => {
    setLoading(true);
    try {
      const inventory = await getUserItems(`inventory`);

      if (!inventory || inventory.length === 0) {
        console.log("Your pantry is empty! Scan some items first.");
        setLoading(false);
        return;
      }



      // 1. Call the AI service with your inventory list
      const rawResponse = await aiService.recommendRecipes(inventory);

      // 2. Parse the "Title - Link" string into an array of objects
      const parsedRecipes = rawResponse
        .split("\n")
        .filter((line) => line.includes(" - ")) // Ensure it's a valid recipe line
        .map((line, index) => {
          const [title, link] = line.split(" - ");
          return { id: index.toString(), title: title.trim(), link: link.trim() };
        });

      setRecipes(parsedRecipes);
    } catch (error) {
      console.error("Failed to get recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Meal Ideas</Text>
      
      <Button 
        title={loading ? "Finding recipes..." : "Generate 20 Recipes"} 
        onPress={handleGenerateRecipes}
        disabled={loading}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.recipeCard}>
              <Text style={styles.recipeTitle}>{item.title}</Text>
              <Pressable onPress={() => Linking.openURL(item.link)}>
                <Text style={styles.recipeLink}>View Full Recipe →</Text>
              </Pressable>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  listContent: { paddingTop: 10 },
  recipeCard: {
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  recipeTitle: { fontSize: 18, fontWeight: "600", marginBottom: 5 },
  recipeLink: { color: "#007AFF", fontWeight: "500" },
});