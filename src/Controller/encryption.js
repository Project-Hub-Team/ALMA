/**
 * Encryption and Hashing Utilities
 * For securing sensitive data in the database
 */

import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';

// Encryption key - In production, use environment variable
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'ghana-school-mgmt-2025-secure-key';

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
};

/**
 * Verify password against hash
 */
export const verifyPassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

/**
 * Encrypt sensitive data
 */
export const encryptData = (data) => {
  try {
    if (!data) return data;
    const encrypted = CryptoJS.AES.encrypt(data.toString(), ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Error encrypting data:', error);
    return data;
  }
};

/**
 * Decrypt sensitive data
 */
export const decryptData = (encryptedData) => {
  try {
    if (!encryptedData) return encryptedData;
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || encryptedData;
  } catch (error) {
    console.error('Error decrypting data:', error);
    return encryptedData;
  }
};

/**
 * Encrypt sensitive fields in user object
 */
export const encryptSensitiveFields = (userData) => {
  const sensitiveFields = ['phone', 'parentPhone', 'address', 'dateOfBirth'];
  const encrypted = { ...userData };
  
  sensitiveFields.forEach(field => {
    if (encrypted[field]) {
      encrypted[field] = encryptData(encrypted[field]);
    }
  });
  
  return encrypted;
};

/**
 * Decrypt sensitive fields in user object
 */
export const decryptSensitiveFields = (userData) => {
  const sensitiveFields = ['phone', 'parentPhone', 'address', 'dateOfBirth'];
  const decrypted = { ...userData };
  
  sensitiveFields.forEach(field => {
    if (decrypted[field]) {
      try {
        decrypted[field] = decryptData(decrypted[field]);
      } catch (error) {
        // If decryption fails, keep original value (might be plain text from old data)
        console.warn(`Failed to decrypt ${field}, keeping original value`);
      }
    }
  });
  
  return decrypted;
};
