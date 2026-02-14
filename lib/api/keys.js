import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../config/firebase";
import { v4 as uuidv4 } from "uuid";

const KEYS_COLLECTION = "api_keys";

/**
 * Generate a new API key for the user
 */
export const generateApiKey = async (userId) => {
  try {
    const key = `cn_${uuidv4().replace(/-/g, "")}`;
    await addDoc(collection(db, KEYS_COLLECTION), {
      userId,
      key,
      createdAt: serverTimestamp(),
      lastUsed: null,
    });
    return key;
  } catch (error) {
    console.error("Error generating API key:", error);
    throw error;
  }
};

/**
 * Get user's API keys
 */
export const getUserApiKeys = async (userId) => {
  try {
    const q = query(collection(db, KEYS_COLLECTION), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting API keys:", error);
    throw error;
  }
};

/**
 * Revoke an API key
 */
export const revokeApiKey = async (keyId) => {
  try {
    await deleteDoc(doc(db, KEYS_COLLECTION, keyId));
  } catch (error) {
    console.error("Error revoking API key:", error);
    throw error;
  }
};
