import { db as localDb } from './localDb';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  query,
  where,
  getDoc
} from 'firebase/firestore';
import { db as firestore } from '../config/firebase';

export const noteService = {
  // Get all notes (local + indicator of cloud status)
  async getAllNotes(userId) {
    if (!userId) return [];
    return await localDb.notes.where('userId').equals(userId).toArray();
  },

  // Get a single note
  async getNote(id) {
    // Check local first
    const localNote = await localDb.notes.get(id);
    if (localNote) return localNote;
    return null;
  },

  // Save a note (always save locally first)
  async saveNote(userId, note) {
    if (!userId) throw new Error("User ID is required to save a note");
    
    const timestamp = Date.now();
    const noteData = {
      ...note,
      userId,
      updatedAt: timestamp,
      isSynced: false
    };

    let id = note.id;
    if (id) {
      // Ensure we don't try to update with the id in the data object if it's auto-incremented
      const { id: _, ...dataToUpdate } = noteData;
      await localDb.notes.update(id, dataToUpdate);
    } else {
      noteData.createdAt = timestamp;
      id = await localDb.notes.add(noteData);
    }

    // Try background sync
    this.syncNoteToCloud(userId, id).catch(err => console.error("Background sync failed:", err));

    return { ...noteData, id };
  },

  async syncNoteToCloud(userId, localId) {
    if (!navigator.onLine) return;
    
    const note = await localDb.notes.get(localId);
    if (!note || note.isSynced) return;

    try {
      if (note.cloudId) {
        const docRef = doc(firestore, 'notes', note.cloudId);
        await updateDoc(docRef, {
          title: note.title,
          content: note.content,
          updatedAt: serverTimestamp()
        });
      } else {
        const docRef = await addDoc(collection(firestore, 'notes'), {
          userId,
          title: note.title,
          content: note.content,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        await localDb.notes.update(localId, { cloudId: docRef.id });
      }
      await localDb.notes.update(localId, { isSynced: true, lastSyncedAt: Date.now() });
    } catch (error) {
      console.error("Cloud sync failed for note:", localId, error);
    }
  },

  // Delete a note
  async deleteNote(id) {
    const note = await localDb.notes.get(id);
    if (note && note.cloudId && navigator.onLine) {
      try {
        await deleteDoc(doc(firestore, 'notes', note.cloudId));
      } catch (error) {
        console.error("Failed to delete from cloud:", error);
      }
    }
    await localDb.notes.delete(id);
  },

  // Full Sync with cloud
  async syncAllWithCloud(userId) {
    if (!userId || !navigator.onLine) return;

    // 1. Sync unsynced local notes to cloud
    const unsyncedNotes = await localDb.notes
      .where('userId').equals(userId)
      .and(n => !n.isSynced)
      .toArray();

    for (const note of unsyncedNotes) {
      await this.syncNoteToCloud(userId, note.id);
    }

    // 2. Fetch remote notes and update local
    const q = query(collection(firestore, 'notes'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    for (const doc of querySnapshot.docs) {
      const cloudData = doc.data();
      const localNote = await localDb.notes.where('cloudId').equals(doc.id).first();

      if (!localNote) {
        await localDb.notes.add({
          userId: cloudData.userId,
          title: cloudData.title,
          content: cloudData.content,
          cloudId: doc.id,
          isSynced: true,
          lastSyncedAt: Date.now(),
          createdAt: cloudData.createdAt?.toMillis() || Date.now(),
          updatedAt: cloudData.updatedAt?.toMillis() || Date.now()
        });
      } else if (cloudData.updatedAt?.toMillis() > localNote.updatedAt) {
        await localDb.notes.update(localNote.id, {
          title: cloudData.title,
          content: cloudData.content,
          isSynced: true,
          lastSyncedAt: Date.now(),
          updatedAt: cloudData.updatedAt.toMillis()
        });
      }
    }
  }
};
