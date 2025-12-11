/**
 * Lesson Notes Controller
 */

import { ref, get, set, remove, push } from 'firebase/database';
import { database } from '../config/firebase.config';

export const uploadLessonNote = async (classId, subjectId, lessonData) => {
  try {
    const newRef = push(ref(database, `lessonNotes/${classId}/${subjectId}`));
    await set(newRef, {
      ...lessonData,
      id: newRef.key,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return { success: true, id: newRef.key };
  } catch (error) {
    console.error('Error uploading lesson note:', error);
    return { success: false, error: error.message };
  }
};

export const getLessonNotes = async (classId, subjectId) => {
  try {
    const snapshot = await get(ref(database, `lessonNotes/${classId}/${subjectId}`));
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
    console.error('Error getting lesson notes:', error);
    return { success: false, error: error.message };
  }
};

export const deleteLessonNote = async (classId, subjectId, noteId) => {
  try {
    await remove(ref(database, `lessonNotes/${classId}/${subjectId}/${noteId}`));
    return { success: true };
  } catch (error) {
    console.error('Error deleting lesson note:', error);
    return { success: false, error: error.message };
  }
};