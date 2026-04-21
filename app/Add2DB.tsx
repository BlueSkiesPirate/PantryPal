import { db } from '../firebase'; // Import your initialized db
import {collection, doc, setDoc } from "firebase/firestore"; 


export async function addData(collectionName, documentId, data) {
  try {
    // Correct syntax for Firebase JS SDK (Expo compatible)
    await setDoc(doc(db, collectionName, documentId), data);
    
    console.log('Document successfully written with ID:', documentId);
  } catch (error) {
    console.error('Error writing document:', error);
    console.log("DEBUG:", { dbInstance: db, col: collectionName, id: documentId });
  }
}

