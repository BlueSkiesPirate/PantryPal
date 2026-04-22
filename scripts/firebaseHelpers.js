import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
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
        [`stored.${barcode}`]: jsonData
      });
      console.log("Product Data Stored");

  }catch (error) {
      console.error("Error updating document: ", error);
    }
    return getUserProfile();
}


  export async function deleteStoredItems(barcode)  {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);

    try{
      await updateDoc(userDocRef, {
        [`stored.${barcode}`]: deleteField()
      });

    }catch (error) {
      console.error("Error deleting document: ", error);
    }

    return getUserProfile();
  };
    



