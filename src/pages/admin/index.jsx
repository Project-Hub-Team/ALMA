// Admin Pages - Full implementations

import { Students } from './Students';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdDownload, MdCloudUpload, MdVisibility, MdPersonAdd, MdAttachMoney, MdPeople, MdSchool, MdPersonAdd as MdUserCheck, MdMenuBook, MdTrendingUp, MdContentCopy } from 'react-icons/md';
import { getAllStudents, createStudent, updateStudent, deleteStudent } from '../../Controller/studentsController';
import { getAllTeachers } from '../../Controller/teachersController';
import { readAllRecords, createRecord, updateRecord, deleteRecord } from '../../utils/database';
import { CLASSES, getSubjectsByClass } from '../../constants/ghanaEducation';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { secondaryAuth, database } from '../../config/firebase.config';
import { ref, remove } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { hashPassword, encryptSensitiveFields, decryptSensitiveFields } from '../../Controller/encryption';

