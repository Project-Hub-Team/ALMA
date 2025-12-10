import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { MdPeople, MdSchool, MdAttachMoney, MdTrendingUp } from 'react-icons/md';
import { getAllStudents, getAllTeachers, readAllRecords } from '../../utils/database';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    pendingFees: 0,
    activeClasses: 13
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [studentsResult, teachersResult, feesResult, classesResult, usersResult] = await Promise.all([
        getAllStudents(),
        getAllTeachers(),
        readAllRecords('fees').catch(() => ({ success: true, data: [] })),
        readAllRecords('classes').catch(() => ({ success: true, data: [] })),
        readAllRecords('users').catch(() => ({ success: true, data: [] }))
      ]);

      // Count users by role (primary source)
      let studentCount = 0;
      let teacherCount = 0;

      if (usersResult.success && usersResult.data) {
        studentCount = usersResult.data.filter(u => u.role === 'student').length;
        teacherCount = usersResult.data.filter(u => u.role === 'teacher').length;
      }

      // Fallback to dedicated tables if users table is empty
      if (studentCount === 0 && studentsResult.data?.length > 0) {
        studentCount = studentsResult.data.length;
      }
      if (teacherCount === 0 && teachersResult.data?.length > 0) {
        teacherCount = teachersResult.data.length;
      }

      // Calculate pending fees
      let totalPendingFees = 0;
      if (feesResult.success && feesResult.data) {
        feesResult.data.forEach(fee => {
          if (fee.status === 'pending' || fee.balance > 0) {
            totalPendingFees += fee.balance || fee.amount || 0;
          }
        });
      }

      const newStats = {
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        pendingFees: totalPendingFees,
        activeClasses: (classesResult.success && classesResult.data) ? classesResult.data.filter(c => c.isActive !== false).length : 0
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard">
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
            <h2 className="text-2xl font-bold mb-2">Administrator Dashboard</h2>
            <p className="text-primary-100">Manage students, teachers, and school operations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <p className="text-sm text-gray-600 mb-1">Total Teachers</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalTeachers}</p>
              </div>
              <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                <MdSchool className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Fees</p>
                <p className="text-3xl font-bold text-gray-800">GH₵ {stats.pendingFees}</p>
              </div>
              <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                <MdAttachMoney className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Classes</p>
                <p className="text-3xl font-bold text-gray-800">{stats.activeClasses}</p>
              </div>
              <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                <MdTrendingUp className="text-white" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
