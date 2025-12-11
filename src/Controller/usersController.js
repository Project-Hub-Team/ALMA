/**
 * Users Controller
 */

import { ref, get, set, update, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../config/firebase.config';

export const createUser = async (userId, userData) => {
  try {
    await set(ref(database, `users/${userId}`), {
      ...userData,
      id: userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return { success: true, id: userId };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
};

export const getUser = async (userId) => {
  try {
    // First try direct lookup (for users stored with uid as key)
    let snapshot = await get(ref(database, `users/${userId}`));
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }

    // If not found, search by uid field (for users created with push keys)
    snapshot = await get(ref(database, 'users'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Convert object to array
      const array = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      const user = array.find(u => u.uid === userId);
      if (user) {
        return { success: true, data: user };
      }
    }

    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error: error.message };
  }
};

export const updateUser = async (userId, data) => {
  try {
    await update(ref(database, `users/${userId}`), {
      ...data,
      updatedAt: Date.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
};

export const getUsersByRole = async (role) => {
  try {
    const dbQuery = query(ref(database, 'users'), orderByChild('role'), equalTo(role));
    const snapshot = await get(dbQuery);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const array = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      return { success: true, data: array };
    }
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting users by role:', error);
    return { success: false, error: error.message };
  }
};