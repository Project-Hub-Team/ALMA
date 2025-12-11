import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdDownload, MdVisibility, MdPersonAdd, MdAttachMoney, MdPeople, MdSchool, MdPersonAdd as MdUserCheck, MdMenuBook, MdTrendingUp, MdContentCopy } from 'react-icons/md';
import { getAllStudents, createStudent, updateStudent, deleteStudent } from '../../Controller/studentsController';
import { readAllRecords, createRecord, updateRecord, deleteRecord } from '../../utils/database';
import { CLASSES, getSubjectsByClass } from '../../constants/ghanaEducation';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { secondaryAuth, database } from '../../config/firebase.config';
import { ref, remove } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { hashPassword, encryptSensitiveFields, decryptSensitiveFields } from '../../Controller/encryption';

export const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    dateOfBirth: '',
    gender: '',
    class: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: ''
  });
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newStudentCredentials, setNewStudentCredentials] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const result = await getAllStudents();
      if (result.success) {
        // Decrypt sensitive fields for display
        const decryptedStudents = result.data.map(student => decryptSensitiveFields(student));
        setStudents(decryptedStudents || []);
      }
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      dateOfBirth: '',
      gender: '',
      class: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      address: ''
    });
    setShowAddModal(true);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setFormData({
      fullName: student.fullName || '',
      email: student.email || '',
      password: '',
      dateOfBirth: student.dateOfBirth || '',
      gender: student.gender || '',
      class: student.class || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      parentEmail: student.parentEmail || '',
      address: student.address || ''
    });
    setShowAddModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!editingStudent && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (editingStudent && formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      // Hash password if provided
      const hashedPassword = formData.password ? await hashPassword(formData.password) : null;
      
      // Encrypt sensitive fields
      const encryptedData = encryptSensitiveFields(formData);
      
      const studentData = {
        ...encryptedData,
        password: hashedPassword || formData.password,
        role: 'student',
        isActive: true,
        studentId: editingStudent?.studentId || `STU${Date.now()}`,
        displayName: formData.fullName
      };

      if (editingStudent) {
        // Remove password if not changed
        if (!formData.password) {
          delete studentData.password;
        } else {
          // Create auth account if student doesn't have uid
          if (!editingStudent.uid) {
            try {
              const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
              studentData.uid = userCredential.user.uid;
              await secondaryAuth.signOut();
              toast.success('Firebase Auth account created for student');
            } catch (authError) {
              console.error('Auth creation error:', authError);
              toast.warning('Updated student but could not create auth account');
            }
          }
        }
        await updateRecord(`users/${editingStudent.id}`, studentData);
        
        // Update class-student relationship
        const studentId = editingStudent.uid || editingStudent.id;
        
        // Remove from old class if changed
        if (editingStudent.class !== formData.class) {
          const oldClassId = CLASSES.find(c => c.name === editingStudent.class || c.id === editingStudent.class)?.id;
          if (oldClassId) {
            await remove(ref(database, `class-students/${oldClassId}/${studentId}`));
          }
        }
        
        // Add to new class
        const newClassId = CLASSES.find(c => c.name === formData.class)?.id || formData.class;
        if (newClassId) {
          await updateRecord(`class-students/${newClassId}/${studentId}`, {
            studentId,
            studentName: formData.fullName,
            studentNumber: studentData.studentId,
            enrolledAt: Date.now()
          });
        }
        
        toast.success('Student updated successfully');
        setShowAddModal(false);
        loadStudents();
      } else {
        try {
          // Create Firebase Auth account using secondary auth
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
          const uid = userCredential.user.uid;
          
          studentData.uid = uid;
          studentData.id = uid;
          
          // Save to database using UID as key (prevents duplicates)
          await updateRecord(`users/${uid}`, studentData);
          
          // Update class-student relationship
          const classId = CLASSES.find(c => c.name === formData.class)?.id || formData.class;
          if (classId) {
            await updateRecord(`class-students/${classId}/${uid}`, {
              studentId: uid,
              studentName: formData.fullName,
              studentNumber: studentData.studentId,
              enrolledAt: Date.now()
            });
          }
          
          // Sign out secondary auth
          await secondaryAuth.signOut();
          
          // Store credentials to show to admin
          setNewStudentCredentials({
            name: formData.fullName,
            email: formData.email,
            password: formData.password,
            studentId: studentData.studentId
          });
          
          setShowAddModal(false);
          setShowCredentialsModal(true);
          toast.success('Student account created successfully');
          loadStudents();
        } catch (authError) {
          console.error('Auth creation error:', authError);
          if (authError.code === 'auth/email-already-in-use') {
            toast.error('Email already exists. Use a different email.');
          } else {
            await createRecord('users', studentData);
            toast.warning('Student saved but Firebase Auth account creation failed.');
            loadStudents();
          }
        }
      }
    } catch (error) {
      console.error('Save student error:', error);
      toast.error(error.message || 'Failed to save student');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteStudent(studentId);
        toast.success('Student deleted successfully');
        loadStudents();
      } catch (error) {
        toast.error('Failed to delete student');
      }
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || student.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  if (loading) {
    return (
      <DashboardLayout title="Student Management">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Management">
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Students</h2>
            <p className="text-gray-600">Manage student records and enrollment</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary flex items-center gap-2">
              <MdDownload size={18} />
              Export
            </button>
            <button onClick={handleAddStudent} className="btn btn-primary flex items-center gap-2">
              <MdAdd size={18} />
              Add Student
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-2xl font-bold text-gray-800">{students.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {students.filter(s => s.isActive !== false).length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Male</p>
            <p className="text-2xl font-bold text-blue-600">
              {students.filter(s => s.gender === 'Male').length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Female</p>
            <p className="text-2xl font-bold text-pink-600">
              {students.filter(s => s.gender === 'Female').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input"
            >
              <option value="all">All Classes</option>
              {CLASSES.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <MdPersonAdd className="mx-auto mb-3 text-gray-400" size={48} />
                      <p className="text-lg font-medium">No students found</p>
                      <p className="text-sm">Add your first student to get started</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {CLASSES.find(c => c.id === student.class || c.name === student.class)?.name || student.class}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.gender}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.parentPhone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          student.isActive !== false
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditStudent(student)} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <MdEdit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteStudent(student.id)} 
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <MdDelete size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </h3>
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    required
                    disabled={editingStudent ? true : false}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {!editingStudent && '*'}
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  placeholder={editingStudent ? "Leave blank to keep current password" : "Enter login password"}
                  required={!editingStudent}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingStudent ? "Only fill if you want to change the password" : "Minimum 6 characters"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class *
                  </label>
                  <select
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select Class</option>
                    {CLASSES.map(cls => (
                      <option key={cls.id} value={cls.name}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent/Guardian Name *
                  </label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="input"
                    placeholder="+233 XX XXX XXXX"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Email
                  </label>
                  <input
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                  rows="3"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingStudent ? 'Update Student' : 'Add Student'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Credentials Modal */}
      {showCredentialsModal && newStudentCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <MdUserCheck size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Student Account Created!
              </h3>
              <p className="text-sm text-gray-600">
                Share these login credentials with the student/parent
              </p>
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Student Name</label>
                <p className="text-sm font-semibold text-gray-800">{newStudentCredentials.name}</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Student ID</label>
                <p className="text-sm font-semibold text-gray-800">{newStudentCredentials.studentId}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Login Email</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-blue-600 flex-1">{newStudentCredentials.email}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newStudentCredentials.email);
                      toast.success('Email copied!');
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded"
                    title="Copy email"
                  >
                    <MdContentCopy size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Temporary Password</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-red-600 flex-1">{newStudentCredentials.password}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newStudentCredentials.password);
                      toast.success('Password copied!');
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded"
                    title="Copy password"
                  >
                    <MdContentCopy size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Important:</strong> Save these credentials now! The student should change their password after first login.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  const credentials = `Student Login Credentials\n\nName: ${newStudentCredentials.name}\nStudent ID: ${newStudentCredentials.studentId}\nEmail: ${newStudentCredentials.email}\nPassword: ${newStudentCredentials.password}`;
                  navigator.clipboard.writeText(credentials);
                  toast.success('All credentials copied to clipboard!');
                }}
                className="btn btn-secondary flex-1"
              >
                Copy All
              </button>
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setNewStudentCredentials(null);
                }}
                className="btn btn-primary flex-1"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
