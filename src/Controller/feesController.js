/**
 * Fees Controller
 */

import { ref, get, set, push } from 'firebase/database';
import { database } from '../config/firebase.config';

export const createFeeRecord = async (studentId, feeData) => {
  try {
    const newRef = push(ref(database, `fees/${studentId}`));
    await set(newRef, {
      ...feeData,
      id: newRef.key,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return { success: true, id: newRef.key };
  } catch (error) {
    console.error('Error creating fee record:', error);
    return { success: false, error: error.message };
  }
};

export const getStudentFees = async (studentId) => {
  try {
    const snapshot = await get(ref(database, `fees/${studentId}`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Convert object to array
      const array = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      return { success: true, data: array };
    }
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting student fees:', error);
    return { success: false, error: error.message };
  }
};

export const recordPayment = async (studentId, paymentData) => {
  try {
    const newRef = push(ref(database, `payments/${studentId}`));
    await set(newRef, {
      ...paymentData,
      id: newRef.key,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return { success: true, id: newRef.key };
  } catch (error) {
    console.error('Error recording payment:', error);
    return { success: false, error: error.message };
  }
};

export const getStudentPayments = async (studentId) => {
  try {
    const snapshot = await get(ref(database, `payments/${studentId}`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Convert object to array
      const array = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      return { success: true, data: array };
    }
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting student payments:', error);
    return { success: false, error: error.message };
  }
};