import {
	collection,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	query,
	where,
	orderBy,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const NOTES_COLLECTION = "notes";

export const createNote = async (userId, noteData) => {
	try {
		const docRef = await addDoc(collection(db, NOTES_COLLECTION), {
			...noteData,
			userId,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
		return { id: docRef.id, ...noteData };
	} catch (error) {
		console.error("Error creating note:", error);
		throw error;
	}
};

export const updateNote = async (noteId, noteData) => {
	try {
		const docRef = doc(db, NOTES_COLLECTION, noteId);
		await updateDoc(docRef, {
			...noteData,
			updatedAt: serverTimestamp(),
		});
		return { id: noteId, ...noteData };
	} catch (error) {
		console.error("Error updating note:", error);
		throw error;
	}
};

export const deleteNote = async (noteId) => {
	try {
		const docRef = doc(db, NOTES_COLLECTION, noteId);
		await deleteDoc(docRef);
		return noteId;
	} catch (error) {
		console.error("Error deleting note:", error);
		throw error;
	}
};

export const getNoteById = async (noteId) => {
	try {
		const docRef = doc(db, NOTES_COLLECTION, noteId);
		const docSnap = await getDoc(docRef);
		if (docSnap.exists()) {
			return { id: docSnap.id, ...docSnap.data() };
		}
		return null;
	} catch (error) {
		console.error("Error getting note:", error);
		throw error;
	}
};

export const getUserNotes = async (userId) => {
	try {
		const q = query(
			collection(db, NOTES_COLLECTION),
			where("userId", "==", userId)
			// Temporarily removed orderBy to fix index error while fetching
			// orderBy("updatedAt", "desc")
		);
		const querySnapshot = await getDocs(q);
		const notes = querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));
		// Sort manually in JS to avoid index requirement for now
		return notes.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
	} catch (error) {
		console.error("Error getting user notes:", error);
		throw error;
	}
};
