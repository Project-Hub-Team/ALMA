/**
 * Firebase Realtime Database Configuration and Exports
 */

export { database } from '../config/firebase.config';

// Re-export CRUD operations
export * from './crud.js';

// Re-export all controllers
export * from '../Controller/studentsController.js';
export * from '../Controller/teachersController.js';
export * from '../Controller/attendanceController.js';
export * from '../Controller/resultsController.js';
export * from '../Controller/feesController.js';
export * from '../Controller/lessonNotesController.js';
export * from '../Controller/vouchersController.js';
export * from '../Controller/usersController.js';
export * from '../Controller/systemController.js';
export * from '../Controller/relationshipsController.js';