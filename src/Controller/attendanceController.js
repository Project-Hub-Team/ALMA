/**
 * Attendance Controller
 */

import { set, ref, get } from 'firebase/database';
import { database } from '../config/firebase.config';

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
  try {
    const snapshot = await get(ref(database, `attendance/${classId}/${date}`));
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: false, error: 'Attendance not found' };
  } catch (error) {
    console.error('Error getting attendance:', error);
    return { success: false, error: error.message };
  }
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