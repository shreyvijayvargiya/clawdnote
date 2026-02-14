import Dexie from 'dexie';

export const db = new Dexie('ClawdNoteDB');

db.version(1).stores({
  notes: '++id, userId, title, content, createdAt, updatedAt, isSynced, lastSyncedAt',
  settings: 'key, value'
});

export default db;
