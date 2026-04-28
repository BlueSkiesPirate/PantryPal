import {
  arrayRemove,
  arrayUnion,
  deleteField,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
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
/*
--------------------------------------------------------------------
For: addItem , delItem, getUserItems
Use to access storedItems and inventory, I have not tested it with 
other fields nor is it intended to be.


--------------------------------------------------------------------
*/

/*
addItem(fieldName)
String fieldName: Firebase fieldName. 
String barcode: a barcode
String jsonData: a string in json format to be sent to firebase

Adds an item to the a field. 
The jsonData shouldn't include barcode as it's used as an identifier when deleting.


*/
export async function addItem(fieldName, barcode, jsonData) {
  const userDocRef = doc(db, "users", auth.currentUser.uid);

  try {
    await updateDoc(userDocRef, {
      [`${fieldName}.${barcode}`]: jsonData,
    });
    console.log("Product Data Stored");
  } catch (error) {
    console.error("Error updating document: ", error);
  }
  return getUserItems(fieldName);
}

/*
deleteItem(fieldName)
String fieldName: Firebase fieldName. 
String barcode: a barcode

Deletes an item with the barcode id in a specified field

*/
export async function deleteItem(fieldName, barcode) {
  const userDocRef = doc(db, "users", auth.currentUser.uid);

  try {
    await updateDoc(userDocRef, {
      [`${fieldName}.${barcode}`]: deleteField(),
    });
    console.log("Deleted/Attempted", barcode);
  } catch (error) {
    console.error("Error deleting document: ", error);
  }

  return getUserItems(fieldName);
}

export async function updateItemField(
  fieldName,
  barcode,
  keyToUpdate,
  newValue,
) {
  const user = auth.currentUser;

  if (!user) {
    console.log("No user is logged in");
    return null;
  }

  const userDocRef = doc(db, "users", user.uid);

  try {
    await updateDoc(userDocRef, {
      [`${fieldName}.${barcode}.${keyToUpdate}`]: newValue,
    });

    console.log("Updated item field:", keyToUpdate);
  } catch (error) {
    console.error("Error updating item field:", error);
  }

  return getUserItems(fieldName);
}

/*
getUserItems(fieldName)
String fieldName: Firebase fieldName; Ex. email,createdAt,storedItems,inventory, etc.

Fetchs data from specified field in firebase

*/

export async function getUserItems(fieldName) {
  const user = auth.currentUser;
  if (!user) {
    console.log("No user is logged in");
    return null;
  }

  const userDocRef = doc(db, "users", auth.currentUser.uid);
  const docSnap = await getDoc(userDocRef);

  if (!docSnap.exists()) return [];

  const data = docSnap.data()?.[fieldName] || {};

  return Object.entries(data).map(([barcode, item]) => ({
    barcode: barcode,
    ...item,
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
