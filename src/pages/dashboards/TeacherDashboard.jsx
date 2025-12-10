import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { MdMenuBook, MdPersonAdd, MdDescription, MdPeople } from 'react-icons/md';
import { readAllRecords } from '../../utils/database';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const TeacherDashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    myClasses: 0,
    totalStudents: 0,
    pendingGrades: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [userProfile?.id]);

  const loadDashboardData = async () => {
    if (!userProfile?.id) return;

    try {
      const [classesResult, gradesResult, attendanceResult] = await Promise.all([
        readAllRecords('classes').catch(() => ({ success: true, data: [] })),
        readAllRecords('grades').catch(() => ({ success: true, data: [] })),
        readAllRecords('attendance').catch(() => ({ success: true, data: [] }))
      ]);

      // Filter classes assigned to this teacher
      const myClasses = classesResult.data?.filter(
        c => c.teacherId === userProfile.id || c.formTeacher === userProfile.id
      ) || [];

      // Count total students in teacher's classes
      let totalStudents = 0;
      myClasses.forEach(cls => {
        totalStudents += cls.students?.length || 0;
      });

      // Count pending grades (grades not yet submitted)
      const pendingGrades = gradesResult.data?.filter(
        g => g.teacherId === userProfile.id && !g.submitted
      ).length || 0;

      // Calculate attendance rate
      const teacherAttendance = attendanceResult.data?.filter(
        a => a.teacherId === userProfile.id
      ) || [];
      
      let attendanceRate = 0;
      if (teacherAttendance.length > 0) {
        const totalRecords = teacherAttendance.length;
        const presentRecords = teacherAttendance.filter(a => a.status === 'present').length;
        attendanceRate = Math.round((presentRecords / totalRecords) * 100);
      }

      setStats({
        myClasses: myClasses.length,
        totalStudents,
        pendingGrades,
        attendanceRate
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Set default stats on error
      setStats({
        myClasses: 0,
        totalStudents: 0,
        pendingGrades: 0,
        attendanceRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Teacher Dashboard">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Teacher Dashboard">
      <div 
        className="space-y-6 min-h-screen bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.90), rgba(255, 255, 255, 0.90)), url('/dashboard welcome banner.jpeg')`
        }}
      >
        <div 
          className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white bg-cover bg-center relative overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(22, 163, 74, 0.85), rgba(21, 128, 61, 0.85)), url('/dashboard welcome banner.jpeg')`
          }}
        >
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Teacher Dashboard</h2>
            <p className="text-primary-100">Manage your classes, attendance, and grading</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">My Classes</p>
                <p className="text-3xl font-bold text-gray-800">{stats.myClasses}</p>
              </div>
              <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                <MdMenuBook className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalStudents}</p>
              </div>
              <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                <MdPeople className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Grades</p>
                <p className="text-3xl font-bold text-gray-800">{stats.pendingGrades}</p>
              </div>
              <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                <MdDescription className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                <p className="text-3xl font-bold text-gray-800">{stats.attendanceRate}%</p>
              </div>
              <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                <MdPersonAdd className="text-white" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
