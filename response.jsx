import axios from "axios";



export default async function handleScrape(data) {

    try {
        // Use USDA FoodData Central API (JSON endpoint, no HTML parsing needed)
        const response = await axios.get(
            `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=7L1MQ2mIhcY5ENerOtjGTXvncYtU5ax8dZX3OzoU&query=${encodeURIComponent(data)}&dataType=Branded&pageSize=1`
        );

        // Get the first food item from the JSON response
        if (response.data.foods && response.data.foods.length > 0) {
            return response.data.foods[0].description;
        }

        return "Food not found";
    } catch (error) {
        console.log("Error while fetching food data: " + error);
        return "Error fetching data";
    }








};
