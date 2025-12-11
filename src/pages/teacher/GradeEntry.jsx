import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { MdDescription, MdSave, MdCheck } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import { CLASSES, GRADING_SCALE, getSubjectsByClass } from '../../constants/ghanaEducation';
import { readAllRecords, createRecord, updateRecord } from '../../utils/database';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export const GradeEntry = () => {
  const { userProfile } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(false);

  const loadStudents = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const result = await readAllRecords('users');
      if (result.success) {
        // Convert Firebase object to array and filter students
        const allUsers = Object.values(result.data || {});
        const className = CLASSES.find(cls => cls.id === selectedClass)?.name || selectedClass;
        const classStudents = allUsers.filter(s => s.role === 'student' && s.class === className);
        setStudents(classStudents);

        // Initialize grades
        const gradesState = {};
        classStudents.forEach(student => {
          gradesState[student.id] = '';
        });
        setGrades(gradesState);
      }
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedClass]);

  const handleGradeChange = (studentId, grade) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: grade
    }));
  };

  const saveGrades = async () => {
    try {
      const gradeRecords = students.map(student => ({
        studentId: student.id,
        classId: selectedClass,
        subject: selectedSubject,
        grade: grades[student.id] || '',
        teacherId: userProfile.id,
        submitted: true,
        submittedAt: Date.now()
      }));

      for (const record of gradeRecords) {
        await createRecord('grades', record);
      }

      toast.success('Grades saved successfully');
    } catch (error) {
      toast.error('Failed to save grades');
    }
  };

  const myClasses = userProfile?.classes || [];

  return (
    <DashboardLayout title="Grade Entry">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Grade Entry</h2>
          <p className="text-gray-600">Enter grades for your students</p>
        </div>

        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input w-full"
              >
                <option value="">Choose a class...</option>
                {CLASSES.filter(cls => myClasses.includes(cls.id)).map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="input w-full"
              >
                <option value="">Choose a subject...</option>
                {selectedClass && getSubjectsByClass(selectedClass).map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : students.length > 0 ? (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Students ({students.length})</h3>
              <button onClick={saveGrades} className="btn btn-primary flex items-center gap-2">
                <MdSave size={18} />
                Save Grades
              </button>
            </div>

            <div className="space-y-2">
              {students.map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-600">
                        {student.fullName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{student.fullName}</p>
                      <p className="text-sm text-gray-600">{student.studentId}</p>
                    </div>
                  </div>
                  <select
                    value={grades[student.id] || ''}
                    onChange={(e) => handleGradeChange(student.id, e.target.value)}
                    className="input w-24"
                  >
                    <option value="">Grade</option>
                    {GRADING_SCALE.map(grade => (
                      <option key={grade.grade} value={grade.grade}>{grade.grade}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ) : selectedClass ? (
          <div className="card text-center py-12">
            <MdDescription className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600">No students are enrolled in this class.</p>
          </div>
        ) : (
          <div className="card text-center py-12">
            <MdDescription className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select Class and Subject</h3>
            <p className="text-gray-600">Choose a class and subject to enter grades.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
