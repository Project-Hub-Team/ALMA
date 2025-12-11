/**
 * Utility Functions
 */

import { GRADING_SCALE, getGrade } from '../constants/ghanaEducation';

// ============================================
// ID GENERATION
// ============================================

/**
 * Generate student ID
 * Format: STUD-YYYY-XXXXX
 */
export const generateStudentId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `STUD-${year}-${random}`;
};

/**
 * Generate teacher ID
 * Format: TCHR-YYYY-XXXXX
 */
export const generateTeacherId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `TCHR-${year}-${random}`;
};

/**
 * Generate voucher serial and PIN
 */
export const generateVoucher = () => {
  const serial = Math.random().toString(36).substring(2, 12).toUpperCase();
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  return { serial, pin };
};

/**
 * Generate receipt number
 * Format: RCP-YYYYMMDD-XXXXX
 */
export const generateReceiptNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(10000 + Math.random() * 90000);
  return `RCP-${year}${month}${day}-${random}`;
};

// ============================================
// GRADE CALCULATIONS
// ============================================

/**
 * Calculate total score for Primary/Preschool
 */
export const calculatePrimaryTotal = (scores) => {
  const {
    classwork = 0,
    homework = 0,
    project = 0,
    classTest = 0,
    exam = 0
  } = scores;
  
  // Weights: CW(20%) + HW(10%) + Proj(10%) + Test(20%) + Exam(40%)
  const total = (
    (classwork * 0.2) +
    (homework * 0.1) +
    (project * 0.1) +
    (classTest * 0.2) +
    (exam * 0.4)
  );
  
  return Math.round(total * 100) / 100;
};

/**
 * Calculate total score for JHS
 */
export const calculateJHSTotal = (classScore, examScore) => {
  // Class Score (30%) + Exam (70%)
  const total = (classScore * 0.3) + (examScore * 0.7);
  return Math.round(total * 100) / 100;
};

/**
 * Get grade information from score
 */
export const getGradeInfo = (score) => {
  return getGrade(score);
};

/**
 * Calculate class average
 */
export const calculateClassAverage = (results) => {
  if (!results || results.length === 0) return 0;
  
  const total = results.reduce((sum, result) => sum + result.totalScore, 0);
  return Math.round((total / results.length) * 100) / 100;
};

/**
 * Calculate student average
 */
export const calculateStudentAverage = (subjectResults) => {
  if (!subjectResults || subjectResults.length === 0) return 0;
  
  const total = subjectResults.reduce((sum, result) => sum + result.totalScore, 0);
  return Math.round((total / subjectResults.length) * 100) / 100;
};

/**
 * Get position in class
 */
export const getClassPosition = (studentAverage, classResults) => {
  const averages = classResults
    .map(r => calculateStudentAverage(r.results))
    .sort((a, b) => b - a);
  
  const position = averages.indexOf(studentAverage) + 1;
  return position;
};

/**
 * Format position with suffix (1st, 2nd, 3rd, etc.)
 */
export const formatPosition = (position) => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = position % 100;
  return position + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

// ============================================
// DATE/TIME UTILITIES
// ============================================

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format date to readable string
 */
export const formatDateReadable = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Get current academic year
 */
export const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Academic year starts in September (month 8)
  if (month >= 8) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
};

/**
 * Get current term
 */
export const getCurrentTerm = () => {
  const now = new Date();
  const month = now.getMonth();
  
  // Term 1: Sept-Dec (months 8-11)
  // Term 2: Jan-Apr (months 0-3)
  // Term 3: May-Aug (months 4-7)
  
  if (month >= 8 && month <= 11) {
    return 'term-1';
  } else if (month >= 0 && month <= 3) {
    return 'term-2';
  } else {
    return 'term-3';
  }
};

// ============================================
// VALIDATION
// ============================================

/**
 * Validate email
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone number (Ghana format)
 */
export const validateGhanaPhone = (phone) => {
  // Ghana phone numbers: 10 digits starting with 0
  const re = /^0\d{9}$/;
  return re.test(phone.replace(/\s/g, ''));
};

/**
 * Validate score (0-100)
 */
export const validateScore = (score) => {
  const num = parseFloat(score);
  return !isNaN(num) && num >= 0 && num <= 100;
};

// ============================================
// FORMATTING
// ============================================

/**
 * Format currency (Ghana Cedis)
 */
export const formatCurrency = (amount) => {
  return `GH₵ ${parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

/**
 * Format phone number
 */
export const formatPhone = (phone) => {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ============================================
// FILE UTILITIES
// ============================================

/**
 * Get file extension
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Validate file type
 */
export const validateFileType = (file, allowedTypes) => {
  const extension = getFileExtension(file.name).toLowerCase();
  return allowedTypes.includes(extension);
};

/**
 * Validate file size (in MB)
 */
export const validateFileSize = (file, maxSizeMB) => {
  const fileSizeMB = file.size / (1024 * 1024);
  return fileSizeMB <= maxSizeMB;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// ============================================
// SEARCH/FILTER
// ============================================

/**
 * Search in array of objects
 */
export const searchRecords = (records, searchTerm, fields) => {
  if (!searchTerm) return records;
  
  const term = searchTerm.toLowerCase();
  return records.filter(record => {
    return fields.some(field => {
      const value = getNestedValue(record, field);
      return value && value.toString().toLowerCase().includes(term);
    });
  });
};

/**
 * Get nested object value
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
};

/**
 * Sort records
 */
export const sortRecords = (records, field, direction = 'asc') => {
  return [...records].sort((a, b) => {
    const aVal = getNestedValue(a, field);
    const bVal = getNestedValue(b, field);
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// ============================================
// EXPORT UTILITIES
// ============================================

/**
 * Convert data to CSV
 */
export const convertToCSV = (data, headers) => {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header] || '';
      return `"${value}"`;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
};

/**
 * Download CSV file
 */
export const downloadCSV = (data, headers, filename) => {
  const csv = convertToCSV(data, headers);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};
