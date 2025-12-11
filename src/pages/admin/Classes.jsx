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


export const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const result = await readAllRecords('classes');
      if (result.success) {
        setClasses(result.data || []);
      }
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Class Management">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Class Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Classes</h2>
            <p className="text-gray-600">Manage class assignments and schedules</p>
          </div>
          <button className="btn btn-primary flex items-center gap-2">
            <MdAdd size={18} />
            Create Class
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CLASSES.map(classInfo => {
            const classData = classes.find(c => c.classId === classInfo.id) || {};
            const studentCount = classData.studentCount || 0;
            
            return (
              <div key={classInfo.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{classInfo.name}</h3>
                    <p className="text-sm text-gray-600">{classInfo.level}</p>
                  </div>
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    {studentCount} students
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Class Teacher:</span>
                    <span className="font-medium">{classData.teacher || 'Not assigned'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subjects:</span>
                    <span className="font-medium">{classInfo.subjects?.length || 0}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn btn-secondary flex-1 text-sm">
                    <MdVisibility size={16} className="inline mr-1" />
                    View
                  </button>
                  <button className="btn btn-primary flex-1 text-sm">
                    <MdEdit size={16} className="inline mr-1" />
                    Manage
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};
export default Classes;