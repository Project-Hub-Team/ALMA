/**
 * Relationships Controller
 */

import { get, ref } from 'firebase/database';
import { database } from '../config/firebase.config';

/**
 * Get all students in a class
 */
export const getStudentsByClass = async (classId) => {
  try {
    const snapshot = await get(ref(database, `class-students/${classId}`));
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
    console.error('Error getting students by class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all teachers for a class
 */
export const getTeachersByClass = async (classId) => {
  try {
    const snapshot = await get(ref(database, `class-teachers/${classId}`));
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
    console.error('Error getting teachers by class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all classes for a teacher
 */
export const getClassesByTeacher = async (teacherId) => {
  try {
    const snapshot = await get(ref(database, 'class-teachers'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Convert object to array
      const array = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      const teacherClasses = [];
      array.forEach(classData => {
        if (classData[teacherId]) {
          teacherClasses.push({
            classId: classData.id,
            ...classData[teacherId]
          });
        }
      });
      return { success: true, data: teacherClasses };
    }
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting classes by teacher:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all teachers for a subject
 */
export const getTeachersBySubject = async (subject) => {
  try {
    const snapshot = await get(ref(database, `subject-teachers/${subject}`));
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
    console.error('Error getting teachers by subject:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all subjects for a teacher
 */
export const getSubjectsByTeacher = async (teacherId) => {
  try {
    const snapshot = await get(ref(database, 'subject-teachers'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Convert object to array
      const array = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      const teacherSubjects = [];
      array.forEach(subjectData => {
        if (subjectData[teacherId]) {
          teacherSubjects.push({
            subject: subjectData.id,
            ...subjectData[teacherId]
          });
        }
      });
      return { success: true, data: teacherSubjects };
    }
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting subjects by teacher:', error);
    return { success: false, error: error.message };
  }
};