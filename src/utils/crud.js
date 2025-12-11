/**
 * Generic CRUD Operations for Firebase Realtime Database
 */

import { ref, get, set, update, remove, push } from 'firebase/database';
import { database } from '../config/firebase.config';

export const createRecord = async (path, data) => {
  try {
    const newRef = push(ref(database, path));
    await set(newRef, data);
    return { success: true, id: newRef.key };
  } catch (error) {
    console.error('Error creating record:', error);
    return { success: false, error: error.message };
  }
};

export const readAllRecords = async (path) => {
  try {
    const snapshot = await get(ref(database, path));
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: false, error: 'No data found' };
  } catch (error) {
    console.error('Error reading records:', error);
    return { success: false, error: error.message };
  }
};

export const updateRecord = async (path, data) => {
  try {
    await update(ref(database, path), data);
    return { success: true };
  } catch (error) {
    console.error('Error updating record:', error);
    return { success: false, error: error.message };
  }
};

export const deleteRecord = async (path) => {
  try {
    await remove(ref(database, path));
    return { success: true };
  } catch (error) {
    console.error('Error deleting record:', error);
    return { success: false, error: error.message };
  }
};