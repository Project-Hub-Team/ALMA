// Teacher pages - Full implementations
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { MdCalendarToday, MdCheck, MdClose, MdDownload, MdMenuBook, MdAdd, MdSave, MdPeople, MdDescription, MdCloudUpload } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import { readAllRecords, createRecord, updateRecord } from '../../utils/database';
import { CLASSES, GRADING_SCALE } from '../../constants/ghanaEducation';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { AttendanceHistory as AttendanceHistoryComponent } from './AttendanceHistory';

export const Attendance = () => {
  const { userProfile } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
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
        
        // Initialize attendance state
        const attendanceState = {};
        classStudents.forEach(student => {
          attendanceState[student.id] = ''; // Default to empty, not present
        });
        setAttendance(attendanceState);
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

  const markAttendance = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendance = async () => {
    try {
      const attendanceRecord = {
        classId: selectedClass,
        date: selectedDate,
        teacherId: userProfile.uid,
        attendance: attendance,
        createdAt: Date.now()
      };
      
      await createRecord('attendance', attendanceRecord);
      toast.success('Attendance saved successfully');
    } catch (error) {
      toast.error('Failed to save attendance');
    }
  };

  return (
    <DashboardLayout title="Attendance">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mark Attendance</h2>
          <p className="text-gray-600">Record daily student attendance</p>
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
                {CLASSES.filter(cls => userProfile?.classes?.includes(cls.id)).map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : students.length > 0 ? (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Students ({students.length})</h3>
              <button onClick={saveAttendance} className="btn btn-primary flex items-center gap-2">
                <MdSave size={18} />
                Save Attendance
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAttendance(student.id, 'present')}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                        attendance[student.id] === 'present'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <MdCheck size={18} />
                      Present
                    </button>
                    <button
                      onClick={() => markAttendance(student.id, 'absent')}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                        attendance[student.id] === 'absent'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <MdClose size={18} />
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="card bg-green-50">
                <p className="text-sm text-green-700">Present</p>
                <p className="text-2xl font-bold text-green-600">
                  {Object.values(attendance).filter(a => a === 'present').length}
                </p>
              </div>
              <div className="card bg-red-50">
                <p className="text-sm text-red-700">Absent</p>
                <p className="text-2xl font-bold text-red-600">
                  {Object.values(attendance).filter(a => a === 'absent').length}
                </p>
              </div>
              <div className="card bg-blue-50">
                <p className="text-sm text-blue-700">Attendance Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {students.length > 0 
                    ? Math.round((Object.values(attendance).filter(a => a === 'present').length / students.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        ) : selectedClass && (
          <div className="card text-center py-12">
            <MdPeople className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-lg font-medium text-gray-700">No students found</p>
            <p className="text-sm text-gray-500">This class has no enrolled students</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export const GradeEntry = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('classwork');
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(false);

  const loadStudents = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const result = await readAllRecords('students');
      if (result.success) {
        const classStudents = result.data.filter(s => s.class === selectedClass);
        setStudents(classStudents);
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

  const updateGrade = (studentId, score) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: score
    }));
  };

  const saveGrades = async () => {
    try {
      const gradeRecord = {
        classId: selectedClass,
        subject: selectedSubject,
        assessmentType: selectedAssessment,
        grades: grades,
        createdAt: Date.now()
      };
      
      await createRecord('grades', gradeRecord);
      toast.success('Grades saved successfully');
    } catch (error) {
      toast.error('Failed to save grades');
    }
  };

  const classSubjects = selectedClass ? CLASSES.find(c => c.id === selectedClass)?.subjects || [] : [];

  return (
    <DashboardLayout title="Grade Entry">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Grade Entry</h2>
          <p className="text-gray-600">Enter student assessment scores</p>
        </div>

        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input w-full"
              >
                <option value="">Choose a class...</option>
                {CLASSES.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="input w-full"
                disabled={!selectedClass}
              >
                <option value="">Choose a subject...</option>
                {classSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Type</label>
              <select
                value={selectedAssessment}
                onChange={(e) => setSelectedAssessment(e.target.value)}
                className="input w-full"
              >
                <option value="classwork">Class Work</option>
                <option value="homework">Home Work</option>
                <option value="exam">Exam</option>
                <option value="project">Project</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : students.length > 0 && selectedSubject ? (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Enter Scores</h3>
              <button onClick={saveGrades} className="btn btn-primary flex items-center gap-2">
                <MdSave size={18} />
                Save Grades
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score (0-100)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map(student => {
                    const score = grades[student.id] || '';
                    const gradeInfo = GRADING_SCALE.find(g => 
                      score >= g.minScore && score <= g.maxScore
                    );
                    
                    return (
                      <tr key={student.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-primary-600">
                                {student.fullName?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{student.fullName}</p>
                              <p className="text-xs text-gray-500">{student.studentId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(e) => updateGrade(student.id, parseInt(e.target.value))}
                            className="input w-32"
                            placeholder="0-100"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {gradeInfo && (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              gradeInfo.grade.startsWith('A') || gradeInfo.grade.startsWith('B')
                                ? 'bg-green-100 text-green-800'
                                : gradeInfo.grade.startsWith('C') || gradeInfo.grade.startsWith('D')
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {gradeInfo.grade} - {gradeInfo.interpretation}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <MdDescription className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-lg font-medium text-gray-700">Select class and subject</p>
            <p className="text-sm text-gray-500">Choose a class and subject to enter grades</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export const LessonNotes = () => {
  const [notes, setNotes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const result = await readAllRecords('lessonNotes');
      if (result.success) {
        setNotes(result.data || []);
      }
    } catch (error) {
      toast.error('Failed to load lesson notes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Lesson Notes">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Lesson Notes</h2>
            <p className="text-gray-600">Upload and manage teaching materials</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary flex items-center gap-2">
            <MdAdd size={18} />
            Upload Note
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : notes.length === 0 ? (
          <div className="card text-center py-12">
            <MdMenuBook className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-lg font-medium text-gray-700">No lesson notes yet</p>
            <p className="text-sm text-gray-500">Upload your first lesson note to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map(note => (
              <div key={note.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <MdMenuBook className="text-primary-600" size={24} />
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-2">{note.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{note.subject}</p>
                <p className="text-sm text-gray-600 mb-4">Class: {note.class}</p>
                <div className="flex gap-2">
                  <button className="btn btn-secondary flex-1 text-sm">
                    <MdDownload size={16} className="inline mr-1" />
                    Download
                  </button>
                  <button className="btn btn-primary flex-1 text-sm">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Upload Lesson Note</h3>
            <p className="text-gray-600 mb-4">
              Lesson note upload form coming soon. Use Firebase console for now.
            </p>
            <button onClick={() => setShowAddModal(false)} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export const MyClasses = () => {
  const { userProfile } = useAuth();
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyClasses();
  }, []);

  const loadMyClasses = async () => {
    try {
      // Load classes assigned to this teacher
      const result = await readAllRecords('classes');
      if (result.success) {
        const teacherClasses = result.data.filter(c => c.teacherId === userProfile.uid);
        setMyClasses(teacherClasses);
      }
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Classes">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Classes">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Classes</h2>
          <p className="text-gray-600">View and manage your assigned classes</p>
        </div>

        {myClasses.length === 0 ? (
          <div className="card text-center py-12">
            <MdPeople className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-lg font-medium text-gray-700">No classes assigned</p>
            <p className="text-sm text-gray-500">Contact your administrator to get class assignments</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myClasses.map(classInfo => (
              <div key={classInfo.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{classInfo.name}</h3>
                    <p className="text-sm text-gray-600">{classInfo.level}</p>
                  </div>
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    {classInfo.studentCount || 0} students
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subjects:</span>
                    <span className="font-medium">{classInfo.subjects?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Attendance Rate:</span>
                    <span className="font-medium text-green-600">{classInfo.attendanceRate || 0}%</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn btn-secondary flex-1 text-sm">
                    View Students
                  </button>
                  <button className="btn btn-primary flex-1 text-sm">
                    Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export { AttendanceHistoryComponent as AttendanceHistory };

