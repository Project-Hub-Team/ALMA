/**
 * Teachers Controller
 */

import { ref, get, set, update, push } from 'firebase/database';
import { database } from '../config/firebase.config';

export const createTeacher = async (teacherData) => {
  try {
    const newRef = push(ref(database, 'users'));
    await set(newRef, {
      ...teacherData,
      role: 'teacher',
      isActive: true,
      id: newRef.key,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return { success: true, id: newRef.key };
  } catch (error) {
    console.error('Error creating teacher:', error);
    return { success: false, error: error.message };
  }
};

export const getTeacher = async (teacherId) => {
  try {
    const snapshot = await get(ref(database, `users/${teacherId}`));
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: false, error: 'Teacher not found' };
  } catch (error) {
    console.error('Error getting teacher:', error);
    return { success: false, error: error.message };
  }
};

export const getAllTeachers = async () => {
  try {
    const snapshot = await get(ref(database, 'users'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Convert object to array
      const array = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      const teachers = array.filter(user => user.role === 'teacher');
      return { success: true, data: teachers };
    }
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting teachers:', error);
    return { success: false, error: error.message };
  }
};

export const updateTeacher = async (teacherId, data) => {
  try {
    await update(ref(database, `users/${teacherId}`), {
      ...data,
      updatedAt: Date.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating teacher:', error);
    return { success: false, error: error.message };
  }
};