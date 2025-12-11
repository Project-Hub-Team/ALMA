/**
 * Results Controller
 */

import { get, set, ref } from 'firebase/database';
import { database } from '../config/firebase.config.js';
import { getStudentsByClass } from './relationshipsController.js';

export const saveResult = async (studentId, term, academicYear, subjectId, resultData) => {
  const path = `results/${studentId}/${academicYear}/${term}/${subjectId}`;
  return await set(ref(database, path), {
    ...resultData,
    studentId,
    term,
    academicYear,
    subjectId,
    recordedAt: Date.now()
  });
};

export const getStudentResults = async (studentId, academicYear, term) => {
  try {
    const snapshot = await get(ref(database, `results/${studentId}/${academicYear}/${term}`));
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
    console.error('Error getting student results:', error);
    return { success: false, error: error.message };
  }
};

export const getClassResults = async (classId, academicYear, term) => {
  try {
    const studentsResult = await getStudentsByClass(classId);
    if (!studentsResult.success) return studentsResult;

    const students = studentsResult.data;
    const allResults = [];

    for (const student of students) {
      const results = await getStudentResults(student.id, academicYear, term);
      if (results.success && results.data.length > 0) {
        allResults.push({
          student,
          results: results.data
        });
      }
    }

    return { success: true, data: allResults };
  } catch (error) {
    console.error('Error getting class results:', error);
    return { success: false, error: error.message };
  }
};