import { doc, getDoc } from "firebase/firestore";
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
