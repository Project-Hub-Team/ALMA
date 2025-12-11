/**
 * Students Controller
 */

import { ref, get, set, update, remove, push } from 'firebase/database';
import { database } from '../config/firebase.config';

export const createStudent = async (studentData) => {
  try {
    const newRef = push(ref(database, 'users'));
    await set(newRef, {
      ...studentData,
      role: 'student',
      isActive: true,
      id: newRef.key,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return { success: true, id: newRef.key };
  } catch (error) {
    console.error('Error creating student:', error);
    return { success: false, error: error.message };
  }
};

export const getStudent = async (studentId) => {
  try {
    const snapshot = await get(ref(database, `users/${studentId}`));
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: false, error: 'Student not found' };
  } catch (error) {
    console.error('Error getting student:', error);
    return { success: false, error: error.message };
  }
};

export const getAllStudents = async () => {
  try {
    const snapshot = await get(ref(database, 'users'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Convert object to array
      const array = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      const students = array.filter(user => user.role === 'student');
      return { success: true, data: students };
    }
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting students:', error);
    return { success: false, error: error.message };
  }
};

export const updateStudent = async (studentId, data) => {
  try {
    await update(ref(database, `users/${studentId}`), {
      ...data,
      updatedAt: Date.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating student:', error);
    return { success: false, error: error.message };
  }
};

export const deleteStudent = async (studentId) => {
  try {
    await remove(ref(database, `users/${studentId}`));
    return { success: true };
  } catch (error) {
    console.error('Error deleting student:', error);
    return { success: false, error: error.message };
  }
};