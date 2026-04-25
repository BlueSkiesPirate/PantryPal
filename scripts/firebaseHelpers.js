import { doc, getDoc, arrayUnion, arrayRemove, updateDoc, deleteField } from "firebase/firestore";
import { auth, db } from "../firebase"; // adjust path as needed

export async function getUserProfile() {
  const user = auth.currentUser;

  if (!user) {
    console.log("No user is logged in");
    return null;
  }

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    console.log("User profile does not exist");
    return null;
  }
}


  export async function addStoredItem(barcode, jsonData){
    const userDocRef = doc(db, 'users', auth.currentUser.uid);

    try{
      await updateDoc(userDocRef, {
        [`storedItems.${barcode}`]: jsonData
      });
      console.log("Product Data Stored");

  }catch (error) {
      console.error("Error updating document: ", error);
    }
    return getUserStoredItems();
}


  export async function deleteStoredItem(barcode)  {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);

    try{
      await updateDoc(userDocRef, {
        [`storedItems.${barcode}`]: deleteField()
      });
      console.log("Deleted/Attempted", barcode);

    }catch (error) {
      console.error("Error deleting document: ", error);
    }

    return getUserStoredItems();
  };

  export async function getUserStoredItems() {
    const user = auth.currentUser;
    if (!user) {
    console.log("No user is logged in");
    return null;
  }

  const userDocRef = doc(db, "users", auth.currentUser.uid);
  const docSnap = await getDoc(userDocRef);

  if (!docSnap.exists()) return [];

  const stored = docSnap.data().storedItems || {};

  return Object.entries(stored).map(([barcode, item]) => ({
    barcode: barcode,
    productName: item.productName,
    productBrand: item.productBrand,
    image: item.image,
    ingredients: item.ingredients,
    allergies: item.allergies,
    recyabilitySteps: item.recyabilitySteps,
    
  }));
}

// Get wishlist items for the current user
export const getWishlistItems = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const snap = await getDoc(doc(db, "users", uid));
  return snap.data()?.wishlistItems || [];
};

// Add an item to the wishlist
export const addWishlistItem = async (itemName) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  await updateDoc(doc(db, "users", uid), {
    wishlistItems: arrayUnion(itemName),
  });
};

// Remove an item from the wishlist
export const deleteWishlistItem = async (itemName) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  await updateDoc(doc(db, "users", uid), {
    wishlistItems: arrayRemove(itemName),
  });
};


