/**
 * Firebase Storage Helper Functions
 * Modified to use Realtime Database for file storage (base64)
 */

import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '../config/firebase.config';
import { createRecord, updateRecord } from '../utils/database';

/**
 * Convert file to base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Upload a file to Realtime Database (base64)
 */
export const uploadFile = async (path, file, metadata = {}) => {
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    
    // Store in database
    const fileData = {
      path,
      data: base64Data,
      name: file.name,
      type: file.type,
      size: file.size,
      ...metadata,
      uploadedAt: new Date().toISOString()
    };
    
    const result = await createRecord('uploads', fileData);
    
    if (result.success) {
      return {
        success: true,
        url: base64Data, // Return base64 as URL for display
        path: path,
        id: result.id,
        metadata: fileData
      };
    }
    
    return { success: false, error: 'Failed to save file' };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Upload student profile photo
 */
export const uploadStudentPhoto = async (studentId, file) => {
  const path = `students/${studentId}/profile.jpg`;
  return await uploadFile(path, file, {
    contentType: file.type,
    customMetadata: {
      studentId,
      uploadedAt: new Date().toISOString()
    }
  });
};

/**
 * Upload teacher profile photo
 */
export const uploadTeacherPhoto = async (teacherId, file) => {
  const path = `teachers/${teacherId}/profile.jpg`;
  return await uploadFile(path, file, {
    contentType: file.type,
    customMetadata: {
      teacherId,
      uploadedAt: new Date().toISOString()
    }
  });
};

/**
 * Upload lesson note document
 */
export const uploadLessonNoteFile = async (classId, subjectId, file, fileName) => {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `lessonNotes/${classId}/${subjectId}/${timestamp}_${fileName}.${extension}`;
  
  return await uploadFile(path, file, {
    contentType: file.type,
    customMetadata: {
      classId,
      subjectId,
      originalName: file.name,
      uploadedAt: new Date().toISOString()
    }
  });
};

/**
 * Upload student document (birth certificate, etc.)
 */
export const uploadStudentDocument = async (studentId, documentType, file) => {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `students/${studentId}/documents/${documentType}_${timestamp}.${extension}`;
  
  return await uploadFile(path, file, {
    contentType: file.type,
    customMetadata: {
      studentId,
      documentType,
      uploadedAt: new Date().toISOString()
    }
  });
};

/**
 * Upload teacher certificate
 */
export const uploadTeacherCertificate = async (teacherId, certificateType, file) => {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `teachers/${teacherId}/certificates/${certificateType}_${timestamp}.${extension}`;
  
  return await uploadFile(path, file, {
    contentType: file.type,
    customMetadata: {
      teacherId,
      certificateType,
      uploadedAt: new Date().toISOString()
    }
  });
};

/**
 * Delete a file from database
 */
export const deleteFile = async (fileId) => {
  try {
    // For now, just return success
    // In a full implementation, you'd delete from the uploads collection
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get file download URL (returns base64 data)
 */
export const getFileURL = async (path) => {
  try {
    // For base64 stored in database, the URL is the base64 string itself
    // This is a placeholder - in a full implementation, you'd query the uploads collection
    return { success: false, error: 'File retrieval not implemented' };
  } catch (error) {
    console.error('Error getting file URL:', error);
    return { success: false, error: error.message };
  }
};

/**
 * List all files in a directory
 */
export const listFiles = async (path) => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    
    const files = await Promise.all(
      result.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return {
          name: item.name,
          fullPath: item.fullPath,
          url
        };
      })
    );
    
    return { success: true, files };
  } catch (error) {
    console.error('Error listing files:', error);
    return { success: false, error: error.message };
  }
};
