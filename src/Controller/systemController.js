/**
 * System Controller
 */

import { get, set, ref } from 'firebase/database';
import { database } from '../config/firebase.config';

export const getSystemSettings = async () => {
  try {
    const snapshot = await get(ref(database, 'systemSettings'));
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: false, error: 'System settings not found' };
  } catch (error) {
    console.error('Error getting system settings:', error);
    return { success: false, error: error.message };
  }
};

export const updateSystemSettings = async (settings) => {
  return await set(ref(database, 'systemSettings'), {
    ...settings,
    updatedAt: Date.now()
  });
};