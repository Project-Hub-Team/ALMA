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


export const Reports = () => {
  const [reportType, setReportType] = useState('students');
  const [loading, setLoading] = useState(false);

  const generateReport = () => {
    toast.success(`Generating ${reportType} report...`);
    // Report generation logic here
  };

  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
          <p className="text-gray-600">Generate comprehensive reports and analytics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setReportType('students')}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MdPeople className="text-blue-600" size={24} />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2">Student Reports</h3>
            <p className="text-sm text-gray-600 mb-4">Enrollment, demographics, and performance reports</p>
            <button className="btn btn-secondary w-full text-sm">Generate Report</button>
          </div>

          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setReportType('academic')}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MdSchool className="text-green-600" size={24} />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2">Academic Reports</h3>
            <p className="text-sm text-gray-600 mb-4">Class performance, grades, and assessments</p>
            <button className="btn btn-secondary w-full text-sm">Generate Report</button>
          </div>

          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setReportType('attendance')}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MdUserCheck className="text-purple-600" size={24} />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2">Attendance Reports</h3>
            <p className="text-sm text-gray-600 mb-4">Student and teacher attendance analytics</p>
            <button className="btn btn-secondary w-full text-sm">Generate Report</button>
          </div>

          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setReportType('financial')}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <MdAttachMoney className="text-yellow-600" size={24} />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2">Financial Reports</h3>
            <p className="text-sm text-gray-600 mb-4">Fee collection, payments, and revenue</p>
            <button className="btn btn-secondary w-full text-sm">Generate Report</button>
          </div>

          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setReportType('teacher')}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <MdMenuBook className="text-red-600" size={24} />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2">Teacher Reports</h3>
            <p className="text-sm text-gray-600 mb-4">Teaching assignments and performance</p>
            <button className="btn btn-secondary w-full text-sm">Generate Report</button>
          </div>

          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setReportType('custom')}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <MdTrendingUp className="text-indigo-600" size={24} />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2">Custom Reports</h3>
            <p className="text-sm text-gray-600 mb-4">Build your own custom analytics</p>
            <button className="btn btn-secondary w-full text-sm">Create Custom</button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold mb-4">Quick Export</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn btn-primary flex items-center justify-center gap-2">
              <MdDownload size={18} />
              Export to PDF
            </button>
            <button className="btn btn-primary flex items-center justify-center gap-2">
              <MdDownload size={18} />
              Export to Excel
            </button>
            <button className="btn btn-primary flex items-center justify-center gap-2">
              <MdDownload size={18} />
              Export to CSV
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default Reports;