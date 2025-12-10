// Admin Pages - Full implementations

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdDownload, MdCloudUpload, MdVisibility, MdPersonAdd, MdAttachMoney, MdPeople, MdSchool, MdPersonAdd as MdUserCheck, MdMenuBook, MdTrendingUp, MdContentCopy } from 'react-icons/md';
import { getAllStudents, createStudent, updateStudent, deleteStudent, getAllTeachers, readAllRecords, createRecord, updateRecord, deleteRecord } from '../../utils/database';
import { CLASSES, getSubjectsByClass } from '../../constants/ghanaEducation';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { secondaryAuth, database } from '../../config/firebase.config';
import { ref, remove } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { hashPassword, encryptSensitiveFields, decryptSensitiveFields } from '../../utils/encryption';

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

export const Teachers = () => {
  const { currentUser } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newTeacherCredentials, setNewTeacherCredentials] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    qualification: '',
    subjects: [],
    classes: [],
    employeeId: '',
    joiningDate: '',
    address: ''
  });

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const result = await getAllTeachers();
      if (result.success) {
        // Decrypt sensitive fields for display
        const decryptedTeachers = result.data.map(teacher => decryptSensitiveFields(teacher));
        setTeachers(decryptedTeachers || []);
      }
    } catch (error) {
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      gender: '',
      dateOfBirth: '',
      qualification: '',
      subjects: [],
      classes: [],
      employeeId: '',
      joiningDate: '',
      address: ''
    });
    setShowAddModal(true);
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    // Data is already decrypted from loadTeachers
    setFormData({
      fullName: teacher.fullName || '',
      email: teacher.email || '',
      password: '',
      phone: teacher.phone || '',
      gender: teacher.gender || '',
      dateOfBirth: teacher.dateOfBirth || '',
      qualification: teacher.qualification || '',
      subjects: teacher.subjects || [],
      classes: teacher.classes || [],
      employeeId: teacher.employeeId || '',
      joiningDate: teacher.joiningDate || '',
      address: teacher.address || ''
    });
    setShowAddModal(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.classes.length === 0) {
      toast.error('Please assign at least one class');
      return;
    }
    if (formData.subjects.length === 0) {
      toast.error('Please add at least one subject');
      return;
    }
    if (!editingTeacher && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (editingTeacher && formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      // Hash the password
      const hashedPassword = formData.password ? await hashPassword(formData.password) : null;
      
      // Encrypt sensitive fields
      const encryptedData = encryptSensitiveFields(formData);
      
      const teacherData = {
        ...encryptedData,
        password: hashedPassword || formData.password,
        role: 'teacher',
        isActive: true,
        employeeId: formData.employeeId || `TCH${Date.now()}`,
        displayName: formData.fullName,
        status: 'active'
      };

      if (editingTeacher) {
        // Remove password from update data if it wasn't changed
        if (!formData.password) {
          delete teacherData.password;
        } else {
          // If password is being changed and teacher doesn't have uid, create auth account
          if (!editingTeacher.uid) {
            try {
              const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
              teacherData.uid = userCredential.user.uid;
              await secondaryAuth.signOut();
              toast.success('Firebase Auth account created for teacher');
            } catch (authError) {
              console.error('Auth creation error:', authError);
              toast.warning('Updated teacher but could not create auth account');
            }
          }
        }
        await updateRecord(`users/${editingTeacher.id}`, teacherData);
        
        // Update class-teacher relationships
        const teacherId = editingTeacher.uid || editingTeacher.id;
        
        // Remove old class assignments (we'll re-add the current ones)
        if (editingTeacher.classes) {
          for (const oldClassId of editingTeacher.classes) {
            await remove(ref(database, `class-teachers/${oldClassId}/${teacherId}`));
          }
        }
        
        // Add new class assignments
        for (const classId of formData.classes) {
          await updateRecord(`class-teachers/${classId}/${teacherId}`, {
            teacherId,
            teacherName: formData.fullName,
            employeeId: teacherData.employeeId,
            subjects: formData.subjects,
            assignedAt: Date.now()
          });
        }
        
        // Remove old subject assignments
        if (editingTeacher.subjects) {
          for (const oldSubject of editingTeacher.subjects) {
            await remove(ref(database, `subject-teachers/${oldSubject}/${teacherId}`));
          }
        }
        
        // Add new subject assignments
        for (const subject of formData.subjects) {
          await updateRecord(`subject-teachers/${subject}/${teacherId}`, {
            teacherId,
            teacherName: formData.fullName,
            employeeId: teacherData.employeeId,
            classes: formData.classes,
            assignedAt: Date.now()
          });
        }
        
        toast.success('Teacher updated successfully');
        setShowAddModal(false);
        loadTeachers();
      } else {
        try {
          // Create Firebase Auth account using secondary auth (won't log out admin)
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
          const uid = userCredential.user.uid;
          
          // Add uid to teacher data
          teacherData.uid = uid;
          teacherData.id = uid;
          
          // Save to database using UID as key (prevents duplicates)
          await updateRecord(`users/${uid}`, teacherData);
          
          // Update class-teacher relationships
          for (const classId of formData.classes) {
            await updateRecord(`class-teachers/${classId}/${uid}`, {
              teacherId: uid,
              teacherName: formData.fullName,
              employeeId: teacherData.employeeId,
              subjects: formData.subjects,
              assignedAt: Date.now()
            });
          }
          
          // Update subject-teacher relationships
          for (const subject of formData.subjects) {
            await updateRecord(`subject-teachers/${subject}/${uid}`, {
              teacherId: uid,
              teacherName: formData.fullName,
              employeeId: teacherData.employeeId,
              classes: formData.classes,
              assignedAt: Date.now()
            });
          }
          
          // Sign out the secondary auth to prevent session issues
          await secondaryAuth.signOut();
          
          // Store credentials to show to admin
          setNewTeacherCredentials({
            name: formData.fullName,
            email: formData.email,
            password: formData.password,
            employeeId: teacherData.employeeId
          });
          
          setShowAddModal(false);
          setShowCredentialsModal(true);
          toast.success('Teacher account created successfully');
          loadTeachers();
        } catch (authError) {
          console.error('Auth creation error:', authError);
          // If secondary auth fails, save without uid and let admin know
          if (authError.code === 'auth/email-already-in-use') {
            toast.error('Email already exists in Firebase Auth. Use a different email.');
          } else {
            // Save to database anyway for admin to manage
            await createRecord('users', teacherData);
            toast.warning('Teacher saved to database but Firebase Auth account creation failed. They may need to reset their password.');
            loadTeachers();
          }
        }
      }
    } catch (error) {
      console.error('Save teacher error:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already exists. Please use a different email.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. Use at least 6 characters.');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error(error.message || 'Failed to save teacher');
      }
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await deleteRecord(`users/${teacherId}`);
        toast.success('Teacher deleted successfully');
        loadTeachers();
      } catch (error) {
        toast.error('Failed to delete teacher');
      }
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout title="Teacher Management">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Teacher Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Teachers</h2>
            <p className="text-gray-600">Manage teacher records and assignments</p>
          </div>
          <button onClick={handleAddTeacher} className="btn btn-primary flex items-center gap-2">
            <MdAdd size={18} />
            Add Teacher
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-gray-600">Total Teachers</p>
            <p className="text-2xl font-bold text-gray-800">{teachers.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {teachers.filter(t => t.isActive !== false).length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Male</p>
            <p className="text-2xl font-bold text-blue-600">
              {teachers.filter(t => t.gender === 'Male').length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Female</p>
            <p className="text-2xl font-bold text-pink-600">
              {teachers.filter(t => t.gender === 'Female').length}
            </p>
          </div>
        </div>

        {/* Search Filter */}
        <div className="card">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search teachers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>

        {/* Teachers Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subjects</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <MdPersonAdd className="mx-auto mb-3 text-gray-400" size={48} />
                      <p className="text-lg font-medium">No teachers found</p>
                      <p className="text-sm">Add your first teacher to get started</p>
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map(teacher => (
                    <tr key={teacher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {teacher.employeeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.fullName || teacher.displayName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {teacher.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {teacher.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {teacher.classes && teacher.classes.length > 0 ? (
                            teacher.classes.map(classId => {
                              const classInfo = CLASSES.find(c => c.id === classId);
                              return (
                                <span key={classId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {classInfo?.name || classId}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-gray-500">No classes</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects && teacher.subjects.length > 0 ? (
                            teacher.subjects.map((subject, idx) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                {subject}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">No subjects</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          teacher.isActive !== false
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {teacher.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditTeacher(teacher)} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <MdEdit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTeacher(teacher.id)} 
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
            </h3>
            <form onSubmit={handleSaveTeacher} className="space-y-4">
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
                    disabled={editingTeacher ? true : false}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {!editingTeacher && '*'}
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  placeholder={editingTeacher ? "Leave blank to keep current password" : "Enter login password"}
                  required={!editingTeacher}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingTeacher ? "Only fill if you want to change the password" : "Minimum 6 characters"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    placeholder="+233 XX XXX XXXX"
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
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="input"
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualification *
                  </label>
                  <select
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select Qualification</option>
                    <option value="Diploma in Education">Diploma in Education</option>
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Date *
                  </label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classes Assigned *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-md bg-gray-50 max-h-48 overflow-y-auto">
                    {CLASSES.map(cls => (
                      <label key={cls.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.classes.includes(cls.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, classes: [...formData.classes, cls.id] });
                            } else {
                              setFormData({ ...formData, classes: formData.classes.filter(c => c !== cls.id) });
                            }
                          }}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm">{cls.name}</span>
                      </label>
                    ))}
                  </div>
                  {formData.classes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.classes.map(classId => {
                        const classInfo = CLASSES.find(c => c.id === classId);
                        return (
                          <span key={classId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {classInfo?.name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subjects Teaching *
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter subject name and press Add"
                        className="input flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = e.target.value.trim();
                            if (value && !formData.subjects.includes(value)) {
                              setFormData({ ...formData, subjects: [...formData.subjects, value] });
                              e.target.value = '';
                            }
                          }
                        }}
                        id="subjectInput"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('subjectInput');
                          const value = input.value.trim();
                          if (value && !formData.subjects.includes(value)) {
                            setFormData({ ...formData, subjects: [...formData.subjects, value] });
                            input.value = '';
                          }
                        }}
                        className="btn btn-secondary px-4"
                      >
                        <MdAdd size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {['Mathematics', 'English', 'Science', 'Social Studies', 'Computing', 'French', 'Physical Education', 'Creative Arts'].map(subject => (
                        <button
                          key={subject}
                          type="button"
                          onClick={() => {
                            if (!formData.subjects.includes(subject)) {
                              setFormData({ ...formData, subjects: [...formData.subjects, subject] });
                            }
                          }}
                          className="text-xs px-3 py-1 border rounded hover:bg-primary-50 hover:border-primary-500 text-left"
                        >
                          + {subject}
                        </button>
                      ))}
                    </div>
                    {formData.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.subjects.map((subject, idx) => (
                          <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1">
                            {subject}
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, subjects: formData.subjects.filter((_, i) => i !== idx) })}
                              className="text-green-900 hover:text-red-600 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
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
                  {editingTeacher ? 'Update Teacher' : 'Add Teacher'}
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

      {/* Teacher Credentials Modal */}
      {showCredentialsModal && newTeacherCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <MdUserCheck size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Teacher Account Created!
              </h3>
              <p className="text-sm text-gray-600">
                Share these login credentials with the teacher
              </p>
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Teacher Name</label>
                <p className="text-sm font-semibold text-gray-800">{newTeacherCredentials.name}</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Employee ID</label>
                <p className="text-sm font-semibold text-gray-800">{newTeacherCredentials.employeeId}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Login Email</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-blue-600 flex-1">{newTeacherCredentials.email}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newTeacherCredentials.email);
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
                  <p className="text-sm font-semibold text-red-600 flex-1">{newTeacherCredentials.password}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newTeacherCredentials.password);
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
                <strong>Important:</strong> Save these credentials now! The teacher should change their password after first login.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  const credentials = `Teacher Login Credentials\n\nName: ${newTeacherCredentials.name}\nEmployee ID: ${newTeacherCredentials.employeeId}\nEmail: ${newTeacherCredentials.email}\nPassword: ${newTeacherCredentials.password}`;
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
                  setNewTeacherCredentials(null);
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

export const Fees = () => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState('term1');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    studentName: '',
    amount: '',
    paymentMethod: 'cash',
    term: 'term1',
    feeType: 'tuition',
    transactionId: '',
    notes: ''
  });

  useEffect(() => {
    loadFees();
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const result = await getAllStudents();
      if (result.success) {
        setStudents(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load students');
    }
  };

  const loadFees = async () => {
    try {
      const result = await readAllRecords('fees');
      if (result.success) {
        setFees(result.data || []);
      }
    } catch (error) {
      toast.error('Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = () => {
    setPaymentForm({
      studentId: '',
      studentName: '',
      amount: '',
      paymentMethod: 'cash',
      term: selectedTerm,
      feeType: 'tuition',
      transactionId: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handleStudentSelect = (e) => {
    const studentId = e.target.value;
    const student = students.find(s => s.id === studentId);
    setPaymentForm({
      ...paymentForm,
      studentId,
      studentName: student ? student.fullName : ''
    });
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    try {
      const paymentData = {
        ...paymentForm,
        paidAmount: parseFloat(paymentForm.amount),
        amount: parseFloat(paymentForm.amount),
        status: 'paid',
        paymentDate: new Date().toISOString(),
        receiptId: `RCP${Date.now()}`
      };

      await createRecord('fees', paymentData);
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      loadFees();
    } catch (error) {
      console.error('Record payment error:', error);
      toast.error('Failed to record payment');
    }
  };

  const totalExpected = fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
  const totalPaid = fees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
  const totalOutstanding = totalExpected - totalPaid;

  if (loading) {
    return (
      <DashboardLayout title="Fee Management">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Fee Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Fee Management</h2>
            <p className="text-gray-600">Track fees, payments, and outstanding balances</p>
          </div>
          <button onClick={handleRecordPayment} className="btn btn-primary flex items-center gap-2">
            <MdAdd size={18} />
            Record Payment
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-gray-600">Total Expected</p>
            <p className="text-2xl font-bold text-gray-800">GH₵ {totalExpected.toLocaleString()}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">GH₵ {totalPaid.toLocaleString()}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Outstanding</p>
            <p className="text-2xl font-bold text-red-600">GH₵ {totalOutstanding.toLocaleString()}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Collection Rate</p>
            <p className="text-2xl font-bold text-blue-600">
              {totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0}%
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Payment Records</h3>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="input w-auto"
            >
              <option value="term1">Term 1</option>
              <option value="term2">Term 2</option>
              <option value="term3">Term 3</option>
            </select>
          </div>

          {fees.length === 0 ? (
            <div className="text-center py-12">
              <MdAttachMoney className="mx-auto mb-3 text-gray-400" size={48} />
              <p className="text-lg font-medium text-gray-700">No fee records found</p>
              <p className="text-sm text-gray-500">Fee records will appear here once payments are recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fees.map(fee => (
                    <tr key={fee.id}>
                      <td className="px-4 py-3 text-sm">{fee.studentName}</td>
                      <td className="px-4 py-3 text-sm">{fee.class}</td>
                      <td className="px-4 py-3 text-sm">GH₵ {fee.amount}</td>
                      <td className="px-4 py-3 text-sm text-green-600">GH₵ {fee.paidAmount || 0}</td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        GH₵ {fee.amount - (fee.paidAmount || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          fee.paidAmount >= fee.amount
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {fee.paidAmount >= fee.amount ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Record Payment</h3>
            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Student *
                </label>
                <select
                  value={paymentForm.studentId}
                  onChange={handleStudentSelect}
                  className="input"
                  required
                >
                  <option value="">Choose a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} - {student.class}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Type *
                  </label>
                  <select
                    value={paymentForm.feeType}
                    onChange={(e) => setPaymentForm({ ...paymentForm, feeType: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="tuition">Tuition Fee</option>
                    <option value="examination">Examination Fee</option>
                    <option value="library">Library Fee</option>
                    <option value="sports">Sports Fee</option>
                    <option value="uniform">Uniform Fee</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Term *
                  </label>
                  <select
                    value={paymentForm.term}
                    onChange={(e) => setPaymentForm({ ...paymentForm, term: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="term1">Term 1</option>
                    <option value="term2">Term 2</option>
                    <option value="term3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (GH₵) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="input"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                  className="input"
                  placeholder="For mobile money or bank transfers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Additional payment details or remarks"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

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
