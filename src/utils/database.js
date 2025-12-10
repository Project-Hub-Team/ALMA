/**
 * Firebase Realtime Database Helper Functions
 */

import { ref, get, set, update, remove, push, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import { database } from '../config/firebase.config';

// ============================================
// GENERIC CRUD OPERATIONS
// ============================================

/**
 * Create a new record
 */
export const createRecord = async (path, data) => {
  try {
    const newRef = push(ref(database, path));
    await set(newRef, {
      ...data,
      id: newRef.key,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return { success: true, id: newRef.key };
  } catch (error) {
    console.error('Error creating record:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a record with specific ID
 */
export const createRecordWithId = async (path, id, data) => {
  try {
    await set(ref(database, `${path}/${id}`), {
      ...data,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return { success: true, id };
  } catch (error) {
    console.error('Error creating record with ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Read a single record
 */
export const readRecord = async (path) => {
  try {
    const snapshot = await get(ref(database, path));
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: false, error: 'Record not found' };
  } catch (error) {
    console.error('Error reading record:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Read all records from a path
 */
export const readAllRecords = async (path) => {
  try {
    const snapshot = await get(ref(database, path));
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
    console.error('Error reading all records:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a record
 */
export const updateRecord = async (path, data) => {
  try {
    await update(ref(database, path), {
      ...data,
      updatedAt: Date.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating record:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a record
 */
export const deleteRecord = async (path) => {
  try {
    await remove(ref(database, path));
    return { success: true };
  } catch (error) {
    console.error('Error deleting record:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Query records by field value
 */
export const queryRecords = async (path, field, value) => {
  try {
    const dbQuery = query(ref(database, path), orderByChild(field), equalTo(value));
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
    console.error('Error querying records:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Listen to real-time updates
 */
export const listenToRecords = (path, callback) => {
  const dbRef = ref(database, path);
  
  onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const array = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      callback(array);
    } else {
      callback([]);
    }
  });
  
  // Return cleanup function
  return () => off(dbRef);
};

// ============================================
// STUDENT OPERATIONS
// ============================================

export const createStudent = async (studentData) => {
  return await createRecord('users', {
    ...studentData,
    role: 'student',
    isActive: true
  });
};

export const getStudent = async (studentId) => {
  return await readRecord(`users/${studentId}`);
};

export const getAllStudents = async () => {
  try {
    const result = await readAllRecords('users');
    if (result.success) {
      const students = result.data.filter(user => user.role === 'student');
      return { success: true, data: students };
    }
    return result;
  } catch (error) {
    console.error('Error getting students:', error);
    return { success: false, error: error.message };
  }
};

export const updateStudent = async (studentId, data) => {
  return await updateRecord(`users/${studentId}`, data);
};

export const deleteStudent = async (studentId) => {
  return await deleteRecord(`users/${studentId}`);
};

// ============================================
// TEACHER OPERATIONS
// ============================================

export const createTeacher = async (teacherData) => {
  return await createRecord('users', {
    ...teacherData,
    role: 'teacher',
    isActive: true
  });
};

export const getTeacher = async (teacherId) => {
  return await readRecord(`users/${teacherId}`);
};

export const getAllTeachers = async () => {
  try {
    const result = await readAllRecords('users');
    if (result.success) {
      const teachers = result.data.filter(user => user.role === 'teacher');
      return { success: true, data: teachers };
    }
    return result;
  } catch (error) {
    console.error('Error getting teachers:', error);
    return { success: false, error: error.message };
  }
};

export const updateTeacher = async (teacherId, data) => {
  return await updateRecord(`users/${teacherId}`, data);
};

// ============================================
// ATTENDANCE OPERATIONS
// ============================================

export const recordAttendance = async (classId, date, attendanceData) => {
  const path = `attendance/${classId}/${date}`;
  return await set(ref(database, path), {
    ...attendanceData,
    classId,
    date,
    recordedAt: Date.now()
  });
};

export const getAttendance = async (classId, date) => {
  return await readRecord(`attendance/${classId}/${date}`);
};

export const getAttendanceByDateRange = async (classId, startDate, endDate) => {
  try {
    const snapshot = await get(ref(database, `attendance/${classId}`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const filtered = Object.keys(data)
        .filter(date => date >= startDate && date <= endDate)
        .map(date => ({
          date,
          ...data[date]
        }));
      return { success: true, data: filtered };
    }
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error getting attendance by date range:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// RESULTS OPERATIONS
// ============================================

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
  return await readAllRecords(`results/${studentId}/${academicYear}/${term}`);
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

// ============================================
// FEES OPERATIONS
// ============================================

export const createFeeRecord = async (studentId, feeData) => {
  const path = `fees/${studentId}`;
  return await createRecord(path, feeData);
};

export const getStudentFees = async (studentId) => {
  return await readAllRecords(`fees/${studentId}`);
};

export const recordPayment = async (studentId, paymentData) => {
  const path = `payments/${studentId}`;
  return await createRecord(path, paymentData);
};

export const getStudentPayments = async (studentId) => {
  return await readAllRecords(`payments/${studentId}`);
};

// ============================================
// LESSON NOTES OPERATIONS
// ============================================

export const uploadLessonNote = async (classId, subjectId, lessonData) => {
  const path = `lessonNotes/${classId}/${subjectId}`;
  return await createRecord(path, lessonData);
};

export const getLessonNotes = async (classId, subjectId) => {
  return await readAllRecords(`lessonNotes/${classId}/${subjectId}`);
};

export const deleteLessonNote = async (classId, subjectId, noteId) => {
  return await deleteRecord(`lessonNotes/${classId}/${subjectId}/${noteId}`);
};

// ============================================
// VOUCHER OPERATIONS
// ============================================

export const createVoucher = async (voucherData) => {
  return await createRecord('vouchers', voucherData);
};

export const getVoucher = async (serial, pin) => {
  try {
    const vouchersResult = await readAllRecords('vouchers');
    if (!vouchersResult.success) return vouchersResult;
    
    const voucher = vouchersResult.data.find(
      v => v.code === serial && v.pin === pin && v.status === 'unused'
    );
    
    if (voucher) {
      // Check if voucher is expired
      const isExpired = new Date(voucher.expiresAt) < new Date();
      if (isExpired) {
        return { success: false, error: 'Voucher has expired' };
      }
      return { success: true, data: voucher };
    }
    return { success: false, error: 'Invalid voucher code or PIN' };
  } catch (error) {
    console.error('Error getting voucher:', error);
    return { success: false, error: error.message };
  }
};

export const markVoucherAsUsed = async (voucherId, studentId) => {
  return await updateRecord(`vouchers/${voucherId}`, {
    status: 'used',
    usedBy: studentId,
    usedAt: Date.now()
  });
};

// ============================================
// USER OPERATIONS
// ============================================

export const createUser = async (userId, userData) => {
  return await createRecordWithId('users', userId, userData);
};

export const getUser = async (userId) => {
  try {
    // First try direct lookup (for users stored with uid as key)
    const directResult = await readRecord(`users/${userId}`);
    if (directResult.success) {
      return directResult;
    }
    
    // If not found, search by uid field (for users created with push keys)
    const allUsersResult = await readAllRecords('users');
    if (allUsersResult.success) {
      const user = allUsersResult.data.find(u => u.uid === userId);
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
  return await updateRecord(`users/${userId}`, data);
};

export const getUsersByRole = async (role) => {
  return await queryRecords('users', 'role', role);
};

// ============================================
// SYSTEM SETTINGS
// ============================================

export const getSystemSettings = async () => {
  return await readRecord('systemSettings');
};

export const updateSystemSettings = async (settings) => {
  return await set(ref(database, 'systemSettings'), {
    ...settings,
    updatedAt: Date.now()
  });
};

// ============================================
// CLASS-STUDENT RELATIONSHIPS
// ============================================

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

// ============================================
// CLASS-TEACHER RELATIONSHIPS
// ============================================

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
    const allClassTeachers = await readAllRecords('class-teachers');
    if (allClassTeachers.success) {
      const teacherClasses = [];
      allClassTeachers.data.forEach(classData => {
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

// ============================================
// SUBJECT-TEACHER RELATIONSHIPS
// ============================================

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
    const allSubjectTeachers = await readAllRecords('subject-teachers');
    if (allSubjectTeachers.success) {
      const teacherSubjects = [];
      allSubjectTeachers.data.forEach(subjectData => {
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
