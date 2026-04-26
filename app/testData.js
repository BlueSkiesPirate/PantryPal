import { addItem } from "../scripts/firebaseHelpers";

//----------------I RANOUT API QUOTA+ also slow---------------------------------------------

export default async function getTestData() {
  const productName = "Watermelon";
  const productBrand = "Dole";
  const imageUrl =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Watermelon_cross_BNC.jpg/2560px-WatermelMMMon_cross_BNC.jpg";

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

  await addItem("storedItems", "181174000390", JSON.parse(response1));
  await addItem("storedItems", "5449000000996", JSON.parse(response2));
  await addItem("storedItems", "00038000183690", JSON.parse(response3));
  await addItem("storedItems", "00028400157483", JSON.parse(response4));
}
