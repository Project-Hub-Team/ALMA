import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { MdBarChart, MdAttachMoney, MdMenuBook, MdPersonAdd } from 'react-icons/md';
import { readAllRecords } from '../../utils/database';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const StudentDashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    currentAverage: 0,
    feeBalance: 0,
    lessonNotes: 0,
    attendanceRate: 0
  });
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [userProfile?.id]);

  const loadDashboardData = async () => {
    if (!userProfile?.id) return;

    try {
      const [gradesResult, feesResult, notesResult, attendanceResult] = await Promise.all([
        readAllRecords('grades').catch(() => ({ success: true, data: [] })),
        readAllRecords('fees').catch(() => ({ success: true, data: [] })),
        readAllRecords('lessonNotes').catch(() => ({ success: true, data: [] })),
        readAllRecords('attendance').catch(() => ({ success: true, data: [] }))
      ]);

      // Calculate average grade
      const studentGrades = gradesResult.data?.filter(
        g => g.studentId === userProfile.id
      ) || [];
      
      let totalScore = 0;
      let gradeCount = 0;
      const recentGrades = [];
      
      studentGrades.forEach(grade => {
        const total = (grade.classScore || 0) + (grade.examScore || 0);
        if (total > 0) {
          totalScore += total;
          gradeCount++;
          
          // Collect recent results
          if (recentGrades.length < 5) {
            recentGrades.push({
              subject: grade.subject || 'N/A',
              classScore: grade.classScore || 0,
              examScore: grade.examScore || 0,
              total: total,
              grade: calculateGrade(total)
            });
          }
        }
      });

      const currentAverage = gradeCount > 0 ? (totalScore / gradeCount).toFixed(1) : 0;

      // Get fee balance
      const studentFee = feesResult.data?.find(
        f => f.studentId === userProfile.id
      );
      const feeBalance = studentFee?.balance || 0;

      // Count lesson notes available to student
      const availableNotes = notesResult.data?.filter(
        n => n.classId === userProfile.classId || n.isPublic
      ).length || 0;

      // Calculate attendance rate
      const studentAttendance = attendanceResult.data?.filter(
        a => a.studentId === userProfile.id
      ) || [];
      
      let attendanceRate = 0;
      if (studentAttendance.length > 0) {
        const presentCount = studentAttendance.filter(a => a.status === 'present').length;
        attendanceRate = Math.round((presentCount / studentAttendance.length) * 100);
      }

      setStats({
        currentAverage,
        feeBalance,
        lessonNotes: availableNotes,
        attendanceRate
      });
      setRecentResults(recentGrades);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrade = (score) => {
    if (score >= 80) return 'A1';
    if (score >= 70) return 'B2';
    if (score >= 65) return 'B3';
    if (score >= 60) return 'C4';
    if (score >= 55) return 'C5';
    if (score >= 50) return 'C6';
    if (score >= 45) return 'D7';
    if (score >= 40) return 'E8';
    return 'F9';
  };

  const getGradeBadgeClass = (grade) => {
    if (grade.startsWith('A') || grade.startsWith('B')) return 'badge-success';
    if (grade.startsWith('C')) return 'badge-warning';
    return 'badge-error';
  };

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Dashboard">
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
            <h2 className="text-2xl font-bold mb-2">Student Dashboard</h2>
            <p className="text-primary-100">View your academic progress and information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Average</p>
                <p className="text-3xl font-bold text-gray-800">{stats.currentAverage}%</p>
              </div>
              <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                <MdBarChart className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Fee Balance</p>
                <p className="text-3xl font-bold text-gray-800">GH₵ {stats.feeBalance}</p>
              </div>
              <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                <MdAttachMoney className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Lesson Notes</p>
                <p className="text-3xl font-bold text-gray-800">{stats.lessonNotes}</p>
              </div>
              <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                <MdMenuBook className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Attendance</p>
                <p className="text-3xl font-bold text-gray-800">{stats.attendanceRate}%</p>
              </div>
              <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                <MdPersonAdd className="text-white" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-header">Recent Results</h3>
          <div className="overflow-x-auto">
            {recentResults.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No results available yet</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Class Score</th>
                    <th>Exam Score</th>
                    <th>Total</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {recentResults.map((result, index) => (
                    <tr key={index}>
                      <td>{result.subject}</td>
                      <td>{result.classScore}/30</td>
                      <td>{result.examScore}/70</td>
                      <td>{result.total}</td>
                      <td><span className={`badge ${getGradeBadgeClass(result.grade)}`}>{result.grade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
